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
  rating: 5; // every film here is five stars on his Letterboxd
};

export const FILMS: Film[] = [
  { id: "good-will-hunting", title: "Good Will Hunting", year: 1997, director: "Gus Van Sant", lesson: "Will can solve the proof on the corridor blackboard but cannot sit still for a hug. Genius turned out to be the easy part; the hard part is letting someone know you before you have finished hiding.", tag: "Being known", motif: "genius", core: true, scene: "The park bench conversation", rating: 5 },
  { id: "udaan", title: "Udaan", year: 2010, director: "Vikramaditya Motwane", lesson: "Rohan’s father decides what he will be; the poems he hides decide who he is. Agency, the power of literature, and finding who you are — sometimes by walking away from who you were told to be.", tag: "Agency", motif: "agency", core: true, his: true, scene: "Rohan and the railway tracks", rating: 5 },
  { id: "seven-samurai", title: "Seven Samurai", year: 1954, director: "Akira Kurosawa", lesson: "Seven men defend a village for three bowls of rice a day and leave with nothing but their code intact. It gave me my love for Japanese culture — the discipline, the restraint, and a way of life that outlasts the people who live it.", tag: "Japan", motif: "japan", core: true, his: true, scene: "The samurai and the village", rating: 5 },
  { id: "parasite", title: "Parasite", year: 2019, director: "Bong Joon-ho", lesson: "The rain that is a view from the house on the hill floods the semi-basement across the city. Inequality became architectural for me — not a statistic but a floor plan, with stairs that only run one way.", tag: "Class", motif: "class", core: true, scene: "The hidden space beneath the house", rating: 5 },
  { id: "scent-of-a-woman", title: "Scent of a Woman", year: 1992, director: "Martin Brest", lesson: "Frank Slade is blind, bitter and finished, and he still stands up for the one boy in the room who will not sell out a friend. Integrity is not a mood; it is what you do when the easy exit is right there.", tag: "Integrity", motif: "integrity", core: true, his: true, scene: "Frank Slade", rating: 5 },
  { id: "finding-forrester", title: "Finding Forrester", year: 2000, director: "Gus Van Sant", lesson: "A reclusive novelist tells a boy from the Bronx to write the first draft with his heart and the second with his head. It gave me my love for literature — and the habit of reading a writer’s sentences before their reputation.", tag: "Literature", motif: "literature", core: true, his: true, scene: "The mentor and his protégé", rating: 5 },
  { id: "pursuit-of-happyness", title: "The Pursuit of Happyness", year: 2006, director: "Gabriele Muccino", lesson: "Chris Gardner sleeps in a station bathroom with his son and still turns up to the internship in a clean shirt. Chase your dreams — but the film is really about what the chase costs, and carrying someone with you while you run.", tag: "Dreams", motif: "dreams", core: true, his: true, scene: "Chris and his son", rating: 5 },
  { id: "last-samurai", title: "The Last Samurai", year: 2003, director: "Edward Zwick", lesson: "A broken soldier learns a language, a discipline and a reason to stand still. With Seven Samurai it gave me my love for Japanese culture — a way of life where every small act is done completely, and honour is a daily practice rather than a last stand.", tag: "Japan", motif: "japan", core: true, his: true, scene: "The rain-soaked training scene", rating: 5 },
  { id: "perks", title: "The Perks of Being a Wallflower", year: 2012, director: "Stephen Chbosky", lesson: "Charlie watches from the wall until two people pull him onto the floor. The shortcomings of being a teenager — feeling everything at once with no words for any of it — and the quiet mercy of being accepted anyway.", tag: "Being sixteen", motif: "teenager", core: true, his: true, scene: "The school dance", rating: 5 },
  { id: "taare-zameen-par", title: "Taare Zameen Par", year: 2007, director: "Aamir Khan", lesson: "A boy who sees letters dance is called lazy by everyone except one art teacher who looks closer. The power of a mentor is not inspiration; it is attention — finding the shape of a mind before grading it.", tag: "Mentors", motif: "mentor", his: true, scene: "Ishaan in the classroom", rating: 5 },
  { id: "coach-carter", title: "Coach Carter", year: 2005, director: "Thomas Carter", lesson: "Carter locks the gym until his undefeated team passes its classes, and the town turns on him for it. A mentor is someone willing to be hated now so that you can be free later.", tag: "Mentors", motif: "mentor", his: true, scene: "Coach Carter in the classroom", rating: 5 },
  { id: "remember-the-titans", title: "Remember the Titans", year: 2000, director: "Boaz Yakin", lesson: "A team split by race learns to play as one because a coach refuses to let the locker room stay divided. The power of a mentor is to set a standard higher than the world around you and hold everyone to it, himself first.", tag: "Mentors", motif: "mentor", his: true, scene: "The team on the field", rating: 5 },
  { id: "american-history-x", title: "American History X", year: 1998, director: "Tony Kaye", lesson: "Derek learns in prison that the hatred he preached was built on nothing, and comes home too late to spare his brother. Extremism recruits through grievance, belonging and a story with a villain — and the reality of discrimination outlives the ideology that excused it.", tag: "Extremism", motif: "extremism", his: true, scene: "Derek Vinyard", rating: 5 },
  { id: "12th-fail", title: "12th Fail", year: 2023, director: "Vidhu Vinod Chopra", lesson: "Manoj restarts from zero more than once — the exam, the city, the money — and refuses to cheat even when honesty costs him a year. Restart as many times as it takes; never buy the shortcut.", tag: "Restart", motif: "restart", scene: "Manoj preparing for the examination", rating: 5 },
  { id: "million-dollar-baby", title: "Million Dollar Baby", year: 2004, director: "Clint Eastwood", lesson: "“Protect yourself at all times” is the first thing Frankie teaches Maggie and the thing she most needs when it is too late. The film is about who is in your corner when protection fails, and what loyalty asks of them.", tag: "Your corner", motif: "corner", scene: "Maggie and Frankie", rating: 5 },
  { id: "taxi-driver", title: "Taxi Driver", year: 1976, director: "Martin Scorsese", lesson: "Travis drives all night through a city that looks straight through him, until the loneliness curdles into something dangerous. The clearest picture I know of what isolation does to a mind — and of who a city makes invisible.", tag: "Loneliness", motif: "city", scene: "Travis Bickle in the taxi", rating: 5 },
  { id: "dead-poets-society", title: "Dead Poets Society", year: 1989, director: "Peter Weir", lesson: "Carpe diem. Keating has his boys stand on their desks to see the room differently, and the institution makes him pay for it — seize the day, and know what thinking for yourself can cost.", tag: "Carpe diem", motif: "verse", scene: "The desks scene", rating: 5 },
  { id: "jerry-maguire", title: "Jerry Maguire", year: 1996, director: "Cameron Crowe", lesson: "Jerry writes a memo about caring more for fewer clients and is fired by lunchtime. The memo you believe in is worth the job — and the one client who stays matters more than the twenty who leave.", tag: "The memo", motif: "memo", scene: "Jerry on the phone", rating: 5 },
  { id: "how-to-lose-a-guy", title: "How to Lose a Guy in 10 Days", year: 2003, director: "Donald Petrie", lesson: "Andie is writing an article, Ben is winning a bet, and the whole game collapses the second one of them is honest. Two people playing an angle can only meet when someone drops it.", tag: "Honesty", motif: "honest", scene: "Andie and Ben", rating: 5 },
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
