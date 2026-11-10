// The Cinematic Mind: the films, in Nathaniel's order, and the lesson each
// one left — in his words. Films without a lesson here simply don't have one
// written yet; nothing is invented for them.

export type Motif = "literature" | "teenager" | "dreams" | "integrity" | "agency" | "japan" | "mentor" | "extremism" | "reel";

export type Film = {
  id: string;
  title: string;
  year: number;
  director: string;
  lesson?: string;
  tag?: string;
  motif: Motif;
  core?: boolean; // one of the films that shaped his life
};

export const FILMS: Film[] = [
  { id: "good-will-hunting", title: "Good Will Hunting", year: 1997, director: "Gus Van Sant", motif: "reel", core: true },
  { id: "udaan", title: "Udaan", year: 2010, director: "Vikramaditya Motwane", lesson: "Agency, the power of literature, and finding who you are.", tag: "Agency", motif: "agency", core: true },
  { id: "seven-samurai", title: "Seven Samurai", year: 1954, director: "Akira Kurosawa", lesson: "A love for Japanese culture, and its everlasting way of life.", tag: "Japan", motif: "japan", core: true },
  { id: "parasite", title: "Parasite", year: 2019, director: "Bong Joon-ho", motif: "reel", core: true },
  { id: "scent-of-a-woman", title: "Scent of a Woman", year: 1992, director: "Martin Brest", lesson: "Integrity.", tag: "Integrity", motif: "integrity", core: true },
  { id: "finding-forrester", title: "Finding Forrester", year: 2000, director: "Gus Van Sant", lesson: "It gave me my love for literature.", tag: "Literature", motif: "literature", core: true },
  { id: "pursuit-of-happyness", title: "The Pursuit of Happyness", year: 2006, director: "Gabriele Muccino", lesson: "Chase your dreams.", tag: "Dreams", motif: "dreams", core: true },
  { id: "last-samurai", title: "The Last Samurai", year: 2003, director: "Edward Zwick", lesson: "A love for Japanese culture, and its everlasting way of life.", tag: "Japan", motif: "japan", core: true },
  { id: "perks", title: "The Perks of Being a Wallflower", year: 2012, director: "Stephen Chbosky", lesson: "The shortcomings of being a teenager.", tag: "Being sixteen", motif: "teenager", core: true },
  { id: "taare-zameen-par", title: "Taare Zameen Par", year: 2007, director: "Aamir Khan", lesson: "The power of life — and of a mentor.", tag: "Mentors", motif: "mentor" },
  { id: "coach-carter", title: "Coach Carter", year: 2005, director: "Thomas Carter", lesson: "The power of life — and of a mentor.", tag: "Mentors", motif: "mentor" },
  { id: "remember-the-titans", title: "Remember the Titans", year: 2000, director: "Boaz Yakin", lesson: "The power of life — and of a mentor.", tag: "Mentors", motif: "mentor" },
  { id: "american-history-x", title: "American History X", year: 1998, director: "Tony Kaye", lesson: "Extremism, and the reality of discrimination in society.", tag: "Extremism", motif: "extremism" },
  { id: "12th-fail", title: "12th Fail", year: 2023, director: "Vidhu Vinod Chopra", motif: "reel" },
  { id: "million-dollar-baby", title: "Million Dollar Baby", year: 2004, director: "Clint Eastwood", motif: "reel" },
  { id: "taxi-driver", title: "Taxi Driver", year: 1976, director: "Martin Scorsese", motif: "reel" },
  { id: "dead-poets-society", title: "Dead Poets Society", year: 1989, director: "Peter Weir", motif: "reel" },
  { id: "jerry-maguire", title: "Jerry Maguire", year: 1996, director: "Cameron Crowe", motif: "reel" },
  { id: "how-to-lose-a-guy", title: "How to Lose a Guy in 10 Days", year: 2003, director: "Donald Petrie", motif: "reel" },
];

export const LESSON_COUNT = new Set(FILMS.map((f) => f.tag).filter(Boolean)).size;

/** A small line drawing per lesson: the same vocabulary as the rest of the site. */
export function motifSvg(m: Motif, seed = 0, w = 120, h = 80): string {
  const L = (x1: number, y1: number, x2: number, y2: number, c = "i") => `<line class="${c}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  let g = "";
  switch (m) {
    case "literature": // a ruled page with its margin
      for (let i = 0; i < 6; i++) g += L(22, 18 + i * 9, 98, 18 + i * 9, i === 2 ? "a" : "i");
      g += L(32, 12, 32, 68, "a");
      break;
    case "teenager": // a tunnel, receding
      for (let i = 0; i < 5; i++) { const k = i * 7; g += `<rect class="${i === 4 ? "a" : "i"}" x="${20 + k}" y="${10 + k * 0.6}" width="${80 - k * 2}" height="${60 - k * 1.2}" rx="2"/>`; }
      break;
    case "dreams": // stairs, climbing
      g += `<path class="i" d="M16 66 H36 V54 H56 V42 H76 V30 H96 V18"/>`;
      g += `<circle class="a" cx="100" cy="14" r="3"/>`;
      break;
    case "integrity": // a plumb line through a level horizon
      g += L(14, 52, 106, 52) + L(60, 10, 60, 66, "a");
      g += `<circle class="a" cx="60" cy="66" r="3"/>` + `<rect class="i" x="50" y="46" width="20" height="12" rx="2"/>`;
      break;
    case "agency": // flight, rising out of the lines
      for (let i = 0; i < 3; i++) g += L(14, 58 + i * 6, 106, 58 + i * 6);
      g += `<path class="a" d="M44 40 L60 28 L76 40"/><path class="i" d="M52 48 L60 42 L68 48"/>`;
      break;
    case "japan": // a sun over a brushed horizon
      g += `<circle class="a" cx="60" cy="34" r="16"/>`;
      g += L(12, 56, 108, 56) + L(24, 62, 96, 62) + L(40, 68, 80, 68);
      break;
    case "mentor": // two figures, one taller, one arc between them
      g += `<rect class="i" x="40" y="22" width="10" height="44" rx="5"/><rect class="i" x="70" y="40" width="10" height="26" rx="5"/>`;
      g += `<path class="a" d="M45 22 Q62 6 75 40"/>`;
      break;
    case "extremism": // a circle split, one half hatched
      g += `<circle class="i" cx="60" cy="40" r="24"/>` + L(60, 12, 60, 68, "a");
      for (let i = -18; i <= 18; i += 6) { const y = 40 + i, dx = Math.sqrt(Math.max(0, 24 * 24 - i * i)); g += L(60 - dx, y, 60, y); }
      break;
    default: { // a reel, turned to its own angle
      const a0 = (seed * 37) % 360;
      g += `<circle class="i" cx="60" cy="40" r="24"/><circle class="i" cx="60" cy="40" r="5"/>`;
      for (let k = 0; k < 5; k++) { const a = ((a0 + k * 72) * Math.PI) / 180; g += `<circle class="${k === 0 ? "a" : "i"}" cx="${(60 + Math.cos(a) * 14).toFixed(1)}" cy="${(40 + Math.sin(a) * 14).toFixed(1)}" r="5"/>`; }
    }
  }
  return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true">${g}</svg>`;
}
