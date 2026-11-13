// The Listening Room: the artists in Nathaniel's order, and the records the
// turntable plays through. A track with a `spotify` link plays in the official
// Spotify player on the page; without one, "listen" opens a Spotify search for it.

export type Track = { title: string; artist: string; album: string; year: number; spotify?: string };
export type Artist = { name: string; place: string; side: string };

export const ARTISTS: Artist[] = [
  { name: "Pink Floyd", place: "London · formed 1965", side: "Side A · the one I write about" },
  { name: "The Rolling Stones", place: "London · 1962", side: "Side B · 01" },
  { name: "Oasis", place: "Manchester · 1991", side: "Side B · 02" },
  { name: "Sade", place: "London · 1982", side: "Side B · 03" },
];

export const TRACKS: Track[] = [
  { title: "Wish You Were Here", artist: "Pink Floyd", album: "Wish You Were Here", year: 1975 },
  { title: "Comfortably Numb", artist: "Pink Floyd", album: "The Wall", year: 1979 },
  { title: "Time", artist: "Pink Floyd", album: "The Dark Side of the Moon", year: 1973 },
  { title: "Breathe (In the Air)", artist: "Pink Floyd", album: "The Dark Side of the Moon", year: 1973 },
  { title: "Gimme Shelter", artist: "The Rolling Stones", album: "Let It Bleed", year: 1969 },
  { title: "Wild Horses", artist: "The Rolling Stones", album: "Sticky Fingers", year: 1971 },
  { title: "Sway", artist: "The Rolling Stones", album: "Sticky Fingers", year: 1971 },
  { title: "Champagne Supernova", artist: "Oasis", album: "(What’s the Story) Morning Glory?", year: 1995 },
  { title: "Don’t Look Back in Anger", artist: "Oasis", album: "(What’s the Story) Morning Glory?", year: 1995 },
  { title: "Smooth Operator", artist: "Sade", album: "Diamond Life", year: 1984 },
  { title: "Like a Tattoo", artist: "Sade", album: "Love Deluxe", year: 1992 },
  { title: "Kiss of Life", artist: "Sade", album: "Love Deluxe", year: 1992 },
];

export const listenUrl = (t: Track) => t.spotify ?? `https://open.spotify.com/search/${encodeURIComponent(`${t.title} ${t.artist}`)}`;
/** The official Spotify player for a track link like https://open.spotify.com/track/<id> */
export const embedUrl = (t: Track) => {
  const m = t.spotify && /open\.spotify\.com\/track\/([A-Za-z0-9]+)/.exec(t.spotify);
  return m ? `https://open.spotify.com/embed/track/${m[1]}?utm_source=generator&theme=0` : null;
};
