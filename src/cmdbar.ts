// The command bar: the terminal after login, shrunk to a strip. Type a
// function and press <GO>; the page scrolls there and the camera flies with it.

import { functions, fnByCode, sections, type Fn } from "./sections";
import { scrollToEl } from "./scroll";

const IST_HM = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });

type CmdOpts = { reduced: boolean; openBrief: () => void };

export function initCmdbar({ reduced, openBrief }: CmdOpts) {
  const form = document.getElementById("cmdForm") as HTMLFormElement;
  const input = document.getElementById("cmd") as HTMLInputElement;
  const list = document.getElementById("cmdList") as HTMLUListElement;
  const clock = document.getElementById("cmdClock")!;
  const rail = document.getElementById("rail")!;

  const tickClock = () => (clock.textContent = `IST ${IST_HM.format(new Date())}`);
  tickClock();
  setInterval(tickClock, 15000);

  // ---- rail
  rail.innerHTML = sections
    .map((s) => `<a href="#${s.id}" data-go="${s.code}"><span>${s.title}</span><i></i></a>`)
    .join("");

  // ---- running a function
  const tabFor: Record<string, string> = { BFPI: "t-mon", FISC: "t-fis", TAX: "t-tax" };
  const run = (fn: Fn | undefined) => {
    close();
    if (!fn) return false;
    input.value = "";
    input.blur();
    if (fn.action === "brief") return openBrief(), true;
    if (fn.action === "help") return open(true), input.focus(), true;
    if (tabFor[fn.code]) (document.getElementById(tabFor[fn.code]) as HTMLButtonElement | null)?.click();
    const el = fn.target ? document.querySelector<HTMLElement>(fn.target) : null;
    if (el) scrollToEl(el, reduced);
    return true;
  };
  (window as unknown as { __go: (c: string) => boolean }).__go = (c) => run(fnByCode(c));

  // Every [data-go] on the page is a function key.
  document.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[data-go]");
    if (!t) return;
    const fn = fnByCode(t.dataset.go!);
    if (!fn) return;
    e.preventDefault();
    run(fn);
  });

  // ---- autocomplete
  let matches: Fn[] = [];
  let sel = 0;
  const render = () => {
    let html = "";
    let group = "";
    matches.forEach((f, i) => {
      if (f.group !== group) {
        group = f.group;
        html += `<li class="cmd-head" role="presentation">${group.toUpperCase()}</li>`;
      }
      html += `<li role="option" id="opt-${f.code}" data-code="${f.code}" aria-selected="${i === sel}"><b>${f.code}</b><span>${f.label}</span><em>&lt;GO&gt;</em></li>`;
    });
    list.innerHTML = html || `<li class="cmd-head" role="presentation">NO SUCH FUNCTION — TRY HELP</li>`;
    input.setAttribute("aria-activedescendant", matches[sel] ? `opt-${matches[sel].code}` : "");
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  };
  const open = (all = false) => {
    const q = input.value.trim().toUpperCase();
    matches = all || !q
      ? functions.slice()
      : functions.filter((f) => f.code.startsWith(q)).concat(functions.filter((f) => !f.code.startsWith(q) && (f.code.includes(q) || f.label.toUpperCase().includes(q))));
    sel = 0;
    list.classList.add("open");
    input.setAttribute("aria-expanded", "true");
    render();
  };
  function close() {
    list.classList.remove("open");
    input.setAttribute("aria-expanded", "false");
  }

  input.addEventListener("focus", () => open());
  input.addEventListener("input", () => open());
  input.addEventListener("blur", () => setTimeout(close, 120));
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { sel = Math.min(matches.length - 1, sel + 1); render(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); render(); e.preventDefault(); }
    else if (e.key === "Escape") { input.value = ""; close(); input.blur(); }
    else if (e.key === "Tab" && matches[sel] && list.classList.contains("open")) { input.value = matches[sel].code; e.preventDefault(); open(); }
  });
  list.addEventListener("mousedown", (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>("li[data-code]");
    if (!li) return;
    e.preventDefault();
    run(fnByCode(li.dataset.code!));
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const exact = fnByCode(input.value);
    run(exact ?? matches[sel]);
  });

  // Start typing anywhere and it goes to the command line, the way a terminal would.
  addEventListener("keydown", (e) => {
    if (!document.documentElement.classList.contains("booted")) return;
    const a = document.activeElement as HTMLElement | null;
    const typing = a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable || a.getAttribute("role") === "group");
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "/" || (e.key.length === 1 && /[a-z]/i.test(e.key))) {
      if (document.getElementById("brief")?.hidden === false) return;
      input.focus();
      if (e.key !== "/") { input.value = e.key.toUpperCase(); open(); }
      e.preventDefault();
    }
  });
}

/** Header read-out and rail highlight for the section in view. */
export function setActiveSection(i: number, clockText: string) {
  const s = sections[i];
  if (!s) return;
  const sec = document.getElementById("cmdSec")!;
  const label = `${String(i).padStart(2, "0")} ${s.code} · ${s.title.toUpperCase()}`;
  if (sec.textContent !== label) {
    sec.textContent = label;
    document.querySelectorAll("#rail a").forEach((a, j) => a.classList.toggle("on", j === i));
  }
  const light = document.getElementById("cmdLight")!;
  if (light.textContent !== clockText) light.textContent = clockText;
}
