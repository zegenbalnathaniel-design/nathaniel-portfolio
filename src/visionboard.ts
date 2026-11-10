// The vision board, drawn as the spreadsheet it really is: column letters,
// row numbers, a formula bar that shows the cell you click, sheet tabs, and
// a filter that lights up what happened, what didn't, and what's still open.

import { COLUMNS, ROWS, type Cell, type Status } from "./data/visionboard";

const LETTERS = "ABCDEFGHIJKL".split("");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function cellHtml(cell: Cell) {
  return cell
    .map((b) => {
      const head = b.h ? `<u>${esc(b.h)}</u>` : "";
      const items = b.items.map((i) => `<span class="it${i.s ? " s-" + i.s : ""}">${esc(i.t)}</span>`).join("");
      return `<div class="blk">${head}${items}</div>`;
    })
    .join("");
}
const cellText = (cell: Cell) =>
  cell.map((b) => [b.h ? b.h.toUpperCase() + ":" : "", ...b.items.map((i) => i.t + (i.s === "done" ? " ✓" : i.s === "miss" ? " ✗" : i.s === "tbd" ? " …" : ""))].filter(Boolean).join(" ")).join("  ·  ");

export function initVisionBoard() {
  const grid = document.getElementById("sheetGrid");
  const ref = document.getElementById("sheetRef");
  const formula = document.getElementById("sheetFormula");
  if (!grid || !ref || !formula) return;

  // header row: corner + letters
  let html = `<div class="c corner"></div>` + LETTERS.map((l) => `<div class="c colh">${l}</div>`).join("");
  // row 1: the title, as in the file
  html += `<div class="c rowh">1</div><div class="c a"></div><div class="c title" data-ref="B1" data-text="VISION BOARD – NATHANIEL JEDIDIAH ZEGENBAL" style="grid-column: span 11">VISION BOARD – NATHANIEL JEDIDIAH ZEGENBAL</div>`;
  // row 2: column headings
  html += `<div class="c rowh">2</div><div class="c a"></div>` + COLUMNS.map((c, i) => `<div class="c head" data-ref="${LETTERS[i + 1]}2" data-text="${esc(c)}">${esc(c)}</div>`).join("");
  // rows 3–6: the grades
  ROWS.forEach((row, r) => {
    const n = r + 3;
    html += `<div class="c rowh">${n}</div><div class="c a"></div>`;
    html += `<div class="c grade" data-ref="B${n}" data-text="${esc(`${row.grade} (${row.span}) School – Alphabet International School, Chennai`)}"><b>${row.grade}</b><span>(${row.span})</span><span>School – Alphabet International School, Chennai</span></div>`;
    row.cells.forEach((cell, c) => {
      html += `<div class="c cell" data-ref="${LETTERS[c + 2]}${n}" data-text="${esc(cellText(cell))}">${cellHtml(cell)}</div>`;
    });
  });
  grid.innerHTML = `<div class="sheet-inner">${html}</div>`;

  // selecting a cell
  let selected: HTMLElement | null = null;
  const select = (el: HTMLElement) => {
    selected?.classList.remove("sel");
    selected = el;
    el.classList.add("sel");
    ref.textContent = el.dataset.ref ?? "";
    formula.textContent = el.dataset.text ?? "";
  };
  grid.addEventListener("click", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-ref]");
    if (el && !dragged) select(el);
  });
  const first = grid.querySelector<HTMLElement>('[data-ref="C5"]');
  if (first) select(first);

  // drag the sheet sideways with a mouse (touch scrolls natively)
  let down = false, dragged = false, x0 = 0, y0 = 0, sx = 0, sy = 0;
  grid.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    down = true; dragged = false; x0 = e.clientX; y0 = e.clientY; sx = grid.scrollLeft; sy = grid.scrollTop;
  });
  addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (Math.abs(dx) + Math.abs(dy) > 4) { dragged = true; grid.classList.add("dragging"); }
    if (dragged) { grid.scrollLeft = sx - dx; grid.scrollTop = sy - dy; }
  });
  addEventListener("pointerup", () => {
    if (!down) return;
    down = false;
    grid.classList.remove("dragging");
    setTimeout(() => (dragged = false), 0);
  });

  // keyboard: arrows move the selection
  grid.addEventListener("keydown", (e) => {
    if (!selected || !e.key.startsWith("Arrow")) return;
    const m = /^([A-L])(\d)$/.exec(selected.dataset.ref ?? "");
    if (!m) return;
    let col = LETTERS.indexOf(m[1]), row = +m[2];
    if (e.key === "ArrowRight") col = Math.min(11, col + 1);
    if (e.key === "ArrowLeft") col = Math.max(1, col - 1);
    if (e.key === "ArrowDown") row = Math.min(6, row + 1);
    if (e.key === "ArrowUp") row = Math.max(2, row - 1);
    const next = grid.querySelector<HTMLElement>(`[data-ref="${LETTERS[col]}${row}"]`);
    if (next) { select(next); next.scrollIntoView({ block: "nearest", inline: "nearest" }); e.preventDefault(); }
  });

  // filters
  const sheet = document.getElementById("sheet")!;
  sheet.querySelectorAll<HTMLButtonElement>(".sheet-filter button").forEach((b) => {
    b.addEventListener("click", () => {
      sheet.querySelectorAll(".sheet-filter button").forEach((x) => x.classList.toggle("on", x === b));
      const f = b.dataset.f as "all" | Exclude<Status, null>;
      sheet.dataset.filter = f;
    });
  });
}
