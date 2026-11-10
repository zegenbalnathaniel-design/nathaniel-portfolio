// Navigation: the top bar with section links, the command palette (the
// terminal, on demand — ⌘K, "/", or just start typing), the menu for small
// screens, the section rail and the reading-progress hairline.

import { functions, fnByCode, navGroup, sections, type Fn } from "./sections";
import { scrollToEl, lenis } from "./scroll";

const IST_HM = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });

type NavOpts = { reduced: boolean; openBrief: () => void };

export function initNav({ reduced, openBrief }: NavOpts) {
  const palette = document.getElementById("palette")!;
  const form = document.getElementById("cmdForm") as HTMLFormElement;
  const input = document.getElementById("cmd") as HTMLInputElement;
  const list = document.getElementById("cmdList") as HTMLUListElement;
  const clock = document.getElementById("cmdClock")!;
  const rail = document.getElementById("rail")!;
  const menu = document.getElementById("menu")!;
  const menuBtn = document.getElementById("menuBtn") as HTMLButtonElement;
  const menuList = document.getElementById("menuList")!;

  const tickClock = () => (clock.textContent = `IST ${IST_HM.format(new Date())}`);
  tickClock();
  setInterval(tickClock, 15000);

  rail.innerHTML = sections.map((s) => `<a href="#${s.id}" data-go="${s.code}"><span>${s.title}</span><i></i></a>`).join("");
  menuList.innerHTML = sections
    .map((s, i) => `<a href="#${s.id}" data-go="${s.code}"><em>${String(i).padStart(2, "0")}</em><b>${s.title}</b><span>${s.code} &lt;GO&gt;</span></a>`)
    .join("");

  // ---- running a function
  const tabFor: Record<string, string> = { BFPI: "t-mon", FISC: "t-fis", TAX: "t-tax" };
  const run = (fn: Fn | undefined) => {
    closePalette();
    closeMenu();
    if (!fn) return false;
    if (fn.action === "brief") return openBrief(), true;
    if (fn.action === "help") return openPalette(""), true;
    if (tabFor[fn.code]) (document.getElementById(tabFor[fn.code]) as HTMLButtonElement | null)?.click();
    const el = fn.target ? document.querySelector<HTMLElement>(fn.target) : null;
    if (el) scrollToEl(el, reduced);
    return true;
  };
  (window as unknown as { __go: (c: string) => boolean }).__go = (c) => run(fnByCode(c));

  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-brief]")) { e.preventDefault(); closeMenu(); openBrief(); return; }
    const go = t.closest<HTMLElement>("[data-go]");
    if (!go) return;
    const fn = fnByCode(go.dataset.go!);
    if (!fn) return;
    e.preventDefault();
    run(fn);
  });

  // ---- palette
  let matches: Fn[] = [];
  let sel = 0;
  let lastFocus: Element | null = null;
  const render = () => {
    let html = "", group = "";
    matches.forEach((f, i) => {
      if (f.group !== group) { group = f.group; html += `<li class="pal-group" role="presentation">${group.toUpperCase()}</li>`; }
      html += `<li role="option" id="opt-${f.code}" data-code="${f.code}" aria-selected="${i === sel}"><b>${f.code}</b><span>${f.label}</span><em>&lt;GO&gt;</em></li>`;
    });
    list.innerHTML = html || `<li class="pal-group" role="presentation">NO SUCH FUNCTION — TRY HELP</li>`;
    input.setAttribute("aria-activedescendant", matches[sel] ? `opt-${matches[sel].code}` : "");
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  };
  const filter = () => {
    const q = input.value.trim().toUpperCase();
    matches = !q
      ? functions.slice()
      : functions.filter((f) => f.code.startsWith(q)).concat(functions.filter((f) => !f.code.startsWith(q) && (f.code.includes(q) || f.label.toUpperCase().includes(q))));
    sel = 0;
    render();
  };
  function openPalette(seed = "") {
    if (!palette.hidden) { input.value = seed || input.value; filter(); return; }
    lastFocus = document.activeElement;
    palette.hidden = false;
    document.documentElement.classList.add("is-modal");
    lenis?.stop();
    input.value = seed;
    filter();
    requestAnimationFrame(() => { input.focus(); input.setSelectionRange(input.value.length, input.value.length); });
  }
  function closePalette() {
    if (palette.hidden) return;
    palette.hidden = true;
    document.documentElement.classList.remove("is-modal");
    lenis?.start();
    (lastFocus as HTMLElement | null)?.focus?.();
  }
  document.getElementById("cmdOpen")!.addEventListener("click", () => openPalette());
  palette.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closePalette));
  input.addEventListener("input", filter);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { sel = Math.min(matches.length - 1, sel + 1); render(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); render(); e.preventDefault(); }
    else if (e.key === "Escape") { closePalette(); }
    else if (e.key === "Tab" && matches[sel]) { input.value = matches[sel].code; filter(); e.preventDefault(); }
  });
  list.addEventListener("mousedown", (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>("li[data-code]");
    if (!li) return;
    e.preventDefault();
    run(fnByCode(li.dataset.code!));
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    run(fnByCode(input.value) ?? matches[sel]);
  });

  // ⌘K / Ctrl+K, "/", or start typing anywhere — the way a terminal would.
  addEventListener("keydown", (e) => {
    if (!document.documentElement.classList.contains("booted")) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette.hidden ? openPalette() : closePalette(); return; }
    if (!palette.hidden) return;
    if (!document.getElementById("brief")?.hidden) return;
    const a = document.activeElement as HTMLElement | null;
    const typing = a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable || a.getAttribute("role") === "group" || a.closest(".sheet-grid"));
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "/") { e.preventDefault(); openPalette(); }
    else if (e.key.length === 1 && /[a-z]/i.test(e.key)) { e.preventDefault(); openPalette(e.key.toUpperCase()); }
  });

  // ---- menu (small screens)
  function openMenu() {
    menu.hidden = false;
    menuBtn.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("is-menu");
    lenis?.stop();
  }
  function closeMenu() {
    if (menu.hidden) return;
    menu.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("is-menu");
    lenis?.start();
  }
  menuBtn.addEventListener("click", () => (menu.hidden ? openMenu() : closeMenu()));
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
}

let lastIndex = -1;
/** Top-bar read-outs, nav and rail highlight for the section in view. */
export function setActiveSection(i: number, clockText: string, progress: number) {
  const s = sections[i];
  if (!s) return;
  if (i !== lastIndex) {
    lastIndex = i;
    document.getElementById("cmdSec")!.textContent = s.code === "TOP" ? "COVER" : s.title.toUpperCase();
    document.querySelectorAll("#rail a").forEach((a, j) => a.classList.toggle("on", j === i));
    document.querySelectorAll("#menuList a").forEach((a, j) => a.classList.toggle("on", j === i));
    const g = navGroup[s.id];
    document.querySelectorAll<HTMLElement>("#tbNav a").forEach((a) => a.classList.toggle("on", a.dataset.group === g));
    document.getElementById("topbar")!.classList.toggle("is-cover", i === 0);
  }
  const light = document.getElementById("cmdLight")!;
  if (light.textContent !== clockText) light.textContent = clockText;
  (document.getElementById("tbProgress") as HTMLElement).style.transform = `scaleX(${progress.toFixed(4)})`;
}
