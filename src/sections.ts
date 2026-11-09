// The page's sections, read once from the DOM, and the functions the command
// bar understands. A function either names a section (its data-code) or an
// element inside one.

export type Section = {
  el: HTMLElement;
  id: string;
  code: string;
  title: string;
  light: string;
  cam: string;
  index: number;
};

export type Fn = { code: string; label: string; group: string; target?: string; action?: "brief" | "help" };

export const sections: Section[] = Array.from(document.querySelectorAll<HTMLElement>("main > .sec")).map((el, index) => ({
  el,
  id: el.id,
  code: el.dataset.code ?? el.id.toUpperCase(),
  title: el.dataset.title ?? el.id,
  light: el.dataset.light ?? "morning",
  cam: el.dataset.cam ?? "cover",
  index,
}));

// Clock time each section is "set" at, in minutes after midnight: the page is one day.
export const sectionClock: Record<string, number> = {
  cover: 7 * 60,
  habit: 8 * 60 + 10,
  ownership: 9 * 60 + 30,
  transmission: 11 * 60 + 40,
  ventures: 13 * 60 + 30,
  newsletter: 15 * 60,
  failures: 16 * 60 + 40,
  athletics: 17 * 60 + 50,
  creative: 18 * 60 + 40,
  library: 19 * 60 + 50,
  record: 20 * 60 + 40,
  map: 21 * 60 + 30,
  next: 22 * 60 + 40,
  contact: 23 * 60 + 50,
};

export const fmtClock = (m: number) => {
  const mm = Math.max(0, Math.min(24 * 60 - 1, Math.round(m)));
  return `${String(Math.floor(mm / 60)).padStart(2, "0")}:${String(mm % 60).padStart(2, "0")}`;
};

export const functions: Fn[] = [
  { code: "TOP", label: "Cover", group: "Navigate", target: "#cover" },
  { code: "HABIT", label: "The habit — the vision board", group: "Navigate", target: "#habit" },
  { code: "OWN", label: "Fig. 01 — Capability-to-Ownership", group: "Research", target: "#ownership" },
  { code: "BFPI", label: "The Rate Lab — Fed → JPMorgan", group: "Research", target: "#transmission" },
  { code: "FISC", label: "Singapore fiscal multiplier", group: "Research", target: "#transmission", },
  { code: "TAX", label: "UK gambling levy", group: "Research", target: "#transmission" },
  { code: "RSRCH", label: "All research", group: "Research", target: "#ownership" },
  { code: "VNTR", label: "Ventures & writing", group: "Work", target: "#ventures" },
  { code: "EDGT", label: "Edugate", group: "Work", target: "#w-edugate" },
  { code: "BTC", label: "Bitcoin Desk Simulator", group: "Work", target: "#w-btc" },
  { code: "IEIL", label: "India Economic Intelligence Lab", group: "Work", target: "#w-ieil" },
  { code: "SUBS", label: "Essays on Substack", group: "Work", target: "#w-substack" },
  { code: "TFF", label: "The Financial Frontier — Issue 01", group: "Work", target: "#newsletter" },
  { code: "FAIL", label: "What didn’t work", group: "Person", target: "#failures" },
  { code: "ATHL", label: "Athletics", group: "Person", target: "#athletics" },
  { code: "CRTV", label: "The creative side", group: "Person", target: "#creative" },
  { code: "LIB", label: "The library", group: "Person", target: "#library" },
  { code: "REC", label: "The record", group: "Person", target: "#record" },
  { code: "MAP", label: "The map", group: "Person", target: "#map" },
  { code: "NEXT", label: "What I’m chasing next", group: "Person", target: "#next" },
  { code: "CONT", label: "Contact", group: "Person", target: "#contact" },
  { code: "BRIEF", label: "90-second brief, for admissions", group: "Tools", action: "brief" },
  { code: "HELP", label: "List every function", group: "Tools", action: "help" },
];

export const fnByCode = (code: string) => functions.find((f) => f.code === code.trim().toUpperCase());
