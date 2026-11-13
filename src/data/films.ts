// The Cinematic Mind: the films, in Nathaniel's order, and what each one left
// him. The lessons marked `his` are in his own words from the brief; the rest
// were drafted for him to confirm or rewrite, so every film has one.

export type Motif = "literature" | "teenager" | "dreams" | "integrity" | "agency" | "japan" | "mentor" | "extremism" | "class" | "restart" | "corner" | "city" | "verse" | "memo" | "honest" | "genius";

export type Film = {
  id: string;
  title: string;
  year: number;
  director: string;
  lesson: string;
  tag: string;
  motif: Motif;
  core?: boolean; // one of the films that shaped his life
  his?: boolean; // the lesson is in his words
  scene: string; // the frame on the strip
};

export const FILMS: Film[] = [
  { id: "good-will-hunting", title: "Good Will Hunting", year: 1997, director: "Gus Van Sant", lesson: "Brilliance is the easy part. Letting someone in is the hard part.", tag: "Letting people in", motif: "genius", core: true, scene: "The park bench conversation" },
  { id: "udaan", title: "Udaan", year: 2010, director: "Vikramaditya Motwane", lesson: "Agency, the power of literature, and finding who you are.", tag: "Agency", motif: "agency", core: true, his: true, scene: "Rohan and the railway tracks" },
  { id: "seven-samurai", title: "Seven Samurai", year: 1954, director: "Akira Kurosawa", lesson: "A love for Japanese culture, and its everlasting way of life.", tag: "Japan", motif: "japan", core: true, his: true, scene: "The samurai and the village" },
  { id: "parasite", title: "Parasite", year: 2019, director: "Bong Joon-ho", lesson: "Inequality has a floor plan. The same rain is a view from upstairs and a flood in the basement.", tag: "Class", motif: "class", core: true, scene: "The hidden space beneath the house" },
  { id: "scent-of-a-woman", title: "Scent of a Woman", year: 1992, director: "Martin Brest", lesson: "Integrity.", tag: "Integrity", motif: "integrity", core: true, his: true, scene: "Frank Slade" },
  { id: "finding-forrester", title: "Finding Forrester", year: 2000, director: "Gus Van Sant", lesson: "It gave me my love for literature.", tag: "Literature", motif: "literature", core: true, his: true, scene: "The mentor and his protégé" },
  { id: "pursuit-of-happyness", title: "The Pursuit of Happyness", year: 2006, director: "Gabriele Muccino", lesson: "Chase your dreams.", tag: "Dreams", motif: "dreams", core: true, his: true, scene: "Chris and his son" },
  { id: "last-samurai", title: "The Last Samurai", year: 2003, director: "Edward Zwick", lesson: "A love for Japanese culture, and its everlasting way of life.", tag: "Japan", motif: "japan", core: true, his: true, scene: "The rain-soaked training scene" },
  { id: "perks", title: "The Perks of Being a Wallflower", year: 2012, director: "Stephen Chbosky", lesson: "The shortcomings of being a teenager.", tag: "Being sixteen", motif: "teenager", core: true, his: true, scene: "The school dance" },
  { id: "taare-zameen-par", title: "Taare Zameen Par", year: 2007, director: "Aamir Khan", lesson: "The power of life — and of a mentor.", tag: "Mentors", motif: "mentor", his: true, scene: "Ishaan in the classroom" },
  { id: "coach-carter", title: "Coach Carter", year: 2005, director: "Thomas Carter", lesson: "The power of life — and of a mentor.", tag: "Mentors", motif: "mentor", his: true, scene: "Coach Carter in the classroom" },
  { id: "remember-the-titans", title: "Remember the Titans", year: 2000, director: "Boaz Yakin", lesson: "The power of life — and of a mentor.", tag: "Mentors", motif: "mentor", his: true, scene: "The team on the field" },
  { id: "american-history-x", title: "American History X", year: 1998, director: "Tony Kaye", lesson: "Extremism, and the reality of discrimination in society.", tag: "Extremism", motif: "extremism", his: true, scene: "Derek Vinyard" },
  { id: "12th-fail", title: "12th Fail", year: 2023, director: "Vidhu Vinod Chopra", lesson: "Restart — as many times as it takes, and honestly every time.", tag: "Restart", motif: "restart", scene: "Manoj preparing for the examination" },
  { id: "million-dollar-baby", title: "Million Dollar Baby", year: 2004, director: "Clint Eastwood", lesson: "Protect yourself at all times, and know who is in your corner.", tag: "Your corner", motif: "corner", scene: "Maggie and Frankie" },
  { id: "taxi-driver", title: "Taxi Driver", year: 1976, director: "Martin Scorsese", lesson: "What loneliness does to a mind, and how a city can look straight through a person.", tag: "Loneliness", motif: "city", scene: "Travis Bickle in the taxi" },
  { id: "dead-poets-society", title: "Dead Poets Society", year: 1989, director: "Peter Weir", lesson: "Seize the day — and understand what thinking for yourself can cost.", tag: "Carpe diem", motif: "verse", scene: "The desks scene" },
  { id: "jerry-maguire", title: "Jerry Maguire", year: 1996, director: "Cameron Crowe", lesson: "Fewer clients, more care. Write the memo you believe in, even if it costs you the job.", tag: "The memo", motif: "memo", scene: "Jerry on the phone" },
  { id: "how-to-lose-a-guy", title: "How to Lose a Guy in 10 Days", year: 2003, director: "Donald Petrie", lesson: "Two people playing an angle, and the game ends the moment one of them is honest.", tag: "Honesty", motif: "honest", scene: "Andie and Ben" },
];

export const CORE_COUNT = FILMS.filter((f) => f.core).length;

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
    case "class": // a house in section: the stairs up, the basement below the water line
      g += `<path class="i" d="M20 62 V26 L60 8 L100 26 V62"/>` + L(20, 46, 100, 46) + `<path class="i" d="M44 46 V40 H52 V34 H60 V28"/>`;
      g += `<path class="a" d="M20 62 Q30 58 40 62 T60 62 T80 62 T100 62"/>`;
      break;
    case "restart": // a line that stops, and begins again, and again
      g += L(14, 40, 40, 40) + L(44, 40, 70, 40) + L(74, 40, 100, 40);
      g += `<path class="a" d="M40 30 L40 50"/><path class="a" d="M70 30 L70 50"/><circle class="a" cx="104" cy="40" r="3"/>`;
      break;
    case "corner": // a ring's corner post and the rope
      g += L(20, 20, 20, 66, "a") + L(20, 28, 104, 28) + L(20, 42, 104, 42) + L(20, 56, 104, 56);
      g += `<circle class="i" cx="42" cy="49" r="5"/>`;
      break;
    case "city": // rain over a grid, one window lit
      for (let i = 0; i < 6; i++) g += L(22 + i * 14, 20, 22 + i * 14, 66);
      for (let i = 0; i < 4; i++) g += L(22, 20 + i * 15, 92, 20 + i * 15);
      g += `<rect class="a" x="51" y="36" width="12" height="14"/>`;
      break;
    case "verse": // a desk, and a figure standing on it
      g += `<rect class="i" x="30" y="44" width="60" height="6"/>` + L(34, 50, 34, 68) + L(86, 50, 86, 68);
      g += `<rect class="a" x="56" y="16" width="8" height="28" rx="4"/>`;
      break;
    case "memo": // a page, mostly written, one line underlined
      g += `<rect class="i" x="34" y="10" width="52" height="60"/>`;
      for (let i = 0; i < 5; i++) g += L(42, 22 + i * 9, 78, 22 + i * 9);
      g += L(42, 62, 70, 62, "a");
      break;
    case "honest": // two masks, one lifted off
      g += `<path class="i" d="M30 30 Q44 20 58 30 L54 54 Q44 60 34 54 Z"/><path class="a" d="M62 22 Q76 12 90 22 L86 46 Q76 52 66 46 Z"/>`;
      g += L(72, 52, 72, 70, "a");
      break;
    case "genius": // a blackboard with one proof, and a door ajar
      g += `<rect class="i" x="16" y="14" width="56" height="40"/>` + L(24, 26, 60, 26) + L(24, 34, 52, 34) + L(24, 42, 64, 42);
      g += `<path class="a" d="M84 14 L104 20 V66 L84 60 Z"/>` + L(84, 14, 84, 60);
      break;
    default: { // a reel, turned to its own angle
      const a0 = (seed * 37) % 360;
      g += `<circle class="i" cx="60" cy="40" r="24"/><circle class="i" cx="60" cy="40" r="5"/>`;
      for (let k = 0; k < 5; k++) { const a = ((a0 + k * 72) * Math.PI) / 180; g += `<circle class="${k === 0 ? "a" : "i"}" cx="${(60 + Math.cos(a) * 14).toFixed(1)}" cy="${(40 + Math.sin(a) * 14).toFixed(1)}" r="5"/>`; }
    }
  }
  return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true">${g}</svg>`;
}
