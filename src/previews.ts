// Real audio for the record. Apple's public iTunes Search API returns, for
// every song, a 30-second preview clip of the original recording — the
// stretch Apple picks to represent it — plus a link to the full song. The
// page asks it (from the visitor's browser) for each track on the record,
// picks the studio original out of the results, and plays the clip.
//
// The response is third-party data: only https links on Apple's own domains
// are ever used, and anything that does not match is ignored.

import type { Track } from "./data/music";

export type Preview = { url: string; name: string; artist: string; album: string; page?: string };
type Result = { trackName?: string; artistName?: string; collectionName?: string; previewUrl?: string; trackViewUrl?: string; trackTimeMillis?: number };

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’'`]/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
/** "Time - 2011 Remaster", "Breathe (In the Air)", "Sway [Live]" → the bare title */
const bare = (s: string) => norm(s.replace(/\([^)]*\)|\[[^\]]*\]/g, " ").replace(/\s-\s.*$/, " "));
// versions that are not the record he means
const NOT_THE_ORIGINAL = /\b(live|karaoke|tribute|cover|covers|instrumental|made famous|originally performed|re recorded|rerecorded|demo|session|sessions|remix|workout|lullaby|piano version|string quartet|8 bit|backing track)\b/;
const COMPILATION = /\b(greatest hits|best of|hits|anthology|collection|singles|forty licks|grrr|hot rocks|essential|ultimate|gold|classics|definitive|selected|compilation|vol)\b/;

const safe = (u: unknown, hosts: string[]): string | undefined => {
  if (typeof u !== "string") return undefined;
  try {
    const x = new URL(u);
    return x.protocol === "https:" && hosts.some((h) => x.hostname === h || x.hostname.endsWith("." + h)) ? x.href : undefined;
  } catch { return undefined; }
};

function score(r: Result, t: Track, relaxed: boolean): number {
  if (!r.previewUrl || !r.trackName || !r.artistName) return -1;
  if (norm(r.artistName) !== norm(t.artist)) return -1; // the artist must be exactly him, never a tribute act
  const want = bare(t.title), got = bare(r.trackName);
  if (relaxed ? !got.startsWith(want) : got !== want) return -1;
  const album = r.collectionName ?? "";
  if (NOT_THE_ORIGINAL.test(norm(`${r.trackName} ${album}`))) return -1;
  let s = relaxed ? 6 : 10;
  const wa = bare(t.album), ga = bare(album);
  if (ga === wa) s += 6; else if (ga && (ga.includes(wa) || wa.includes(ga))) s += 4;
  if (COMPILATION.test(norm(album))) s -= 3;
  if (r.trackTimeMillis && r.trackTimeMillis < 75000) s -= 4; // a snippet, not the song
  return s;
}

/** The studio original among a search's results, as a Preview, or null. */
export function pick(results: Result[], t: Track): Preview | null {
  for (const relaxed of [false, true]) {
    let best: Result | null = null, top = -1;
    for (const r of results) { const s = score(r, t, relaxed); if (s > top) { top = s; best = r; } }
    const url = best && safe(best.previewUrl, ["mzstatic.com", "apple.com"]);
    if (best && url) return { url, name: best.trackName!, artist: best.artistName!, album: best.collectionName ?? "", page: safe(best.trackViewUrl, ["apple.com"]) };
  }
  return null;
}

// ---------------------------------------------------------------- asking Apple
const API = "https://itunes.apple.com/search";
let jid = 0;

/** null means the service could not be reached at all (blocked, offline); [] means it answered with nothing. */
function jsonp(url: string): Promise<Result[] | null> {
  return new Promise((resolve) => {
    const cb = `__nzItunes${++jid}`;
    const s = document.createElement("script");
    const w = window as unknown as Record<string, unknown>;
    const done = (v: Result[] | null) => { clearTimeout(timer); delete w[cb]; s.remove(); resolve(v); };
    const timer = setTimeout(() => done(null), 8000);
    w[cb] = (d: { results?: Result[] }) => done(Array.isArray(d?.results) ? d.results : []);
    s.onerror = () => done(null);
    s.src = `${url}&callback=${cb}`;
    document.head.append(s);
  });
}

async function search(term: string): Promise<Result[] | null> {
  const url = `${API}?term=${encodeURIComponent(term)}&media=music&entity=song&limit=25`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (r.ok) { const d = await r.json(); if (Array.isArray(d?.results)) return d.results; }
  } catch { /* blocked or offline: try the script route */ } finally { clearTimeout(timer); }
  return jsonp(url);
}

const cache = new Map<string, Promise<Preview | null>>();
const resolved = new Map<string, Preview | null>();
const key = (t: Track) => `${t.artist}|${t.title}`;
// When Apple cannot be reached at all, stop asking for a while rather than fire dozens of doomed requests.
let downUntil = 0;
/** The answer for a track if it is already known (a Preview, or null for "Apple has none"); undefined if not yet asked. Lets a tap start the clip at once. */
export const peekPreview = (t: Track): Preview | null | undefined => resolved.get(key(t));
/** True if the last attempt could not reach Apple's service at all (as opposed to it having no such song). */
export const previewsUnreachable = () => Date.now() < downUntil;

/** Resolve (once) the preview for a track. */
export function previewFor(t: Track): Promise<Preview | null> {
  let p = cache.get(key(t));
  if (!p) {
    if (previewsUnreachable()) return Promise.resolve(null);
    p = (async () => {
      const a = await search(`${t.title} ${t.artist}`);
      if (a === null) { downUntil = Date.now() + 30000; cache.delete(key(t)); return null; }
      const first = pick(a, t);
      if (first) { resolved.set(key(t), first); return first; }
      const b = await search(`${t.artist} ${t.album}`);
      if (b === null) { downUntil = Date.now() + 30000; cache.delete(key(t)); return null; }
      const second = pick(b, t);
      resolved.set(key(t), second);
      return second;
    })().catch(() => null);
    cache.set(key(t), p);
  }
  return p;
}

let warming = false;
/** Warm the cache one lookup at a time (never a burst, and it stops the moment Apple proves unreachable), so a tap finds its clip ready. */
export async function prefetchPreviews(tracks: Track[]) {
  if (warming) return;
  warming = true;
  try {
    for (const t of tracks) {
      if (previewsUnreachable()) break;
      await previewFor(t);
      await new Promise((r) => setTimeout(r, 120));
    }
  } finally { warming = false; }
}
