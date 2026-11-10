// Nathaniel's Vision Board.xlsx, rebuilt cell by cell.
// Columns B–H and Social Work follow the newer sheet (with its colours);
// Books, Skillsets and Sports follow the original plan and carry no colour.
// Personal-statement drafts, a financial-aid note and teachers' names are
// left out on purpose: they belong in the file, not on a public page.

export type Status = "done" | "miss" | "tbd" | null;
export type Item = { t: string; s?: Status };
export type Block = { h?: string; items: Item[] };
export type Cell = Block[];

export const COLUMNS = [
  "Grade",
  "Academics",
  "Positions Held",
  "Examinations / Requirements",
  "Internships / Certifications",
  "Clubs",
  "Competitions",
  "Social Work",
  "Books",
  "Skillsets",
  "Sports",
];

const dash: Cell = [{ items: [{ t: "–" }] }];
const core = ["Language & Literature", "Language Acquisition – French", "Biology", "Chemistry", "Physics", "Mathematics", "Integrated Humanities"];

export const ROWS: { grade: string; span: string; cells: Cell[] }[] = [
  {
    grade: "Grade 9th",
    span: "July 2023 – June 2024",
    cells: [
      [{ h: "Core Subjects", items: core.map((t) => ({ t })) }, { h: "Elective Subjects", items: [{ t: "Design" }] }],
      dash,
      [{ items: [{ t: "Create Resume Format" }] }],
      [
        { h: "Summer Internship", items: [{ t: "Illumine Industries (Customer Acquisitions, Human Resources, Finance & Operations)" }] },
        { h: "Certifications", items: [{ t: "Udemy: Excel for Beginners" }, { t: "Udemy: PPT for Beginners" }] },
      ],
      dash,
      dash,
      dash,
      [{ items: [{ t: "The Catcher in the Rye" }, { t: "Atomic Habits" }, { t: "To Kill a Mockingbird" }] }],
      [{ h: "Life Skills", items: [{ t: "Riding a scooter" }] }],
      [
        { h: "Cricket", items: [{ t: "CSK Academy – Under 16s" }] },
        { h: "Sports Day", items: [{ t: "100m – 1st Place" }, { t: "200m – 1st Place" }, { t: "400m – 1st Place" }, { t: "4×100m Relay – 1st Place" }] },
        { items: [{ t: "House Football Team" }] },
      ],
    ],
  },
  {
    grade: "Grade 10th",
    span: "July 2024 – June 2025",
    cells: [
      [
        { h: "Core Subjects", items: core.map((t) => ({ t })) },
        { h: "Elective Subjects", items: [{ t: "Design" }] },
        { h: "Personal Project", items: [{ t: "Training Schedule for Teenage Cricketers" }] },
      ],
      [{ h: "School Positions", items: [{ t: "MUN Co-Chair (SPECPOL)" }] }, { h: "Outside School Positions", items: [{ t: "X", s: "miss" }] }],
      [{ h: "College Preparation Exams", items: [{ t: "PSATs", s: "miss" }, { t: "CAT / WAT Prep", s: "miss" }, { t: "Written Ability Test (WAT) Prep", s: "miss" }, { t: "Personal Interview (PI) Prep", s: "miss" }] }],
      [{ h: "Summer Internship", items: [{ t: "X", s: "miss" }] }, { h: "Certifications", items: [{ t: "X", s: "miss" }] }],
      [{ items: [{ t: "National Honour Society (NHS)", s: "miss" }, { t: "Speech & Debate Club", s: "miss" }, { t: "Gavel", s: "miss" }] }],
      dash,
      [{ h: "Project 1", items: [{ t: "Books Donation Drive" }] }, { h: "Project 2", items: [{ t: "Christmas Box" }] }],
      [{ items: [{ t: "The Psychology of Money" }, { t: "The Perks of Being a Wallflower" }, { t: "The Art of War" }] }],
      [{ h: "Life Skills", items: [{ t: "Set up banking (savings account, net banking, debit card)" }, { t: "Set up LinkedIn" }] }],
      [{ items: [{ t: "5K" }, { t: "10K" }, { t: "SDAT swim camp" }] }],
    ],
  },
  {
    grade: "Grade 11th",
    span: "July 2025 – June 2026",
    cells: [
      [
        { h: "Higher Levels", items: [{ t: "Mathematics AI" }, { t: "Business Management" }, { t: "Economics" }] },
        { h: "Secondary Level", items: [{ t: "Computer Science" }, { t: "Language & Literature" }, { t: "Language Acquisition (Spanish Ab Initio)" }] },
        { h: "Internal Assessment", items: [{ t: "ECO: 1 2 3", s: "tbd" }, { t: "BM: 1", s: "tbd" }, { t: "MATHS: 1", s: "tbd" }, { t: "ENGLISH", s: "tbd" }, { t: "SPANISH", s: "tbd" }, { t: "CS", s: "tbd" }] },
        { h: "Theory of Knowledge", items: [{ t: "TBD", s: "tbd" }] },
        { h: "Extended Essay", items: [{ t: "Economics", s: "done" }] },
        { h: "Creativity, Activity, Service", items: [{ t: "Wix portfolio created" }, { t: "CAS Project", s: "done" }, { t: "CAS Interviews", s: "done" }, { t: "CAS Portfolio", s: "done" }] },
      ],
      [{ h: "School Positions", items: [{ t: "Podcast Co-Editor", s: "done" }] }, { h: "Outside School Positions", items: [{ t: "CEO – Edugate", s: "done" }] }],
      [{ h: "College Preparation Exams", items: [{ t: "SAT Prep", s: "done" }, { t: "IELTS / TOEFL", s: "miss" }, { t: "Written Ability Test (WAT) Prep", s: "miss" }, { t: "Personal Interview (PI) Prep", s: "miss" }] }],
      [
        { h: "Winter Internship", items: [{ t: "TBD", s: "tbd" }] },
        { h: "Summer Internship", items: [{ t: "Organising a football competition", s: "miss" }] },
        { h: "Certifications", items: [{ t: "Udemy – Python", s: "done" }, { t: "Google Digital Garage – Digital Marketing", s: "done" }, { t: "Guitar – Trinity Grade 2", s: "done" }, { t: "Red Cross: CPR & First Aid Training", s: "miss" }] },
      ],
      [{ items: [{ t: "TBD", s: "tbd" }] }],
      [{ items: [{ t: "National Finance Olympiad – Round 2 finalist", s: "done" }, { t: "Blue Ocean", s: "tbd" }, { t: "Melbourne Business Plan", s: "tbd" }, { t: "HSSL – Top 10 of 10,000", s: "done" }] }],
      [
        { h: "Project 1", items: [{ t: "Futsal tournament for government-school children", s: "miss" }] },
        { h: "Project 2", items: [{ t: "Introduction to Computer Science – Grades 3 & 4 and 5 & 6", s: "done" }] },
        { h: "Project 3", items: [{ t: "Christmas in a Box – Prema Vasam", s: "done" }] },
      ],
      [{ items: [{ t: "The Hate U Give" }, { t: "Rich Dad Poor Dad" }, { t: "The Monk Who Sold His Ferrari" }] }],
      [{ h: "Life Skills", items: [] }],
      [{ items: [{ t: "10K ×2" }, { t: "21K ×2" }] }],
    ],
  },
  {
    grade: "Grade 12th",
    span: "July 2026 – June 2027",
    cells: [
      [
        { h: "Higher Levels", items: [{ t: "Mathematics AI" }, { t: "Business Management" }, { t: "Economics" }] },
        { h: "Secondary Level", items: [{ t: "Computer Science" }, { t: "Language & Literature" }, { t: "Language Acquisition (Spanish Ab Initio)" }] },
        { h: "Theory of Knowledge", items: [{ t: "TBD", s: "tbd" }] },
        { h: "Extended Essay", items: [{ t: "TBD", s: "tbd" }] },
      ],
      [{ h: "School Positions", items: [{ t: "NA", s: "miss" }] }, { h: "Outside School Positions", items: [{ t: "TBD", s: "tbd" }] }],
      [
        { h: "Entrance Examinations", items: [{ t: "SATs" }, { t: "SMAT Prep" }, { t: "Written Ability Test (WAT)" }, { t: "Personal Interview (PI)" }] },
        { h: "University Essays", items: [{ t: "TBD", s: "tbd" }] },
        { h: "Recommendation Letters", items: [{ t: "Principal" }, { t: "Guidance Counsellor" }, { t: "Economics / BM teacher", s: "tbd" }, { t: "CAS Coordinator", s: "tbd" }] },
      ],
      [{ h: "Internship", items: [{ t: "TBD", s: "tbd" }] }, { h: "Certifications", items: [{ t: "LinkedIn Learning – Event Planning Foundations", s: "miss" }, { t: "Coursera – Excel for Beginners", s: "miss" }] }],
      [{ items: [{ t: "Gavel Club", s: "miss" }] }],
      [{ items: [{ t: "TBD", s: "tbd" }] }],
      [{ h: "Project 1", items: [{ t: "Toy Donation Drive", s: "miss" }] }, { h: "Project 2", items: [] }],
      [{ items: [{ t: "The 7 Habits of Highly Effective People" }, { t: "The Magic of Thinking Big" }, { t: "Start with Why" }] }],
      [{ h: "Life Skills", items: [] }],
      [{ items: [{ t: "21K ×2" }, { t: "42K", s: "tbd" }] }],
    ],
  },
];
