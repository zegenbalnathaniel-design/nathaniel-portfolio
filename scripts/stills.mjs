// Lists the film stills that exist in public/stills so the page only asks for
// the ones that are there. A still is named after the film's id in
// src/data/films.ts: public/stills/<id>.jpg (or .webp / .png). Runs before
// every build (see package.json), and can be run by hand: node scripts/stills.mjs
import { readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "public", "stills");
mkdirSync(dir, { recursive: true });
const stills = {};
for (const f of readdirSync(dir).sort()) {
  const m = /^([a-z0-9-]+)\.(jpg|jpeg|png|webp|avif)$/i.exec(f);
  if (m && !stills[m[1]]) stills[m[1]] = `/stills/${f}`;
}
writeFileSync(join(root, "src", "data", "stills.json"), JSON.stringify(stills, null, 2) + "\n");
console.log(`stills: ${Object.keys(stills).length} found in public/stills`);
