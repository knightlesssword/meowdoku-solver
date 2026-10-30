/* Meowdoku Solver - application logic
   This file is loaded with defer from index.html and wrapped in an IIFE.

   Board state is row-major: cells[r * n + c] is a colour index or -1.
   Manual cats are board cell indices in the same coordinate model.
   Colours are persisted by their stable index in COLORS, never by hex value,
   so saved puzzles stay readable when theme colours change. */

(() => {
"use strict";

/* ------------------------------------------------------------------
   Constants and state
   ------------------------------------------------------------------ */

/* Palette order is part of the saved data format: `cells` stores these
   indices. Do not reorder existing entries; append new colours instead. */
const COLORS = [
  { name: "Light green", hex: "#b9edaa", ink: "#1a1a1a", eye: "#ffffff" },
  { name: "Light pink",  hex: "#ffc8dc", ink: "#1a1a1a", eye: "#ffffff" },
  { name: "Hot pink",    hex: "#f34b9c", ink: "#1a1a1a", eye: "#ffffff" },
  { name: "Red",         hex: "#ed5559", ink: "#1a1a1a", eye: "#ffffff" },
  { name: "Blue",        hex: "#5299f5", ink: "#1a1a1a", eye: "#ffffff" },
  { name: "Navy blue",   hex: "#253d78", ink: "#ffffff", eye: "#1a1a1a" },
  { name: "Teal",        hex: "#39c6b0", ink: "#1a1a1a", eye: "#ffffff" },
  { name: "Grey",        hex: "#9aa5b5", ink: "#1a1a1a", eye: "#ffffff" },
  { name: "Brown",       hex: "#9a5f3c", ink: "#ffffff", eye: "#1a1a1a" },
  { name: "Purple",      hex: "#a78bfa", ink: "#1a1a1a", eye: "#ffffff" },
  { name: "Orange",      hex: "#ff9d43", ink: "#1a1a1a", eye: "#ffffff" },
  { name: "Yellow",      hex: "#f5d65e", ink: "#1a1a1a", eye: "#ffffff" }
];

/* Search budget. Hitting either limit makes candidate lists provisional and
   suppresses forced-placement claims. */
const MAX_SOLUTIONS = 20000;
const SEARCH_TIME_MS = 3000;
const MAX_HISTORY = 40;
const STORAGE_PREFIX = "cat-solver:";
const THEME_KEY = "cat-solver-theme";
const AUTOSAVE_KEY = "meowdoku:autosave:v1";

const $ = (id) => document.getElementById(id);

const dom = {
  board: $("board"),
  boardShell: $("boardShell"),
  colRuler: $("colRuler"),
  rowRuler: $("rowRuler"),
  palette: $("palette"),
  activeMode: $("activeMode"),
  paintHint: $("paintHint"),
  sizeSelect: $("sizeSelect"),
  puzzleName: $("puzzleName"),
  boardCount: $("boardCount"),
  paintedStat: $("paintedStat"),
  colourStat: $("colourStat"),
  catStat: $("catStat"),
  diagnostics: $("diagnostics"),
  diagBadge: $("diagBadge"),
  nextResult: $("nextResult"),
  nextBtn: $("nextBtn"),
  applyStepBtn: $("applyStepBtn"),
  candidateResults: $("candidateResults"),
  candidateToggle: $("candidateToggle"),
  candidateSubtitle: $("candidateSubtitle"),
  history: $("history"),
  clearHistoryBtn: $("clearHistoryBtn"),
  undoBtn: $("undoBtn"),
  redoBtn: $("redoBtn"),
  validateBtn: $("validateBtn"),
  solveBtn: $("solveBtn"),
  clearBtn: $("clearBtn"),
  removeCatsBtn: $("removeCatsBtn"),
  themeBtn: $("themeBtn"),
  helpBtn: $("helpBtn"),
  fileBtn: $("fileBtn"),
  fileMenu: $("fileMenu"),
  saveBtn: $("saveBtn"),
  loadBtn: $("loadBtn"),
  importBtn: $("importBtn"),
  exportBtn: $("exportBtn"),
  topStatus: $("topStatus"),
  headerStatus: $("headerStatus"),
  toastRegion: $("toastRegion"),
  modal: $("modal"),
  modalTitle: $("modalTitle"),
  modalSubtitle: $("modalSubtitle"),
  modalBody: $("modalBody"),
  modalActions: $("modalActions"),
  modalClose: $("modalClose"),
  importInput: $("importInput"),
  themeColor: $("themeColor")
};

const modeButtons = Array.from(document.querySelectorAll(".segmented [data-mode]"));

/* User-owned board state. `cells` is row-major with -1 for unpainted and
   `cats` holds manual cat cell indices. Solver results, undo stacks, and
   highlights are derived or transient and are invalidated by board changes. */
let n = 8;
let cells = Array(n * n).fill(-1);
let cats = new Set();
let selected = 0;
let mode = "paint";
let theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
let showCandidates = true;

let undoStack = [];
let redoStack = [];
let history = [];

let solver = null;
let lastAnalysis = null;
let lastApplied = null;
let isSolving = false;

let focusIndex = 0;
let boardCellEls = [];
let highlightedCells = new Set();
let highlightTimer = 0;

let isDragging = false;
let dragPointerId = null;
let dragSnapshot = null;
let dragUndoPushed = false;
let dragVisited = new Set();
let dragChanges = [];
let dragMode = "paint";
let dragColor = 0;

let activeDialog = null;

/* ------------------------------------------------------------------
   Small utilities
   ------------------------------------------------------------------ */

/* Board indices are row-major: index = r * n + c. User-facing coordinates are
   1-based; rc() is the single conversion back to 0-based row and column. */
const rc = (index) => ({ r: Math.floor(index / n), c: index % n });
const coord = (index) => {
  const { r, c } = rc(index);
  return `r${r + 1}·c${c + 1}`;
};
const coordSpaced = (index) => {
  const { r, c } = rc(index);
  return `r${r + 1} · c${c + 1}`;
};
const colorName = (index) => COLORS[index] ? COLORS[index].name : "Unknown";
const lowerColorName = (index) => colorName(index).toLowerCase();
const plural = (count, singular, pluralWord) => count === 1 ? singular : (pluralWord || singular + "s");
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Return the in-bounds cell indices around `index`.
 * The default is the four orthogonal neighbours, which defines colour-region
 * connectivity. Pass `true` as the second argument for all eight neighbours,
 * used by the no-touching rule for cats.
 */
function neighbours(index, diagonal = false) {
  const { r, c } = rc(index);
  const out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      if (!diagonal && Math.abs(dr) + Math.abs(dc) !== 1) continue;
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && rr < n && cc >= 0 && cc < n) out.push(rr * n + cc);
    }
  }
  return out;
}

function hasBoardContent() {
  return cells.some((value) => value >= 0) || cats.size > 0;
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function icon(name, className = "icon") {
  return `<svg class="${className}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;
}

function swatchChip(colorIndex, className = "swatch-chip") {
  const color = COLORS[colorIndex] || COLORS[0];
  return `<span class="${className}" style="--swatch:${color.hex};--swatch-ink:${color.ink}" aria-hidden="true"></span>`;
}

function formatTime(timestamp) {
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (_) {
    return "";
  }
}

function formatDate(timestamp) {
  try {
    return new Date(timestamp).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
  } catch (_) {
    return "Saved earlier";
  }
}

function makeEmptyState(iconName, message, smallText = "") {
  const wrap = document.createElement("div");
  wrap.className = "empty-state";
  wrap.innerHTML = `<span class="empty-icon">${icon(iconName, "icon icon-lg")}</span><p></p>${smallText ? "<small></small>" : ""}`;
  wrap.querySelector("p").textContent = message;
  if (smallText) wrap.querySelector("small").textContent = smallText;
  return wrap;
}

function makeNotice(tone, title, message, smallText = "") {
  const notice = document.createElement("div");
  notice.className = `notice ${tone}`;
  const iconName = tone === "success" ? "check" : tone === "danger" || tone === "warning" ? "alert" : "info";
  notice.innerHTML = `<span class="notice-icon">${icon(iconName, "icon icon-sm")}</span><div><strong></strong><p></p>${smallText ? "<small></small>" : ""}</div>`;
  notice.querySelector("strong").textContent = title;
  notice.querySelector("p").textContent = message;
  if (smallText) notice.querySelector("small").textContent = smallText;
  return notice;
}

/* ------------------------------------------------------------------
   Theme
   ------------------------------------------------------------------ */

function updateThemeButton() {
  const goingTo = theme === "dark" ? "light" : "dark";
  dom.themeBtn.innerHTML = icon(goingTo === "light" ? "sun" : "moon");
  const label = `Switch to ${goingTo} theme`;
  dom.themeBtn.setAttribute("aria-label", label);
  dom.themeBtn.title = label;
}

function applyTheme(nextTheme, { persist = true } = {}) {
  theme = nextTheme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  if (dom.themeColor) dom.themeColor.setAttribute("content", theme === "light" ? "#f4f1ea" : "#0b1016");
  if (persist) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  }
  updateThemeButton();
}

/* ------------------------------------------------------------------
   Toasts
   ------------------------------------------------------------------ */

function toast(message, tone = "info", duration = 4200) {
  const el = document.createElement("div");
  el.className = `toast ${tone}`;
  el.setAttribute("role", tone === "error" ? "alert" : "status");
  const iconName = tone === "success" ? "check" : tone === "warning" || tone === "error" ? "alert" : "info";
  el.innerHTML = `<span class="toast-icon">${icon(iconName, "icon icon-sm")}</span><span class="toast-message"></span><button type="button" class="toast-close" aria-label="Dismiss notification">${icon("close", "icon icon-xs")}</button>`;
  el.querySelector(".toast-message").textContent = message;

  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    el.remove();
  };
  const timer = window.setTimeout(remove, duration);
  el.querySelector(".toast-close").addEventListener("click", () => {
    window.clearTimeout(timer);
    remove();
  });

  dom.toastRegion.append(el);
  while (dom.toastRegion.children.length > 3) {
    dom.toastRegion.firstElementChild.remove();
  }
}

/* ------------------------------------------------------------------
   Dialog
   ------------------------------------------------------------------ */

function makeDialogButton(label, { variant = "", value = null, autofocus = false } = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `btn${variant ? " " + variant : ""}`;
  button.textContent = label;
  if (autofocus) button.setAttribute("data-autofocus", "true");
  button.addEventListener("click", () => closeDialog(value));
  return button;
}

function openDialog({ title, subtitle = "", body = null, actions = [], initialFocus = null }) {
  if (dom.modal.open) return Promise.resolve(null);
  const active = document.activeElement;
  const returnFocus = active instanceof HTMLElement && active !== document.body ? active : dom.fileBtn;

  return new Promise((resolve) => {
    activeDialog = { resolve, returnFocus, result: null };
    dom.modalTitle.textContent = title;
    dom.modalSubtitle.textContent = subtitle;
    dom.modalSubtitle.hidden = !subtitle;
    dom.modalBody.replaceChildren(body || document.createTextNode(""));
    dom.modalActions.replaceChildren(...actions);
    document.body.classList.add("modal-open");
    dom.modal.showModal();
    window.requestAnimationFrame(() => {
      const target = initialFocus
        || dom.modalBody.querySelector("[data-autofocus]")
        || dom.modalActions.querySelector("[data-autofocus]")
        || dom.modalActions.querySelector("button")
        || dom.modalClose;
      target?.focus();
    });
  });
}

function closeDialog(value = null) {
  if (!dom.modal.open) return;
  if (activeDialog) activeDialog.result = value;
  dom.modal.close();
}

function confirmDialog({ title, message, confirmLabel = "Confirm", danger = false }) {
  const body = document.createElement("p");
  body.className = "confirm-message";
  body.textContent = message;
  const cancel = makeDialogButton("Cancel", { variant: "ghost", value: false });
  const confirm = makeDialogButton(confirmLabel, {
    variant: danger ? "danger-solid" : "primary",
    value: true
  });
  return openDialog({
    title,
    body,
    actions: [cancel, confirm],
    initialFocus: cancel
  }).then((value) => value === true);
}

function openHelpDialog() {
  const body = document.createElement("div");
  body.className = "rules-content";
  body.innerHTML = `
    <section>
      <h3>The goal</h3>
      <p>Place cats so that every row and every column contains exactly one cat, and every used colour receives exactly one cat.</p>
    </section>
    <section>
      <h3>Hard rules</h3>
      <ul>
        <li><strong>One cat per colour.</strong> A used colour cannot receive two cats.</li>
        <li><strong>Manual cats are hard constraints.</strong> Any cat placed by hand must appear in every valid arrangement the solver finds.</li>
        <li><strong>One cat per row and column.</strong> With exactly ${n} colours on an ${n} × ${n} board, every row and column is covered.</li>
        <li><strong>No touching.</strong> Cats cannot occupy any of the eight neighbouring cells, including diagonals.</li>
        <li><strong>One connected region per colour.</strong> All cells of a colour must connect orthogonally. Diagonal contact does not connect a region.</li>
        <li><strong>Complete board.</strong> Every cell must be painted before the solver will search.</li>
      </ul>
    </section>
    <section>
      <h3>What the solver guarantees</h3>
      <p>A placement is called <strong>forced</strong> only when it occurs in every solution found. The solver never fills a gap with a heuristic guess.</p>
      <p>If the search reaches its limit of ${MAX_SOLUTIONS.toLocaleString()} solutions or ${(SEARCH_TIME_MS / 1000).toFixed(1)} seconds, candidate and deduction results are marked <strong>provisional</strong>. Forced placements are suppressed until the search can finish.</p>
      <p>If the search is capped before finding any solution, the result is reported as inconclusive — not as proof that the puzzle is impossible.</p>
    </section>
    <section>
      <h3>Keyboard</h3>
      <div class="key-list">
        <span><kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> move on the board</span>
        <span><kbd>Enter</kbd> / <kbd>Space</kbd> apply the current mode</span>
        <span><kbd>Ctrl</kbd> + <kbd>Z</kbd> undo</span>
        <span><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> redo</span>
        <span><kbd>Ctrl</kbd> + <kbd>S</kbd> save</span>
      </div>
    </section>
    <div class="rules-callout"><strong>Local-first.</strong> Saved puzzles stay in this browser. Solver cap: 20,000 solutions / 3 s; capped results are provisional. JSON import and export are available from the File menu.</div>
  `;
  const close = makeDialogButton("Got it", { variant: "primary", value: null, autofocus: true });
  return openDialog({
    title: "Rules & solver logic",
    subtitle: "How the constraints and deductions work",
    body,
    actions: [close],
    initialFocus: close
  });
}

/* ------------------------------------------------------------------
   Palette and mode
   ------------------------------------------------------------------ */

function buildPalette() {
  dom.palette.replaceChildren();
  COLORS.forEach((color, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "swatch";
    button.dataset.color = String(index);
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", String(index === selected));
    button.tabIndex = index === selected ? 0 : -1;
    button.title = color.name;
    button.innerHTML = `
      <span class="swatch-chip" style="--swatch:${color.hex};--swatch-ink:${color.ink}" aria-hidden="true">
        ${icon("check", "icon icon-xs swatch-check")}
      </span>
      <span class="swatch-label"></span>
    `;
    button.querySelector(".swatch-label").textContent = color.name;
    button.addEventListener("click", () => selectColor(index));
    button.addEventListener("keydown", handlePaletteKeydown);
    dom.palette.append(button);
  });
}

function updatePaletteState() {
  const buttons = Array.from(dom.palette.querySelectorAll(".swatch"));
  buttons.forEach((button, index) => {
    const checked = index === selected;
    button.setAttribute("aria-checked", String(checked));
    button.tabIndex = checked ? 0 : -1;
  });
}

function focusPaletteColor(index) {
  const buttons = Array.from(dom.palette.querySelectorAll(".swatch"));
  const target = buttons[clamp(index, 0, buttons.length - 1)];
  if (target) {
    target.focus();
    target.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
}

function handlePaletteKeydown(event) {
  const button = event.target.closest(".swatch");
  if (!button) return;
  const index = Number(button.dataset.color);
  let next = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % COLORS.length;
  else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + COLORS.length) % COLORS.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = COLORS.length - 1;
  if (next === null) return;
  event.preventDefault();
  selectColor(next);
  focusPaletteColor(next);
}

function selectColor(index) {
  if (!Number.isInteger(index) || index < 0 || index >= COLORS.length) return;
  selected = index;
  mode = "paint";
  renderMode();
}

function setMode(nextMode) {
  if (!["paint", "erase", "cat"].includes(nextMode)) return;
  mode = nextMode;
  renderMode();
}

function renderMode() {
  modeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
  });
  updatePaletteState();

  if (mode === "erase") {
    dom.activeMode.innerHTML = `<span class="erase-chip" aria-hidden="true">${icon("eraser", "icon icon-xs")}</span><span>Erasing · none</span>`;
    dom.paintHint.textContent = "Click or drag across cells to erase paint and any cat.";
  } else if (mode === "cat") {
    dom.activeMode.innerHTML = `<span class="swatch-chip" style="--swatch:${COLORS[selected].hex};--swatch-ink:${COLORS[selected].ink}" aria-hidden="true">${icon("cat", "icon icon-xs")}</span><span>Cat mode · paint colour ${colorName(selected)}</span>`;
    dom.paintHint.textContent = "Click a cell to place or remove a manual cat. Every cat is checked against the rules.";
  } else {
    dom.activeMode.innerHTML = `<span class="swatch-chip" style="--swatch:${COLORS[selected].hex};--swatch-ink:${COLORS[selected].ink}" aria-hidden="true"></span><span>Painting · ${colorName(selected)}</span>`;
    dom.paintHint.textContent = "Click or drag to paint. Painting a cell removes any cat on it.";
  }

  updateBoardCells();
}

/* ------------------------------------------------------------------
   Board construction and rendering
   ------------------------------------------------------------------ */

function buildBoard() {
  const count = n * n;
  focusIndex = clamp(focusIndex, 0, count - 1);

  dom.boardShell.style.setProperty("--n", n);
  dom.board.style.setProperty("--n", n);
  dom.colRuler.style.setProperty("--n", n);
  dom.rowRuler.style.setProperty("--n", n);
  dom.board.setAttribute("aria-rowcount", String(n));
  dom.board.setAttribute("aria-colcount", String(n));

  dom.colRuler.replaceChildren();
  dom.rowRuler.replaceChildren();
  for (let c = 0; c < n; c++) {
    const label = document.createElement("span");
    label.textContent = String(c + 1);
    dom.colRuler.append(label);
  }
  for (let r = 0; r < n; r++) {
    const label = document.createElement("span");
    label.textContent = String(r + 1);
    dom.rowRuler.append(label);
  }

  dom.board.replaceChildren();
  boardCellEls = [];
  const fragment = document.createDocumentFragment();
  for (let r = 0; r < n; r++) {
    const row = document.createElement("div");
    row.className = "board-row";
    row.setAttribute("role", "row");
    row.setAttribute("aria-rowindex", String(r + 1));
    for (let c = 0; c < n; c++) {
      const i = r * n + c;
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.index = String(i);
      cell.dataset.cat = "0";
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-rowindex", String(r + 1));
      cell.setAttribute("aria-colindex", String(c + 1));
      cell.tabIndex = i === focusIndex ? 0 : -1;
      row.append(cell);
      boardCellEls.push(cell);
    }
    fragment.append(row);
  }
  dom.board.append(fragment);
  updateBoardCells();
}

function updateRovingTabindex() {
  for (let i = 0; i < boardCellEls.length; i++) {
    boardCellEls[i].tabIndex = i === focusIndex ? 0 : -1;
  }
}

function cellActionDescription(isCat) {
  if (mode === "erase") return "Activate to erase this cell.";
  if (mode === "cat") return isCat ? "Activate to remove the cat." : "Activate to place a manual cat.";
  return `Activate to paint with ${colorName(selected)}.`;
}

function updateBoardCells() {
  const conflictSet = lastAnalysis?.conflicts || new Set();
  const candidateMap = solver?.candidateByCell || new Map();
  const currentStep = solver?.forcedSteps?.length ? solver.forcedSteps[solver.stepIndex] : null;
  const stepCell = currentStep ? currentStep.cell : -1;

  for (let i = 0; i < boardCellEls.length; i++) {
    const cell = boardCellEls[i];
    const colorIndex = cells[i];
    const isPainted = colorIndex >= 0;
    const isCat = cats.has(i);
    const candidateColor = candidateMap.get(i);
    const isCandidate = showCandidates && candidateColor !== undefined && !isCat;
    const isConflict = conflictSet.has(i);
    const isStep = stepCell === i;
    const isHighlighted = highlightedCells.has(i);
    const isInvalidCat = isCat && !isPainted;

    cell.classList.toggle("is-painted", isPainted);
    cell.classList.toggle("is-cat", isCat);
    cell.classList.toggle("is-candidate", isCandidate);
    cell.classList.toggle("is-conflict", isConflict);
    cell.classList.toggle("is-step", isStep);
    cell.classList.toggle("is-highlighted", isHighlighted);
    cell.classList.toggle("is-invalid-cat", isInvalidCat);

    if (isPainted) {
      const color = COLORS[colorIndex];
      cell.style.setProperty("--cell-bg", color.hex);
      cell.style.setProperty("--cell-ink", color.ink);
      cell.style.setProperty("--cell-eye", color.eye);
      cell.style.setProperty("--cat-eye", color.eye);
    } else if (isCat) {
      cell.style.setProperty("--cell-bg", "var(--cell-empty)");
      cell.style.setProperty("--cell-ink", "var(--danger-text)");
      cell.style.setProperty("--cell-eye", "var(--surface)");
      cell.style.setProperty("--cat-eye", "var(--surface)");
    } else {
      cell.style.removeProperty("--cell-bg");
      cell.style.removeProperty("--cell-ink");
      cell.style.removeProperty("--cell-eye");
      cell.style.removeProperty("--cat-eye");
    }

    if (isCat) {
      if (cell.dataset.cat !== "1") {
        cell.innerHTML = `${icon("cat", "cat-icon")}`;
        cell.dataset.cat = "1";
      }
    } else if (cell.dataset.cat !== "0") {
      cell.replaceChildren();
      cell.dataset.cat = "0";
    }

    const { r, c } = rc(i);
    let label = `Row ${r + 1}, column ${c + 1}. `;
    label += isPainted ? `${colorName(colorIndex)} cell. ` : "Empty cell. ";
    if (isCat) label += isPainted ? "Cat placed. " : "Cat placed on an unpainted cell. ";
    if (isCandidate) label += `Possible location for ${colorName(candidateColor)}. `;
    if (isConflict) label += "Conflict flagged. ";
    if (isStep) label += "Next deduction target. ";
    label += cellActionDescription(isCat);
    cell.setAttribute("aria-label", label);

    let title = `${coordSpaced(i)} · ${isPainted ? colorName(colorIndex) : "Unpainted"}`;
    if (isCat) title += " · cat";
    if (isCandidate) title += ` · candidate for ${colorName(candidateColor)}`;
    if (isConflict) title += " · conflict";
    if (isStep) title += " · next deduction";
    cell.title = title;
    if (isStep) cell.setAttribute("aria-current", "true");
    else cell.removeAttribute("aria-current");
    cell.tabIndex = i === focusIndex ? 0 : -1;
  }
}

function updateStats() {
  const painted = cells.reduce((total, value) => total + (value >= 0 ? 1 : 0), 0);
  const used = new Set(cells.filter((value) => value >= 0)).size;
  dom.paintedStat.textContent = String(painted);
  dom.colourStat.textContent = String(used);
  dom.catStat.textContent = String(cats.size);
  dom.boardCount.textContent = `${n * n} cells`;
}

function updateHeaderStatus() {
  let label = "Empty board";
  let tone = "neutral";

  if (isSolving || solver?.status === "searching") {
    label = "Solving…";
    tone = "accent";
  } else if (lastAnalysis?.errors?.length) {
    label = "Rule violations";
    tone = "danger";
  } else if (solver?.status === "blocked") {
    if (solver.blockedKind === "error" || solver.blockedKind === "invalid" || solver.blockedKind === "impossible") {
      label = solver.blockedKind === "error" ? "Solver error" : "Cannot solve";
      tone = "danger";
    } else if (solver.blockedKind === "incomplete") {
      label = "Board incomplete";
      tone = "warning";
    } else {
      label = "Nothing to solve";
      tone = "warning";
    }
  } else if (solver?.status === "unique") {
    label = "Unique solution";
    tone = "success";
  } else if (solver?.status === "ambiguous") {
    label = `${solver.found.toLocaleString()} solutions`;
    tone = "warning";
  } else if (solver?.status === "capped") {
    label = "Provisional results";
    tone = "warning";
  } else if (solver?.status === "none") {
    label = "No solution";
    tone = "danger";
  } else if (solver?.status === "inconclusive") {
    label = "Search inconclusive";
    tone = "warning";
  } else if (!lastAnalysis || lastAnalysis.empty) {
    label = "Empty board";
    tone = "neutral";
  } else if (lastAnalysis.complete) {
    label = "Ready to solve";
    tone = "accent";
  } else {
    label = "In progress";
    tone = "warning";
  }

  dom.topStatus.textContent = label;
  dom.headerStatus.dataset.tone = tone;
  dom.headerStatus.title = label;
}

function updateActionStates() {
  const empty = !hasBoardContent();
  dom.undoBtn.disabled = isSolving || undoStack.length === 0;
  dom.redoBtn.disabled = isSolving || redoStack.length === 0;
  dom.validateBtn.disabled = isSolving;
  dom.solveBtn.disabled = isSolving;
  dom.clearBtn.disabled = isSolving || empty;
  dom.removeCatsBtn.disabled = isSolving || cats.size === 0;
  dom.clearHistoryBtn.disabled = history.length === 0;
  dom.fileBtn.disabled = isSolving;
  dom.sizeSelect.disabled = isSolving;

  if (isSolving) closeFileMenu();

  const steps = solver?.forcedSteps || [];
  const hasStep = !isSolving && steps.length > 0 && solver.stepIndex < steps.length;
  dom.nextBtn.disabled = !hasStep || solver.stepIndex >= steps.length - 1;
  dom.applyStepBtn.disabled = !hasStep;

  if (isSolving) {
    dom.solveBtn.innerHTML = `<span class="spinner spinner-sm" aria-hidden="true"></span><span>Solving…</span>`;
  } else {
    dom.solveBtn.innerHTML = `${icon("search")}<span>Solve puzzle</span>`;
  }
}

/* ------------------------------------------------------------------
   History and undo
   ------------------------------------------------------------------ */

function historyLabel(kind) {
  const labels = {
    paint: "Paint",
    erase: "Erase",
    cat: "Cat",
    board: "Board",
    clear: "Clear",
    validate: "Validate",
    solve: "Solve",
    forced: "Deduction",
    undo: "Undo",
    redo: "Redo",
    import: "Import",
    export: "Export",
    save: "Save",
    load: "Load",
    manual: "Manual",
    history: "History"
  };
  return labels[kind] || "Activity";
}

function historyIcon(kind) {
  if (kind === "paint" || kind === "erase" || kind === "cat" || kind === "board" || kind === "manual") return "brush";
  if (kind === "validate") return "check";
  if (kind === "solve" || kind === "forced") return "search";
  if (kind === "undo" || kind === "redo") return "history";
  if (kind === "import" || kind === "export" || kind === "save" || kind === "load") return "file";
  if (kind === "clear") return "close";
  return "history";
}

function historyTone(kind) {
  if (kind === "validate") return "validate";
  if (kind === "solve" || kind === "forced") return "solve";
  if (kind === "undo" || kind === "redo") return "undo";
  if (kind === "import" || kind === "export" || kind === "save" || kind === "load") return "file";
  if (kind === "clear") return "clear";
  return "edit";
}

function addHistory(kind, message) {
  history.unshift({ kind, message, time: Date.now() });
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  renderHistory();
  updateActionStates();
}

function renderHistory() {
  if (!history.length) {
    dom.history.replaceChildren(makeEmptyState("history", "No activity yet.", "Board edits, validations, and solver findings will appear here."));
    return;
  }

  const fragment = document.createDocumentFragment();
  history.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.setAttribute("role", "listitem");
    item.innerHTML = `
      <span class="history-icon ${historyTone(entry.kind)}">${icon(historyIcon(entry.kind), "icon icon-sm")}</span>
      <div class="history-content">
        <span class="history-kind">${historyLabel(entry.kind)}</span>
        <p class="history-message"></p>
      </div>
      <time class="history-time"></time>
    `;
    item.querySelector(".history-message").textContent = entry.message;
    const time = item.querySelector(".history-time");
    time.textContent = formatTime(entry.time);
    time.dateTime = new Date(entry.time).toISOString();
    time.title = new Date(entry.time).toLocaleString();
    fragment.append(item);
  });
  dom.history.replaceChildren(fragment);
}

/* Undo snapshots capture only user-owned board data. Applying one invalidates
   derived analysis, solver results, and highlights rather than storing them. */
function snapshot() {
  return { cells: cells.slice(), cats: [...cats] };
}

function updateUndoButtons() {
  dom.undoBtn.disabled = isSolving || undoStack.length === 0;
  dom.redoBtn.disabled = isSolving || redoStack.length === 0;
}

/* Snapshot the state before a user-visible edit. The stack is bounded to 100
   entries, and any new edit clears the redo branch. */
function pushUndoSnapshot(snapshotValue = snapshot()) {
  undoStack.push(snapshotValue);
  if (undoStack.length > 100) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}

function resetUndo() {
  undoStack = [];
  redoStack = [];
  updateUndoButtons();
}

function applySnapshot(snapshotValue) {
  cells = snapshotValue.cells.slice();
  cats = new Set(snapshotValue.cats);
  solver = null;
  lastApplied = null;
  isSolving = false;
  highlightedCells.clear();
  refreshBoardAndDiagnostics();
  renderSolverPanels();
}

function undo() {
  if (isSolving || !undoStack.length) return;
  redoStack.push(snapshot());
  const previous = undoStack.pop();
  applySnapshot(previous);
  addHistory("undo", "Reverted the last board edit.");
  toast("Undid the last board edit.", "info");
  updateUndoButtons();
}

function redo() {
  if (isSolving || !redoStack.length) return;
  undoStack.push(snapshot());
  const next = redoStack.pop();
  applySnapshot(next);
  addHistory("redo", "Restored the next board state.");
  toast("Redid the board edit.", "info");
  updateUndoButtons();
}


/* ------------------------------------------------------------------
   Board interaction
   ------------------------------------------------------------------ */

function setCellAction(index, action, colorIndex) {
  if (action === "paint") {
    if (cells[index] === colorIndex && !cats.has(index)) return false;
    cells[index] = colorIndex;
    cats.delete(index);
    return true;
  }
  if (action === "erase") {
    if (cells[index] === -1 && !cats.has(index)) return false;
    cells[index] = -1;
    cats.delete(index);
    return true;
  }
  if (action === "cat") {
    if (cats.has(index)) {
      cats.delete(index);
    } else {
      cats.add(index);
    }
    return true;
  }
  return false;
}

function describeAction(action, changedIndices, colorIndex) {
  if (!changedIndices.length) return "";
  if (action === "paint") {
    if (changedIndices.length === 1) return `Painted ${coord(changedIndices[0])} with ${colorName(colorIndex)}.`;
    return `Painted ${changedIndices.length} cells with ${colorName(colorIndex)}.`;
  }
  if (action === "erase") {
    if (changedIndices.length === 1) return `Erased ${coord(changedIndices[0])}.`;
    return `Erased ${changedIndices.length} cells.`;
  }
  const placed = changedIndices.filter((index) => cats.has(index)).length;
  const removed = changedIndices.length - placed;
  if (changedIndices.length === 1) {
    return placed
      ? `Placed a cat at ${coord(changedIndices[0])}.`
      : `Removed the cat at ${coord(changedIndices[0])}.`;
  }
  return `Placed ${placed} ${plural(placed, "cat")} and removed ${removed} ${plural(removed, "cat")}.`;
}

function clearDerivedForBoardChange({ applied = null } = {}) {
  const hadDerived = solver !== null || isSolving || lastApplied !== null;
  solver = null;
  isSolving = false;
  lastApplied = applied;
  highlightedCells.clear();
  window.clearTimeout(highlightTimer);
  if (hadDerived) {
    renderSolverPanels();
    updateCandidateToggle();
  }
}

function performSingleAction(index) {
  if (isSolving) return;
  const before = snapshot();
  const action = mode;
  const colorIndex = selected;
  const changed = setCellAction(index, action, colorIndex);
  if (!changed) return;
  pushUndoSnapshot(before);
  clearDerivedForBoardChange();
  refreshBoardAndDiagnostics();
  addHistory(action, describeAction(action, [index], colorIndex));
}

function startDrag(pointerId, index) {
  isDragging = true;
  dragPointerId = pointerId;
  dragSnapshot = snapshot();
  dragUndoPushed = false;
  dragVisited = new Set();
  dragChanges = [];
  dragMode = mode;
  dragColor = selected;
  applyDragCell(index);
}

function applyDragCell(index) {
  if (!isDragging || dragVisited.has(index)) return;
  dragVisited.add(index);
  const changed = setCellAction(index, dragMode, dragColor);
  if (!changed) return;
  if (!dragUndoPushed) {
    pushUndoSnapshot(dragSnapshot);
    dragUndoPushed = true;
  }
  dragChanges.push(index);
  clearDerivedForBoardChange();
  refreshBoardAndDiagnostics();
}

function releaseDragCapture(pointerId) {
  if (pointerId === null || !dom.board.hasPointerCapture) return;
  try {
    if (dom.board.hasPointerCapture(pointerId)) dom.board.releasePointerCapture(pointerId);
  } catch (_) {}
}

function endDrag() {
  if (!isDragging) return;
  const changes = dragChanges.slice();
  const action = dragMode;
  const colorIndex = dragColor;
  const pointerId = dragPointerId;
  isDragging = false;
  dragPointerId = null;
  dragSnapshot = null;
  dragVisited = new Set();
  dragChanges = [];
  releaseDragCapture(pointerId);
  if (changes.length) {
    addHistory(action, describeAction(action, changes, colorIndex));
  }
}

let suppressNextClick = false;

function handleBoardPointerDown(event) {
  if (event.button !== 0 || isSolving) return;
  const cell = event.target.closest(".cell");
  if (!cell || !dom.board.contains(cell)) return;
  event.preventDefault();
  suppressNextClick = true;
  const index = Number(cell.dataset.index);
  focusCell(index, { preventScroll: true });
  if (dom.board.setPointerCapture) {
    try { dom.board.setPointerCapture(event.pointerId); } catch (_) {}
  }
  startDrag(event.pointerId, index);
}

function handleBoardPointerMove(event) {
  if (!isDragging || event.pointerId !== dragPointerId) return;
  event.preventDefault();
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const cell = element && element.closest ? element.closest(".cell") : null;
  if (cell && dom.board.contains(cell)) {
    applyDragCell(Number(cell.dataset.index));
  }
}

function handleBoardPointerUp(event) {
  if (!isDragging || event.pointerId !== dragPointerId) return;
  endDrag();
}

function handleBoardClick(event) {
  if (isSolving) return;
  const cell = event.target.closest(".cell");
  if (!cell || !dom.board.contains(cell)) return;
  if (event.detail !== 0) {
    if (suppressNextClick) suppressNextClick = false;
    return;
  }
  suppressNextClick = false;
  performSingleAction(Number(cell.dataset.index));
}

function focusCell(index, { preventScroll = false } = {}) {
  focusIndex = clamp(index, 0, n * n - 1);
  const cell = boardCellEls[focusIndex];
  if (!cell) return;
  updateRovingTabindex();
  cell.focus({ preventScroll });
  if (!preventScroll) cell.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function handleBoardKeydown(event) {
  const cell = event.target.closest(".cell");
  if (!cell) return;
  const index = Number(cell.dataset.index);
  const { r, c } = rc(index);
  let next = null;
  if (event.key === "ArrowLeft") next = c > 0 ? index - 1 : index;
  else if (event.key === "ArrowRight") next = c < n - 1 ? index + 1 : index;
  else if (event.key === "ArrowUp") next = r > 0 ? index - n : index;
  else if (event.key === "ArrowDown") next = r < n - 1 ? index + n : index;
  else if (event.key === "Home") next = (event.ctrlKey || event.metaKey) ? 0 : r * n;
  else if (event.key === "End") next = (event.ctrlKey || event.metaKey) ? n * n - 1 : r * n + n - 1;
  else return;
  event.preventDefault();
  focusCell(next);
}

function handleBoardFocusIn(event) {
  const cell = event.target.closest(".cell");
  if (!cell) return;
  focusIndex = Number(cell.dataset.index);
  updateRovingTabindex();
}

function highlightCells(indices) {
  const valid = [...new Set(indices.filter((index) => Number.isInteger(index) && index >= 0 && index < n * n))];
  if (!valid.length) return;
  highlightedCells = new Set(valid);
  window.clearTimeout(highlightTimer);
  updateBoardCells();

  const rect = dom.boardShell.getBoundingClientRect();
  if (rect.top < 0 || rect.bottom > window.innerHeight) {
    dom.boardShell.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
  }

  toast(`Highlighted ${valid.length} ${plural(valid.length, "cell")}.`, "info", 2400);
  highlightTimer = window.setTimeout(() => {
    highlightedCells.clear();
    updateBoardCells();
  }, 2400);
}

/* ------------------------------------------------------------------
   Structural analysis
   ------------------------------------------------------------------ */

function makeIssue(message, cellsList = [], severity = "error") {
  return { message, cells: cellsList, severity };
}

/**
 * Flood-fill every painted cell into orthogonal components of one colour.
 * Two groups with the same colour mean that colour is disconnected, which is
 * a rule violation; diagonal contact deliberately does not join regions.
 */
function connectedComponents() {
  const unseen = new Set();
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] >= 0) unseen.add(i);
  }
  const components = [];
  while (unseen.size) {
    const start = unseen.values().next().value;
    const color = cells[start];
    const stack = [start];
    const component = [];
    unseen.delete(start);
    while (stack.length) {
      const index = stack.pop();
      component.push(index);
      for (const neighbour of neighbours(index)) {
        if (unseen.has(neighbour) && cells[neighbour] === color) {
          unseen.delete(neighbour);
          stack.push(neighbour);
        }
      }
    }
    components.push({ color, cells: component });
  }
  return components;
}

/**
 * Build the live structural model: painted/unpainted cells, used colours,
 * connected components, manual-cat conflicts, and highlighted conflict cells.
 * This is a pure analysis pass; it never mutates the board or searches.
 * Errors block solving; warnings only describe an incomplete board.
 */
function analyze() {
  const paintedIndices = [];
  const unpaintedIndices = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] >= 0) paintedIndices.push(i);
    else unpaintedIndices.push(i);
  }

  const used = [...new Set(paintedIndices.map((index) => cells[index]))].sort((a, b) => a - b);
  const comps = connectedComponents();
  const byColor = new Map();
  for (const component of comps) {
    if (!byColor.has(component.color)) byColor.set(component.color, []);
    byColor.get(component.color).push(component);
  }

  const errors = [];
  const warnings = [];
  const conflicts = new Set();
  const empty = paintedIndices.length === 0 && cats.size === 0;

  if (empty) {
    return {
      empty: true,
      complete: false,
      painted: 0,
      used: [],
      comps: [],
      byColor,
      errors,
      warnings,
      issues: [],
      conflicts
    };
  }

  if (unpaintedIndices.length) {
    warnings.push(makeIssue(
      `${unpaintedIndices.length} ${plural(unpaintedIndices.length, "cell")} still unpainted. Every cell needs a colour before the solver can search.`,
      unpaintedIndices,
      "warning"
    ));
  }

  for (const color of used) {
    const groups = byColor.get(color) || [];
    if (groups.length !== 1) {
      const cellsList = groups.flatMap((group) => group.cells);
      errors.push(makeIssue(
        `${colorName(color)} forms ${groups.length} separate orthogonal regions. Each colour must form exactly one connected region.`,
        cellsList,
        "error"
      ));
      cellsList.forEach((index) => conflicts.add(index));
    }
  }

  const complete = unpaintedIndices.length === 0;
  if (complete) {
    if (used.length !== n) {
      errors.push(makeIssue(
        `The board is fully painted with ${used.length} ${plural(used.length, "colour")}, but a valid arrangement needs exactly ${n} — one per row and column.`,
        [],
        "error"
      ));
    }
  } else if (used.length > n) {
    errors.push(makeIssue(
      `${used.length} colours are in use, but an ${n} × ${n} board can only use ${n} — one per row and column.`,
      [],
      "error"
    ));
  } else if (used.length < n) {
    warnings.push(makeIssue(
      `${used.length} of ${n} colours used so far. A completed puzzle needs exactly ${n}.`,
      [],
      "warning"
    ));
  }

  const rowCats = Array(n).fill(0);
  const colCats = Array(n).fill(0);
  const colorCats = new Map();

  for (const index of cats) {
    const color = cells[index];
    if (color < 0) {
      errors.push(makeIssue(
        `A cat at ${coord(index)} is on an unpainted cell. Paint the cell or remove the cat.`,
        [index],
        "error"
      ));
      conflicts.add(index);
    }
    const { r, c } = rc(index);
    rowCats[r] += 1;
    colCats[c] += 1;
    if (color >= 0) {
      if (!colorCats.has(color)) colorCats.set(color, []);
      colorCats.get(color).push(index);
    }

    for (const neighbour of neighbours(index, true)) {
      if (neighbour > index && cats.has(neighbour)) {
        const diagonal = rc(index).r !== rc(neighbour).r && rc(index).c !== rc(neighbour).c;
        errors.push(makeIssue(
          `Cats at ${coord(index)} and ${coord(neighbour)} touch${diagonal ? " diagonally" : ""}. Cats cannot touch, including at corners.`,
          [index, neighbour],
          "error"
        ));
        conflicts.add(index);
        conflicts.add(neighbour);
      }
    }
  }

  rowCats.forEach((count, row) => {
    if (count > 1) {
      const catCells = [...cats].filter((index) => rc(index).r === row);
      errors.push(makeIssue(
        `Row ${row + 1} has ${count} manual cats. At most one cat may sit in each row.`,
        catCells,
        "error"
      ));
      catCells.forEach((index) => conflicts.add(index));
    }
  });

  colCats.forEach((count, col) => {
    if (count > 1) {
      const catCells = [...cats].filter((index) => rc(index).c === col);
      errors.push(makeIssue(
        `Column ${col + 1} has ${count} manual cats. At most one cat may sit in each column.`,
        catCells,
        "error"
      ));
      catCells.forEach((index) => conflicts.add(index));
    }
  });

  for (const [color, catCells] of colorCats) {
    if (catCells.length > 1) {
      errors.push(makeIssue(
        `${colorName(color)} has ${catCells.length} manual cats. Each colour may receive only one cat.`,
        catCells,
        "error"
      ));
      catCells.forEach((index) => conflicts.add(index));
    }
  }

  return {
    empty: false,
    complete,
    painted: paintedIndices.length,
    used,
    comps,
    byColor,
    errors,
    warnings,
    issues: [...errors, ...warnings],
    conflicts
  };
}

function renderDiagnostics(analysis) {
  lastAnalysis = analysis;
  const issues = analysis.issues;

  if (analysis.empty) {
    dom.diagBadge.textContent = "Empty";
    dom.diagBadge.dataset.tone = "neutral";
    dom.diagnostics.replaceChildren(makeEmptyState(
      "grid",
      "No cells painted yet.",
      "Paint the board to start live structural checks."
    ));
    return;
  }

  if (analysis.errors.length) {
    dom.diagBadge.textContent = `${analysis.errors.length} ${plural(analysis.errors.length, "violation")}`;
    dom.diagBadge.dataset.tone = "danger";
  } else if (analysis.warnings.length) {
    dom.diagBadge.textContent = `${analysis.warnings.length} ${plural(analysis.warnings.length, "warning")}`;
    dom.diagBadge.dataset.tone = "warning";
  } else {
    dom.diagBadge.textContent = "Structure OK";
    dom.diagBadge.dataset.tone = "success";
  }

  if (!issues.length) {
    dom.diagnostics.replaceChildren(makeNotice(
      "success",
      "All structural checks pass",
      analysis.complete
        ? "The board is complete and structurally valid. Run the solver to test whether a cat arrangement exists."
        : "No structural issues found so far. Continue painting to complete the board."
    ));
    return;
  }

  const list = document.createElement("div");
  list.className = "issue-list";
  for (const issue of issues) {
    const clickable = issue.cells && issue.cells.length > 0;
    const item = document.createElement(clickable ? "button" : "div");
    if (clickable) {
      item.type = "button";
      item.title = "Highlight the relevant cells";
      item.addEventListener("click", () => highlightCells(issue.cells));
    }
    item.className = `issue ${issue.severity}${clickable ? " is-actionable" : ""}`;
    item.innerHTML = `<span class="issue-icon">${icon(issue.severity === "error" ? "alert" : "info", "icon icon-sm")}</span><span class="issue-text"></span>`;
    item.querySelector(".issue-text").textContent = issue.message;
    list.append(item);
  }
  dom.diagnostics.replaceChildren(list);
}

function refreshBoardAndDiagnostics() {
  const analysis = analyze();
  lastAnalysis = analysis;
  renderDiagnostics(analysis);
  updateBoardCells();
  updateStats();
  updateHeaderStatus();
  updateActionStates();
}

/* ------------------------------------------------------------------
   Solver
   ------------------------------------------------------------------ */

/**
 * Backtracking search for one cat per used colour such that no two cats share
 * a row, a column, or any of the eight touching cells.
 *
 * Manual cats are hard constraints: their colour must use that exact cell.
 * At each node the unassigned colour with the fewest legal cells is chosen
 * next (minimum remaining values), while `assigned`, `rowUsed`, `colUsed`, and
 * `usedCells` hold the partial assignment.
 *
 * Every complete assignment counts as one solution. As solutions are recorded,
 * `possible` accumulates the cells each colour occupied and `cellOccurrences`
 * counts how many solutions used each cell. These drive the candidate lists.
 *
 * MAX_SOLUTIONS and SEARCH_TIME_MS bound the work. Hitting either limit marks
 * the result capped: solution counts become lower bounds, candidate lists may
 * be incomplete, and forced placements are deliberately not claimed.
 *
 * A forced step is a placement shared by every enumerated solution - either
 * the only remaining candidate for a colour or a cell used by all of them.
 */
function searchSolutions(analysis) {
  const colors = analysis.used.slice();
  const colorCells = new Map(colors.map((color) => [color, []]));
  for (let i = 0; i < cells.length; i++) {
    if (colorCells.has(cells[i])) colorCells.get(cells[i]).push(i);
  }

  const manualByColor = new Map();
  for (const index of cats) {
    const color = cells[index];
    if (!manualByColor.has(color)) manualByColor.set(color, []);
    manualByColor.get(color).push(index);
  }

  const possible = new Map(colors.map((color) => [color, new Set()]));
  const cellOccurrences = new Map();
  const rowUsed = new Set();
  const colUsed = new Set();
  const assigned = new Map();
  const usedCells = new Set();

  let found = 0;
  let hitSolutionCap = false;
  let timedOut = false;
  let nodes = 0;
  const startedAt = performance.now();

  function recordSolution() {
    found += 1;
    for (const [color, index] of assigned) {
      possible.get(color).add(index);
      cellOccurrences.set(index, (cellOccurrences.get(index) || 0) + 1);
    }
  }

  function recurse() {
    if (found >= MAX_SOLUTIONS) {
      hitSolutionCap = true;
      return;
    }
    nodes += 1;
    if ((nodes & 255) === 0 && performance.now() - startedAt > SEARCH_TIME_MS) {
      timedOut = true;
      return;
    }
    if (assigned.size === colors.length) {
      recordSolution();
      return;
    }

    let bestColor = null;
    let bestCandidates = null;

    for (const color of colors) {
      if (assigned.has(color)) continue;
      let candidates = colorCells.get(color).filter((index) => {
        const { r, c } = rc(index);
        if (rowUsed.has(r) || colUsed.has(c)) return false;
        for (const neighbour of neighbours(index, true)) {
          if (usedCells.has(neighbour)) return false;
        }
        return true;
      });

      const forced = manualByColor.get(color);
      if (forced && forced.length) {
        candidates = candidates.filter((index) => index === forced[0]);
      }
      if (!candidates.length) return;

      if (bestCandidates === null || candidates.length < bestCandidates.length) {
        bestColor = color;
        bestCandidates = candidates;
        if (candidates.length === 1) break;
      }
    }

    if (!bestCandidates) return;

    for (const index of bestCandidates) {
      const { r, c } = rc(index);
      assigned.set(bestColor, index);
      usedCells.add(index);
      rowUsed.add(r);
      colUsed.add(c);
      recurse();
      assigned.delete(bestColor);
      usedCells.delete(index);
      rowUsed.delete(r);
      colUsed.delete(c);
      if (hitSolutionCap || timedOut) return;
    }
  }

  recurse();

  const capped = hitSolutionCap || timedOut || found >= MAX_SOLUTIONS;
  const capReason = (hitSolutionCap || found >= MAX_SOLUTIONS) ? "solutions" : (timedOut ? "time" : null);

  const possibleArrays = new Map();
  const candidateByCell = new Map();
  for (const [color, set] of possible) {
    const sorted = [...set].sort((a, b) => a - b);
    possibleArrays.set(color, sorted);
    for (const index of sorted) candidateByCell.set(index, color);
  }

  let forcedSteps = [];
  if (!capped && found > 0) {
    const seen = new Set();
    for (const color of colors) {
      const candidates = possibleArrays.get(color);
      if (candidates.length === 1) {
        const index = candidates[0];
        if (!cats.has(index) && !seen.has(index)) {
          seen.add(index);
          forcedSteps.push({
            color,
            cell: index,
            reason: `Across all ${found.toLocaleString()} ${plural(found, "solution")}, ${lowerColorName(color)} can only occupy ${coord(index)}. Every other cell of this colour conflicts with a row, column, touching, or manual-cat constraint.`
          });
        }
      }
    }
    for (const [index, count] of cellOccurrences) {
      if (count === found && !cats.has(index) && !seen.has(index)) {
        seen.add(index);
        forcedSteps.push({
          color: cells[index],
          cell: index,
          reason: `${coord(index)} appears in every one of the ${found.toLocaleString()} ${plural(found, "solution")}, so the placement is forced by the combined row, column, colour, and no-touching constraints.`
        });
      }
    }
    forcedSteps.sort((a, b) => a.cell - b.cell);
  }

  let status;
  if (capped) status = found > 0 ? "capped" : "inconclusive";
  else if (found === 0) status = "none";
  else if (found === 1) status = "unique";
  else status = "ambiguous";

  return {
    status,
    found,
    capped,
    capReason,
    colors,
    possible: possibleArrays,
    candidateByCell,
    forcedSteps,
    stepIndex: 0
  };
}

function setSolverBlocked(kind, title, message, historyMessage) {
  isSolving = false;
  lastApplied = null;
  solver = { status: "blocked", blockedKind: kind, title, message };
  renderSolverPanels();
  updateBoardCells();
  updateHeaderStatus();
  updateActionStates();
  updateCandidateToggle();
  if (historyMessage) addHistory("solve", historyMessage);
}

/* Autosave runs before analysis and before every early return, so a recoverable
   copy exists even for incomplete or invalid boards. The search is deferred one
   animation frame so the "Searching..." state can paint first. */
function solve() {
  if (isSolving) return;
  autosaveBoard();
  const analysis = analyze();
  lastAnalysis = analysis;
  renderDiagnostics(analysis);
  updateBoardCells();
  updateStats();
  updateHeaderStatus();

  if (analysis.empty) {
    setSolverBlocked("empty", "Nothing to solve", "Paint the board before running the solver.", "Solve skipped: the board is empty.");
    toast("Paint the board before solving.", "info");
    return;
  }
  if (!analysis.complete) {
    const remaining = cells.filter((value) => value < 0).length;
    setSolverBlocked(
      "incomplete",
      "Board is incomplete",
      `${remaining} ${plural(remaining, "cell")} still ${remaining === 1 ? "is" : "are"} unpainted. Every cell needs a colour before the solver can search.`,
      `Solve blocked: ${remaining} unpainted ${plural(remaining, "cell")}.`
    );
    toast(`Paint all cells before solving. ${remaining} remaining.`, "warning");
    return;
  }
  if (analysis.errors.length) {
    setSolverBlocked(
      "invalid",
      "Fix the rule violations",
      `The board has ${analysis.errors.length} ${plural(analysis.errors.length, "constraint violation")}. Review the highlighted cells in diagnostics before searching.`,
      `Solve blocked: ${analysis.errors.length} rule ${plural(analysis.errors.length, "violation")}.`
    );
    toast("Resolve the rule violations before solving.", "error");
    return;
  }
  if (analysis.used.length !== n) {
    setSolverBlocked(
      "impossible",
      "Impossible colour count",
      `A valid arrangement needs exactly ${n} colours — one per row and column. This board uses ${analysis.used.length}.`,
      "Solve blocked: the number of colours cannot satisfy the one-per-row and one-per-column rules."
    );
    toast(`A valid puzzle needs exactly ${n} colours.`, "error");
    return;
  }

  isSolving = true;
  lastApplied = null;
  solver = { status: "searching" };
  renderSolverPanels();
  updateBoardCells();
  updateHeaderStatus();
  updateActionStates();
  updateCandidateToggle();

  window.requestAnimationFrame(() => {
    window.setTimeout(() => {
      let result;
      try {
        result = searchSolutions(analysis);
      } catch (error) {
        console.error(error);
        setSolverBlocked(
          "error",
          "Search could not complete",
          "An unexpected error interrupted the search. The board was not changed.",
          "Solve failed with an unexpected error."
        );
        toast("The solver could not complete. The board was not changed.", "error", 6000);
        return;
      }

      isSolving = false;
      solver = result;
      renderSolverPanels();
      updateBoardCells();
      updateHeaderStatus();
      updateActionStates();
      updateCandidateToggle();

      if (result.status === "unique") {
        const count = result.forcedSteps.length;
        addHistory("solve", `Unique solution found; ${count} forced ${plural(count, "placement")} remain.`);
        toast("Unique solution found.", "success");
      } else if (result.status === "ambiguous") {
        const count = result.forcedSteps.length;
        addHistory("solve", `${result.found.toLocaleString()} valid solutions found; ${count} forced ${plural(count, "placement")} identified.`);
        toast(`${result.found.toLocaleString()} valid solutions found.`, "info");
      } else if (result.status === "capped") {
        const reason = result.capReason === "time" ? "time limit" : "solution cap";
        addHistory("solve", `Search capped at the ${reason} after ${result.found.toLocaleString()} ${plural(result.found, "solution")}; results are provisional.`);
        toast("Search capped — results are provisional.", "warning", 5200);
      } else if (result.status === "inconclusive") {
        addHistory("solve", "Search capped before a solution was found; the result is inconclusive.");
        toast("Search capped before a solution was found. The result is inconclusive.", "warning", 6000);
      } else {
        addHistory("solve", "No valid arrangement found under the current rules.");
        toast("No valid arrangement found under the current rules.", "error", 5200);
      }
    }, 30);
  });
}

function updateCandidateToggle() {
  const hasCandidates = Boolean(
    solver
    && ["unique", "ambiguous", "capped"].includes(solver.status)
    && solver.found > 0
  );
  dom.candidateToggle.disabled = !hasCandidates;
  dom.candidateToggle.checked = showCandidates;
  const label = dom.candidateToggle.closest(".switch");
  if (label) label.classList.toggle("is-disabled", !hasCandidates);
  dom.candidateToggle.title = hasCandidates
    ? "Show candidate locations on the board"
    : "Candidates are available after a completed search";
}

/* Forced steps are only computed for an uncapped search, so every placement
   presented here is common to all enumerated solutions. Capped and
   inconclusive searches show a warning instead of a claimed next step. */
function renderNextPanel() {
  dom.nextResult.setAttribute("aria-busy", String(isSolving || solver?.status === "searching"));
  const fragment = document.createDocumentFragment();

  if (isSolving || solver?.status === "searching") {
    const wrap = document.createElement("div");
    wrap.className = "empty-state";
    wrap.innerHTML = `<span class="spinner" aria-hidden="true"></span><p>Searching all valid arrangements…</p><small>Large boards may take a moment.</small>`;
    fragment.append(wrap);
    dom.nextResult.replaceChildren(fragment);
    return;
  }

  if (lastApplied) {
    fragment.append(makeNotice(
      "success",
      "Forced cat placed",
      `${coordSpaced(lastApplied.cell)} · ${colorName(lastApplied.color)}. The board has changed, so the previous deduction set was cleared. Run the solver again to refresh the remaining deductions.`
    ));
    dom.nextResult.replaceChildren(fragment);
    return;
  }

  if (!solver) {
    fragment.append(makeEmptyState(
      "target",
      "Run the solver to calculate candidate locations and forced placements.",
      "A forced placement is one that appears in every valid solution."
    ));
    dom.nextResult.replaceChildren(fragment);
    return;
  }

  if (solver.status === "blocked") {
    const tone = solver.blockedKind === "invalid" || solver.blockedKind === "impossible" || solver.blockedKind === "error" ? "danger" : "warning";
    fragment.append(makeNotice(tone, solver.title, solver.message));
    dom.nextResult.replaceChildren(fragment);
    return;
  }

  if (solver.status === "none") {
    fragment.append(makeNotice(
      "danger",
      "No valid arrangement",
      "The search exhausted the possibilities under the current rules. Check region boundaries, manual cats, and the colour count. No cat was placed."
    ));
    dom.nextResult.replaceChildren(fragment);
    return;
  }

  if (solver.status === "inconclusive") {
    fragment.append(makeNotice(
      "warning",
      "Search capped — inconclusive",
      "The search stopped before finding a solution. This is not proof that the puzzle is impossible; the result is provisional."
    ));
    dom.nextResult.replaceChildren(fragment);
    return;
  }

  if (solver.status === "capped") {
    fragment.append(makeNotice(
      "warning",
      "Search capped — provisional",
      `Found at least ${solver.found.toLocaleString()} ${plural(solver.found, "solution")} before the ${solver.capReason === "time" ? "time limit" : "solution cap"}. Candidate locations are incomplete, and no forced placement is claimed.`
    ));
    dom.nextResult.replaceChildren(fragment);
    return;
  }

  const steps = solver.forcedSteps || [];
  if (!steps.length) {
    if (solver.status === "unique") {
      fragment.append(makeNotice(
        "success",
        "Unique solution",
        cats.size === n
          ? "Every cat is already placed, and the board matches the unique solution."
          : "The unique arrangement is fully determined. There are no unplaced forced cats to show."
      ));
    } else {
      fragment.append(makeNotice(
        "warning",
        "No forced placement",
        `${solver.found.toLocaleString()} valid solutions exist, but no single placement is common to all of them. The solver cannot honestly claim a next step.`
      ));
    }
    dom.nextResult.replaceChildren(fragment);
    return;
  }

  solver.stepIndex = clamp(solver.stepIndex, 0, steps.length - 1);
  const step = steps[solver.stepIndex];
  const card = document.createElement("div");
  card.className = "step-card";
  card.innerHTML = `
    <div class="step-top">
      ${swatchChip(step.color)}
      <span class="step-color"></span>
      <span class="forced-badge">${icon("check", "icon")} Forced</span>
      <span class="step-coord"></span>
    </div>
    <p class="step-reason"></p>
    <div class="step-meta">
      <span class="step-position"></span>
      <span class="step-basis"></span>
    </div>
  `;
  card.querySelector(".step-color").textContent = colorName(step.color);
  card.querySelector(".step-coord").textContent = coordSpaced(step.cell);
  card.querySelector(".step-reason").textContent = step.reason;
  card.querySelector(".step-position").textContent = `Step ${solver.stepIndex + 1} of ${steps.length}`;
  card.querySelector(".step-basis").textContent = solver.status === "unique"
    ? "Unique solution · not a guess"
    : `Shared by all ${solver.found.toLocaleString()} solutions`;
  fragment.append(card);
  dom.nextResult.replaceChildren(fragment);
}

/* Candidate lists come from the completed search: a cell is shown for a colour
   only if that colour occupied it in at least one enumerated solution. Capped
   results are labelled provisional, never presented as the complete set. */
function renderCandidatePanel() {
  const fragment = document.createDocumentFragment();

  if (isSolving || solver?.status === "searching") {
    dom.candidateSubtitle.textContent = "Searching…";
    const wrap = document.createElement("div");
    wrap.className = "empty-state";
    wrap.innerHTML = `<span class="spinner" aria-hidden="true"></span><p>Calculating candidate locations…</p>`;
    dom.candidateResults.replaceChildren(wrap);
    return;
  }

  if (!solver) {
    dom.candidateSubtitle.textContent = "";
    dom.candidateResults.replaceChildren(makeEmptyState(
      "target",
      "Solve the puzzle to see candidate locations grouped by colour."
    ));
    return;
  }

  if (solver.status === "blocked") {
    dom.candidateSubtitle.textContent = "No search results";
    dom.candidateResults.replaceChildren(makeEmptyState(
      "info",
      "Candidates are available after a complete, rule-valid board is searched."
    ));
    return;
  }

  if (solver.status === "none") {
    dom.candidateSubtitle.textContent = "No valid candidates";
    dom.candidateResults.replaceChildren(makeEmptyState(
      "alert",
      "No candidate locations. No valid arrangement was found under the current rules."
    ));
    return;
  }

  if (solver.status === "inconclusive") {
    dom.candidateSubtitle.textContent = "Search inconclusive";
    dom.candidateResults.replaceChildren(makeEmptyState(
      "alert",
      "The search stopped before candidate locations could be confirmed."
    ));
    return;
  }

  if (solver.status === "capped") {
    dom.candidateSubtitle.textContent = `Provisional · at least ${solver.found.toLocaleString()} solutions`;
    fragment.append(makeNotice(
      "warning",
      "Provisional candidate sets",
      `The search stopped at the ${solver.capReason === "time" ? "time limit" : "solution cap"}. More solutions may exist, so these lists must not be treated as definitive.`
    ));
  } else if (solver.status === "unique") {
    dom.candidateSubtitle.textContent = "Unique solution";
  } else {
    dom.candidateSubtitle.textContent = `${solver.found.toLocaleString()} valid solutions`;
  }

  for (const color of solver.colors) {
    const candidates = solver.possible.get(color) || [];
    if (!candidates.length) continue;
    const group = document.createElement("div");
    group.className = "candidate-group";
    group.innerHTML = `
      <div class="candidate-head">
        ${swatchChip(color)}
        <span class="candidate-name"></span>
        <span class="candidate-count"></span>
      </div>
      <div class="coord-chips"></div>
    `;
    group.querySelector(".candidate-name").textContent = colorName(color);
    group.querySelector(".candidate-count").textContent = `${candidates.length} ${plural(candidates.length, "candidate")}`;
    const chips = group.querySelector(".coord-chips");
    for (const index of candidates) {
      const confirmed = cats.has(index);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `coord-chip${confirmed ? " is-confirmed" : ""}`;
      button.innerHTML = `${confirmed ? icon("cat", "icon") : ""}<span></span>`;
      button.querySelector("span").textContent = coord(index);
      button.title = confirmed
        ? `Confirmed manual cat at ${coordSpaced(index)}`
        : `Highlight ${coordSpaced(index)} for ${colorName(color)}`;
      const { r, c } = rc(index);
      const spokenCoord = `${coord(index)} (row ${r + 1}, column ${c + 1})`;
      button.setAttribute("aria-label", confirmed
        ? `Confirmed manual cat at ${spokenCoord} for ${colorName(color)}. Highlight cell.`
        : `Candidate ${spokenCoord} for ${colorName(color)}. Highlight cell.`);
      button.addEventListener("click", () => highlightCells([index]));
      chips.append(button);
    }
    fragment.append(group);
  }

  if (!fragment.querySelector(".candidate-group") && !fragment.querySelector(".notice")) {
    dom.candidateResults.replaceChildren(makeEmptyState("alert", "No candidate locations to show."));
    return;
  }
  dom.candidateResults.replaceChildren(fragment);
}

function renderSolverPanels() {
  renderNextPanel();
  renderCandidatePanel();
  updateCandidateToggle();
}

function nextStep() {
  if (isSolving || !solver?.forcedSteps?.length) return;
  if (solver.stepIndex >= solver.forcedSteps.length - 1) return;
  solver.stepIndex += 1;
  renderNextPanel();
  updateBoardCells();
  updateActionStates();
}

function applyStep() {
  if (isSolving || !solver?.forcedSteps?.length) return;
  const step = solver.forcedSteps[solver.stepIndex];
  if (!step) return;
  if (cats.has(step.cell)) {
    nextStep();
    return;
  }

  pushUndoSnapshot();
  cats.add(step.cell);
  const applied = { color: step.color, cell: step.cell, reason: step.reason };
  solver = null;
  isSolving = false;
  lastApplied = applied;
  refreshBoardAndDiagnostics();
  renderSolverPanels();
  updateCandidateToggle();
  addHistory("forced", `Applied the forced cat at ${coord(step.cell)} in ${lowerColorName(step.color)}.`);
  toast(`Placed a forced cat at ${coord(step.cell)}.`, "success");
  // Recompute the remaining deductions immediately so the next forced step
  // is available without making the user press Solve again.
  solve();
}


/* ------------------------------------------------------------------
   Puzzle data validation
   ------------------------------------------------------------------ */

function invalidPuzzle(reason) {
  return { ok: false, error: reason };
}

/**
 * Validate untrusted puzzle data from imports, named saves, or autosaves and
 * return a normalised copy. Versions 1 and 2 are accepted. Retired fields such
 * as `maxRegion` are intentionally ignored rather than rejected. Board size,
 * cell values, cat indices/duplicates, selected colour, and mode are all
 * bounds-checked before anything is applied to the app.
 */
function validatePuzzleData(input, fallbackName = "Untitled puzzle") {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return invalidPuzzle("The file must contain a JSON object with puzzle data.");
  }

  if (input.version !== undefined && input.version !== null) {
    if (!Number.isInteger(input.version) || input.version < 1 || input.version > 2) {
      return invalidPuzzle("This file uses an unsupported format version.");
    }
  }

  const size = input.n;
  if (!Number.isInteger(size) || size < 4 || size > 10) {
    return invalidPuzzle("The board size must be a whole number from 4 to 10.");
  }

  const expected = size * size;
  if (!Array.isArray(input.cells) || input.cells.length !== expected) {
    return invalidPuzzle(`The cells field must contain exactly ${expected} values for a ${size} × ${size} board.`);
  }

  for (let i = 0; i < expected; i++) {
    const value = input.cells[i];
    if (!Number.isInteger(value) || value < -1 || value >= COLORS.length) {
      const row = Math.floor(i / size) + 1;
      const col = (i % size) + 1;
      return invalidPuzzle(`Cell r${row} · c${col} has an invalid value. Use -1 for unpainted or a colour index from 0 to ${COLORS.length - 1}.`);
    }
  }

  let name = fallbackName;
  if (input.name !== undefined && input.name !== null) {
    if (typeof input.name !== "string") return invalidPuzzle("The puzzle name must be text.");
    name = input.name;
  }
  name = String(name || "Untitled puzzle").trim().slice(0, 50) || "Untitled puzzle";

  let cats = [];
  if (input.cats !== undefined && input.cats !== null) {
    if (!Array.isArray(input.cats)) return invalidPuzzle("The cats field must be an array of cell indices.");
    const seen = new Set();
    for (const cat of input.cats) {
      if (!Number.isInteger(cat) || cat < 0 || cat >= expected) {
        return invalidPuzzle("The cats list contains a cell index outside the board.");
      }
      if (seen.has(cat)) return invalidPuzzle("The cats list contains the same cell more than once.");
      seen.add(cat);
      cats.push(cat);
    }
    cats.sort((a, b) => a - b);
  }

  let selected = 0;
  if (input.selected !== undefined && input.selected !== null) {
    if (!Number.isInteger(input.selected) || input.selected < -1 || input.selected >= COLORS.length) {
      return invalidPuzzle("The selected colour is invalid.");
    }
    selected = input.selected < 0 ? 0 : input.selected;
  }

  let mode = "paint";
  if (input.mode !== undefined && input.mode !== null) {
    if (!["paint", "erase", "cat"].includes(input.mode)) {
      return invalidPuzzle("The paint mode is invalid.");
    }
    mode = input.mode;
  }

  return {
    ok: true,
    value: {
      n: size,
      cells: input.cells.slice(),
      cats,
      name,
      selected,
      mode,
      savedAt: Number.isFinite(input.savedAt) ? input.savedAt : 0
    }
  };
}

function showMessageDialog(title, message, subtitle = "") {
  const body = document.createElement("p");
  body.className = "confirm-message";
  body.textContent = message;
  const close = makeDialogButton("Close", { variant: "primary", value: null, autofocus: true });
  return openDialog({ title, subtitle, body, actions: [close], initialFocus: close });
}

/* ------------------------------------------------------------------
   Replacing the whole puzzle
   ------------------------------------------------------------------ */

/* Version 2 is the current on-disk shape used by exports, named saves, and
   autosaves. Retired fields such as `maxRegion` are deliberately omitted. */
function buildPuzzlePayload({ includeSavedAt = false } = {}) {
  const name = dom.puzzleName.value.trim().slice(0, 50) || "Untitled puzzle";
  const payload = {
    version: 2,
    name,
    n,
    cells: cells.slice(),
    cats: [...cats].sort((a, b) => a - b),
    selected,
    mode
  };
  if (includeSavedAt) payload.savedAt = Date.now();
  return payload;
}

/* Replace the whole board from already-validated data. Undo history and
   derived solver state are intentionally reset; callers must validate first. */
function applyPuzzleData(value, { kind = "load", message = "" } = {}) {
  closeFileMenu();
  suppressNextClick = false;
  n = value.n;
  cells = value.cells.slice();
  cats = new Set(value.cats);
  selected = value.selected;
  mode = value.mode;
  focusIndex = 0;
  solver = null;
  lastAnalysis = null;
  lastApplied = null;
  isSolving = false;
  highlightedCells.clear();
  window.clearTimeout(highlightTimer);
  resetUndo();
  history = [];

  dom.puzzleName.value = value.name;
  dom.sizeSelect.value = String(n);
  buildBoard();
  renderMode();
  refreshBoardAndDiagnostics();
  renderSolverPanels();
  addHistory(kind, message || `Loaded “${value.name}”.`);
}

function resetToSize(size) {
  closeFileMenu();
  suppressNextClick = false;
  n = size;
  cells = Array(n * n).fill(-1);
  cats = new Set();
  focusIndex = 0;
  solver = null;
  lastAnalysis = null;
  lastApplied = null;
  isSolving = false;
  highlightedCells.clear();
  window.clearTimeout(highlightTimer);
  resetUndo();
  history = [];

  dom.sizeSelect.value = String(n);
  buildBoard();
  renderMode();
  refreshBoardAndDiagnostics();
  renderSolverPanels();
  addHistory("board", `Created a ${n} × ${n} board.`);
}

/* ------------------------------------------------------------------
   Local save and load
   ------------------------------------------------------------------ */

function storageFailureMessage(error) {
  if (error && (error.name === "QuotaExceededError" || error.code === 22)) {
    return "Browser storage is full. Export a puzzle to keep a copy, free some space, and try again.";
  }
  return "This browser blocked local storage. Check privacy settings and try again. You can still export the puzzle as JSON.";
}

/* ------------------------------------------------------------------
   Autosave and startup recovery

   Autosave is a best-effort recovery point written before validation or
   solving. Lifecycle: written by validateBoard() and solve(), read once
   during init(), removed when the board is empty or recovery is declined,
   and discarded when malformed. It never overwrites user-named saves and
   must never prevent either operation from running.
   ------------------------------------------------------------------ */

let autosaveFailureReported = false;

function clearAutosave() {
  try {
    window.localStorage.removeItem(AUTOSAVE_KEY);
  } catch (_) {}
}

function autosaveBoard() {
  if (!hasBoardContent()) {
    clearAutosave();
    return false;
  }

  const payload = buildPuzzlePayload({ includeSavedAt: true });
  try {
    window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
    autosaveFailureReported = false;
    return true;
  } catch (_) {
    /* Never leave an older snapshot behind as a misleading recovery point. */
    clearAutosave();
    if (!autosaveFailureReported) {
      autosaveFailureReported = true;
      toast("This board could not be autosaved. Validation and solving will continue.", "warning", 5600);
    }
    return false;
  }
}

function readAutosave() {
  let raw;
  try {
    raw = window.localStorage.getItem(AUTOSAVE_KEY);
  } catch (_) {
    return { status: "unavailable" };
  }

  if (raw === null) return { status: "none" };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    clearAutosave();
    return { status: "invalid", error: "The autosaved board is not valid JSON." };
  }

  const check = validatePuzzleData(parsed, "Recovered puzzle");
  if (!check.ok) {
    clearAutosave();
    return { status: "invalid", error: check.error };
  }

  const value = check.value;
  const empty = !value.cells.some((cell) => cell >= 0) && value.cats.length === 0;
  if (empty) {
    clearAutosave();
    return { status: "empty" };
  }
  return { status: "ok", value };
}

async function offerAutosaveRecovery() {
  const result = readAutosave();
  if (result.status === "invalid") {
    toast("The previous autosave was invalid and has been discarded.", "warning", 5200);
    return;
  }
  if (result.status !== "ok") return;

  const value = result.value;
  const painted = value.cells.reduce((total, cell) => total + (cell >= 0 ? 1 : 0), 0);
  const body = document.createElement("div");
  const lead = document.createElement("p");
  lead.className = "confirm-message";
  lead.textContent = "A board was autosaved before its last validation or solve. Restore it, or start with a fresh board.";
  const meta = document.createElement("p");
  meta.className = "dialog-note";
  meta.textContent = `“${value.name}” · ${value.n} × ${value.n} · ${painted} painted · ${value.cats.length} ${plural(value.cats.length, "cat")}${value.savedAt ? ` · ${formatDate(value.savedAt)}` : ""}`;
  body.append(lead, meta);

  const fresh = makeDialogButton("Start fresh", { variant: "ghost", value: false });
  const restore = makeDialogButton("Restore board", { variant: "primary", value: true, autofocus: true });
  const choice = await openDialog({
    title: "Recover your last board?",
    subtitle: "Autosaved before validation or solving",
    body,
    actions: [fresh, restore],
    initialFocus: restore
  });

  if (choice === true) {
    applyPuzzleData(value, {
      kind: "load",
      message: `Restored the autosaved “${value.name}”.`
    });
    toast("Restored the autosaved board.", "success");
  } else if (choice === false) {
    clearAutosave();
    toast("Started fresh. The autosave was discarded.", "info", 3000);
  }
}

/* User-named saves live under `cat-solver:<name>` and are separate from the
   autosave key. Every entry is re-validated on read so corrupt or stale data
   is counted and hidden instead of reaching the board. */
function readSavedPuzzles() {
  let storage;
  try {
    storage = window.localStorage;
    if (!storage) throw new Error("unavailable");
    void storage.length;
  } catch (_) {
    return {
      entries: [],
      invalid: 0,
      error: "This browser is not allowing local storage, so saved puzzles cannot be read."
    };
  }

  const entries = [];
  let invalid = 0;
  let length = 0;
  try {
    length = storage.length;
  } catch (_) {
    return {
      entries: [],
      invalid: 0,
      error: "This browser is not allowing local storage, so saved puzzles cannot be read."
    };
  }

  for (let i = 0; i < length; i++) {
    let key = null;
    try {
      key = storage.key(i);
    } catch (_) {
      invalid += 1;
      continue;
    }
    if (!key || !key.startsWith(STORAGE_PREFIX)) continue;

    let raw = null;
    try {
      raw = storage.getItem(key);
    } catch (_) {
      invalid += 1;
      continue;
    }
    if (typeof raw !== "string") {
      invalid += 1;
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      invalid += 1;
      continue;
    }

    const check = validatePuzzleData(parsed, key.slice(STORAGE_PREFIX.length) || "Saved puzzle");
    if (!check.ok) {
      invalid += 1;
      continue;
    }
    entries.push({ key, data: check.value });
  }

  entries.sort((a, b) => {
    const timeDiff = (b.data.savedAt || 0) - (a.data.savedAt || 0);
    return timeDiff || a.data.name.localeCompare(b.data.name);
  });
  return { entries, invalid, error: "" };
}

function loadSavedPuzzle(entry) {
  const check = validatePuzzleData(entry.data, entry.key.slice(STORAGE_PREFIX.length) || "Saved puzzle");
  if (!check.ok) {
    showMessageDialog("Could not load", `This saved puzzle is no longer valid. ${check.error}`);
    return;
  }
  applyPuzzleData(check.value, {
    kind: "load",
    message: `Loaded “${check.value.name}” from this browser.`
  });
  toast(`Loaded “${check.value.name}”.`, "success");
}

async function openLoadDialog() {
  if (isSolving) return;
  closeFileMenu();
  const result = readSavedPuzzles();
  if (result.error) {
    await showMessageDialog("Saved puzzles unavailable", result.error);
    return;
  }

  if (!result.entries.length) {
    const message = result.invalid
      ? "Saved entries were found, but none could be read. They may come from an older or damaged version."
      : "No puzzles have been saved in this browser yet. Use File → Save puzzle to keep one here.";
    await showMessageDialog("No saved puzzles", message, "Saved puzzles stay in this browser.");
    return;
  }

  const body = document.createElement("div");
  if (hasBoardContent()) {
    const note = document.createElement("p");
    note.className = "dialog-note";
    note.textContent = "Loading replaces the current board and resets undo history. Export first if you want to keep it.";
    body.append(note);
  }
  if (result.invalid) {
    const note = document.createElement("p");
    note.className = "dialog-note";
    note.textContent = `${result.invalid} saved ${plural(result.invalid, "entry", "entries")} could not be read and ${result.invalid === 1 ? "is" : "are"} hidden.`;
    body.append(note);
  }

  const list = document.createElement("div");
  list.className = "saved-list";
  result.entries.forEach((entry, index) => {
    const painted = entry.data.cells.reduce((total, value) => total + (value >= 0 ? 1 : 0), 0);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "saved-item";
    button.innerHTML = `
      <span class="saved-main">
        <span class="saved-name"></span>
        <span class="saved-meta"></span>
      </span>
      <span class="saved-action">Load ${icon("arrow", "icon icon-xs")}</span>
    `;
    button.querySelector(".saved-name").textContent = entry.data.name;
    button.querySelector(".saved-meta").textContent = `${entry.data.n} × ${entry.data.n} · ${painted} painted · ${entry.data.cats.length} ${plural(entry.data.cats.length, "cat")} · ${entry.data.savedAt ? formatDate(entry.data.savedAt) : "saved earlier"}`;
    button.addEventListener("click", () => closeDialog(index));
    list.append(button);
  });
  body.append(list);

  const cancel = makeDialogButton("Cancel", { variant: "ghost", value: null });
  const choice = await openDialog({
    title: "Load a saved puzzle",
    subtitle: `${result.entries.length} ${plural(result.entries.length, "puzzle")} in this browser`,
    body,
    actions: [cancel],
    initialFocus: list.firstElementChild
  });

  if (Number.isInteger(choice) && choice >= 0 && choice < result.entries.length) {
    loadSavedPuzzle(result.entries[choice]);
  }
}

/* Named saves are keyed by puzzle name, so saving over an existing key asks
   for confirmation first. Autosave is never touched by this path. */
async function savePuzzle() {
  if (isSolving) return;
  closeFileMenu();
  const payload = buildPuzzlePayload({ includeSavedAt: true });
  const key = STORAGE_PREFIX + payload.name;

  let existing = null;
  try {
    existing = window.localStorage.getItem(key);
  } catch (error) {
    await showMessageDialog("Could not save", storageFailureMessage(error));
    return;
  }

  if (existing !== null) {
    const replace = await confirmDialog({
      title: "Replace saved puzzle?",
      message: `A puzzle named “${payload.name}” is already saved in this browser. Saving will replace it.`,
      confirmLabel: "Replace",
      danger: true
    });
    if (!replace) return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    await showMessageDialog("Could not save", storageFailureMessage(error));
    return;
  }

  addHistory("save", `Saved “${payload.name}” in this browser.`);
  toast(`Saved “${payload.name}” in this browser.`, "success");
}


/* ------------------------------------------------------------------
   Export and import
   ------------------------------------------------------------------ */

function safeFileBase(value) {
  const base = String(value || "cat-puzzle")
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 60);
  return base || "cat-puzzle";
}

function exportPuzzle() {
  if (isSolving) return;
  closeFileMenu();
  const payload = buildPuzzlePayload();
  let objectUrl = "";
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${safeFileBase(payload.name)}.json`;
    anchor.rel = "noopener";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  } catch (error) {
    console.error(error);
    showMessageDialog("Could not export", "The browser could not create the download. Try again, or use Save puzzle to keep a copy in this browser.");
    return;
  } finally {
    if (objectUrl) window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  addHistory("export", `Exported “${payload.name}” as JSON.`);
  toast("Puzzle exported as JSON.", "success");
}

function triggerImport() {
  if (isSolving) return;
  closeFileMenu();
  dom.importInput.value = "";
  dom.importInput.click();
}

function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error || new Error("The file could not be read."));
    reader.readAsText(file);
  });
}

/* Read, bound-check, and parse before prompting. The current board is only
   replaced after validation succeeds and the user confirms. */
async function handleImportFile() {
  const file = dom.importInput.files && dom.importInput.files[0];
  dom.importInput.value = "";
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    await showMessageDialog("Import failed", "This file is larger than 5 MB. Cat solver exports are normally only a few kilobytes.");
    return;
  }

  let text;
  try {
    text = await readFileText(file);
  } catch (_) {
    await showMessageDialog("Import failed", "The file could not be read. Try selecting it again.");
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_) {
    await showMessageDialog("Import failed", "The file is not valid JSON. Check that it is a cat solver export.");
    return;
  }

  const fallbackName = file.name.replace(/\.json$/i, "").trim() || "Imported puzzle";
  const check = validatePuzzleData(parsed, fallbackName);
  if (!check.ok) {
    await showMessageDialog("Import failed", check.error, "The current board was not changed.");
    return;
  }

  if (hasBoardContent()) {
    const replace = await confirmDialog({
      title: "Replace the current board?",
      message: `Importing “${check.value.name}” will replace the current board and reset undo history. Export the current puzzle first if you want to keep it.`,
      confirmLabel: "Import and replace",
      danger: true
    });
    if (!replace) {
      toast("Import cancelled. The current board was not changed.", "info");
      return;
    }
  }

  applyPuzzleData(check.value, {
    kind: "import",
    message: `Imported “${check.value.name}” from ${file.name}.`
  });
  toast(`Imported “${check.value.name}”.`, "success");
}

/* ------------------------------------------------------------------
   Board commands
   ------------------------------------------------------------------ */

async function clearBoard() {
  if (isSolving || !hasBoardContent()) return;
  const confirmed = await confirmDialog({
    title: "Clear the board?",
    message: "This removes every colour and manual cat from the board. You can undo this action.",
    confirmLabel: "Clear board",
    danger: true
  });
  if (!confirmed) return;

  const before = snapshot();
  cells = Array(n * n).fill(-1);
  cats = new Set();
  pushUndoSnapshot(before);
  clearDerivedForBoardChange();
  refreshBoardAndDiagnostics();
  addHistory("clear", "Cleared all colours and cats.");
  toast("Board cleared. Use Undo to restore it.", "success");
}

async function removeAllCats() {
  if (isSolving || !cats.size) return;
  const count = cats.size;
  const confirmed = await confirmDialog({
    title: `Remove ${count} ${plural(count, "cat")}?`,
    message: "This removes every manual cat but keeps all painted colours. You can undo this action.",
    confirmLabel: "Remove cats",
    danger: true
  });
  if (!confirmed) return;

  const before = snapshot();
  cats = new Set();
  pushUndoSnapshot(before);
  clearDerivedForBoardChange();
  refreshBoardAndDiagnostics();
  addHistory("manual", `Removed ${count} manual ${plural(count, "cat")}.`);
  toast(`Removed ${count} manual ${plural(count, "cat")}.`, "success");
}

/* Autosave runs before analysis and before the empty-board early return, so
   Validate always preserves the same recovery point as Solve. */
function validateBoard() {
  if (isSolving) return;
  autosaveBoard();
  const analysis = analyze();
  renderDiagnostics(analysis);
  updateBoardCells();
  updateStats();
  updateHeaderStatus();
  updateActionStates();

  if (analysis.empty) {
    addHistory("validate", "Validation requested before any cells were painted.");
    toast("Paint the board first — there is nothing to validate.", "info");
    return;
  }

  if (analysis.errors.length) {
    const count = analysis.errors.length;
    addHistory("validate", `Validation found ${count} ${plural(count, "rule violation")}.`);
    toast(`${count} ${plural(count, "rule violation")} found. Review the diagnostics.`, "error", 5200);
  } else if (analysis.warnings.length) {
    const count = analysis.warnings.length;
    addHistory("validate", `Validation passed with ${count} ${plural(count, "warning")}.`);
    toast(`No rule violations. ${count} ${plural(count, "warning")} remain.`, "warning");
  } else {
    addHistory("validate", "Validation passed: the board is complete and structurally valid.");
    toast("Validation passed. The board is structurally valid.", "success");
  }
}

function clearHistory() {
  if (!history.length) return;
  history = [];
  renderHistory();
  updateActionStates();
  toast("Activity history cleared.", "info", 2400);
}

/* ------------------------------------------------------------------
   Settings
   ------------------------------------------------------------------ */

async function handleSizeChange() {
  if (isSolving) {
    dom.sizeSelect.value = String(n);
    return;
  }
  const next = Number(dom.sizeSelect.value);
  if (!Number.isInteger(next) || next < 4 || next > 10 || next === n) {
    dom.sizeSelect.value = String(n);
    return;
  }

  if (hasBoardContent()) {
    const confirmed = await confirmDialog({
      title: `Switch to a ${next} × ${next} board?`,
      message: `Changing the board size starts a new empty board and resets undo history. The current ${n} × ${n} puzzle will be cleared.`,
      confirmLabel: `Start ${next} × ${next}`,
      danger: true
    });
    if (!confirmed) {
      dom.sizeSelect.value = String(n);
      return;
    }
  }

  resetToSize(next);
  toast(`Started a ${next} × ${next} board.`, "info");
}


/* ------------------------------------------------------------------
   File menu
   ------------------------------------------------------------------ */

function getFileMenuItems() {
  return Array.from(dom.fileMenu.querySelectorAll(".menu-item:not(:disabled)"));
}

function openFileMenu({ focusFirst = false, focusLast = false } = {}) {
  if (dom.fileBtn.disabled) return;
  dom.fileMenu.hidden = false;
  dom.fileBtn.setAttribute("aria-expanded", "true");
  const items = getFileMenuItems();
  if (focusFirst && items.length) items[0].focus();
  else if (focusLast && items.length) items[items.length - 1].focus();
}

function closeFileMenu({ returnFocus = false } = {}) {
  if (dom.fileMenu.hidden) {
    if (returnFocus && !dom.fileBtn.disabled) dom.fileBtn.focus();
    return;
  }
  dom.fileMenu.hidden = true;
  dom.fileBtn.setAttribute("aria-expanded", "false");
  if (returnFocus && !dom.fileBtn.disabled) dom.fileBtn.focus();
}

function handleFileMenuKeydown(event) {
  const items = getFileMenuItems();
  if (!items.length) return;
  const current = items.indexOf(document.activeElement);

  if (event.key === "Escape") {
    event.preventDefault();
    closeFileMenu({ returnFocus: true });
    return;
  }
  if (event.key === "Tab") {
    closeFileMenu({ returnFocus: true });
    return;
  }
  if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
    event.preventDefault();
    let next = 0;
    if (event.key === "ArrowDown") next = current < 0 ? 0 : (current + 1) % items.length;
    else if (event.key === "ArrowUp") next = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length;
    else if (event.key === "End") next = items.length - 1;
    items[next].focus();
  }
}

function bindFileMenu() {
  dom.fileBtn.addEventListener("click", (event) => {
    if (dom.fileBtn.disabled) return;
    if (!dom.fileMenu.hidden) {
      closeFileMenu({ returnFocus: true });
      return;
    }
    openFileMenu();
    if (event.detail === 0) openFileMenu({ focusFirst: true });
  });

  dom.fileBtn.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    openFileMenu();
    const items = getFileMenuItems();
    if (!items.length) return;
    (event.key === "ArrowDown" ? items[0] : items[items.length - 1]).focus();
  });

  dom.fileMenu.addEventListener("keydown", handleFileMenuKeydown);
  dom.fileMenu.addEventListener("click", (event) => {
    if (event.target.closest(".menu-item")) closeFileMenu({ returnFocus: true });
  }, true);

  const wrap = dom.fileBtn.parentElement;
  document.addEventListener("pointerdown", (event) => {
    if (dom.fileMenu.hidden) return;
    if (!wrap.contains(event.target)) closeFileMenu();
  }, true);

  document.addEventListener("focusin", (event) => {
    if (dom.fileMenu.hidden) return;
    if (!wrap.contains(event.target)) closeFileMenu();
  });
}

/* ------------------------------------------------------------------
   Dialog lifecycle
   ------------------------------------------------------------------ */

function bindDialogEvents() {
  dom.modalClose.addEventListener("click", () => closeDialog(null));

  dom.modal.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog(null);
  });

  dom.modal.addEventListener("click", (event) => {
    if (event.target === dom.modal) closeDialog(null);
  });

  dom.modal.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    const dialog = activeDialog;
    activeDialog = null;
    if (!dialog) return;

    const returnFocus = dialog.returnFocus;
    if (returnFocus && typeof returnFocus.focus === "function" && document.contains(returnFocus)) {
      try {
        returnFocus.focus({ preventScroll: true });
      } catch (_) {
        try { returnFocus.focus(); } catch (_) {}
      }
    }
    dialog.resolve(dialog.result);
  });
}

/* ------------------------------------------------------------------
   Global keyboard shortcuts
   ------------------------------------------------------------------ */

function isEditableTarget(target) {
  if (!(target instanceof Element)) return false;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("input, textarea, [contenteditable='true']"));
}

function handleGlobalKeydown(event) {
  const mod = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();

  if (dom.modal.open) {
    if (mod && ["s", "o", "z", "y"].includes(key)) event.preventDefault();
    return;
  }

  if (event.key === "Escape" && !dom.fileMenu.hidden) {
    event.preventDefault();
    closeFileMenu({ returnFocus: true });
    return;
  }

  if (!mod || event.altKey) return;

  if (key === "s") {
    event.preventDefault();
    savePuzzle();
    return;
  }

  if (isEditableTarget(event.target)) return;

  if (key === "z") {
    event.preventDefault();
    if (event.shiftKey) redo();
    else undo();
    return;
  }
  if (key === "y") {
    event.preventDefault();
    redo();
    return;
  }
  if (key === "o") {
    event.preventDefault();
    openLoadDialog();
  }
}

/* ------------------------------------------------------------------
   Event bindings
   ------------------------------------------------------------------ */

function handleWindowPointerUp(event) {
  if (!isDragging) return;
  if (event.pointerId === dragPointerId) endDrag();
}

function handleWindowBlur() {
  if (isDragging) endDrag();
}

function bindBoardEvents() {
  dom.board.addEventListener("pointerdown", handleBoardPointerDown);
  dom.board.addEventListener("pointermove", handleBoardPointerMove);
  dom.board.addEventListener("pointerup", handleBoardPointerUp);
  dom.board.addEventListener("pointercancel", handleBoardPointerUp);
  dom.board.addEventListener("lostpointercapture", (event) => {
    if (isDragging && event.pointerId === dragPointerId) endDrag();
  });
  dom.board.addEventListener("click", handleBoardClick);
  dom.board.addEventListener("keydown", handleBoardKeydown);
  dom.board.addEventListener("focusin", handleBoardFocusIn);
}

function bindEvents() {
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  dom.candidateToggle.addEventListener("change", () => {
    showCandidates = dom.candidateToggle.checked;
    updateBoardCells();
  });

  dom.themeBtn.addEventListener("click", () => {
    applyTheme(theme === "dark" ? "light" : "dark");
  });

  dom.helpBtn.addEventListener("click", openHelpDialog);
  dom.sizeSelect.addEventListener("change", handleSizeChange);

  dom.validateBtn.addEventListener("click", validateBoard);
  dom.clearBtn.addEventListener("click", clearBoard);
  dom.removeCatsBtn.addEventListener("click", removeAllCats);
  dom.clearHistoryBtn.addEventListener("click", clearHistory);
  dom.undoBtn.addEventListener("click", undo);
  dom.redoBtn.addEventListener("click", redo);
  dom.solveBtn.addEventListener("click", solve);
  dom.nextBtn.addEventListener("click", nextStep);
  dom.applyStepBtn.addEventListener("click", applyStep);

  dom.saveBtn.addEventListener("click", savePuzzle);
  dom.loadBtn.addEventListener("click", openLoadDialog);
  dom.importBtn.addEventListener("click", triggerImport);
  dom.exportBtn.addEventListener("click", exportPuzzle);
  dom.importInput.addEventListener("change", handleImportFile);

  bindBoardEvents();
  bindFileMenu();
  bindDialogEvents();

  document.addEventListener("keydown", handleGlobalKeydown);
  window.addEventListener("pointerup", handleWindowPointerUp);
  window.addEventListener("pointercancel", handleWindowPointerUp);
  window.addEventListener("blur", handleWindowBlur);
}

/* ------------------------------------------------------------------
   Start
   ------------------------------------------------------------------ */

/* Startup order matters: apply the theme, build the palette and board from the
   current state, bind events, render derived panels, then offer autosave
   recovery. Recovery applies data through the same validated path as imports
   and named saves. */
function init() {
  applyTheme(theme, { persist: false });
  buildPalette();
  buildBoard();
  renderMode();
  bindEvents();
  refreshBoardAndDiagnostics();
  renderSolverPanels();
  renderHistory();
  updateActionStates();
  addHistory("board", "Created an 8 × 8 board.");
  offerAutosaveRecovery();
}

init();

})();
