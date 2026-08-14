export type Album = {
  id: number;
  title: string;
  artist: string;
  year: string | null;
  trackCount: number | null;
  genre: string | null;
  thumb: string;
  medium: string;
  large: string;
  max: string;
};

export type SearchMode = "all" | "artist" | "album";

type DeezerAlbum = {
  id?: number;
  title?: string;
  cover_xl?: string;
  nb_tracks?: number;
  artist?: { name?: string };
};

const sizeUrl = (art: string, px: number) =>
  art.replace(/\/\d+x\d+-[^/]+\.(jpg|png)$/i, `/${px}x${px}-000000-80-0-0.jpg`);

export function mapAlbums(results: unknown, query: string, mode: SearchMode): Album[] {
  const raw = (Array.isArray(results) ? results : []) as DeezerAlbum[];
  const seen = new Set<number>();
  const albums: Album[] = [];
  const needle = query.trim().toLocaleLowerCase();

  for (const r of raw) {
    const id = typeof r.id === "number" ? r.id : null;
    const art = typeof r.cover_xl === "string" ? r.cover_xl : null;
    if (id === null || !art || seen.has(id)) continue;
    const title = r.title ?? "Untitled";
    const artist = r.artist?.name ?? "Unknown artist";
    if (mode === "artist" && !artist.toLocaleLowerCase().includes(needle)) continue;
    if (mode === "album" && !title.toLocaleLowerCase().includes(needle)) continue;
    seen.add(id);

    albums.push({
      id,
      title,
      artist,
      year: null,
      trackCount: typeof r.nb_tracks === "number" ? r.nb_tracks : null,
      genre: null,
      thumb: sizeUrl(art, 300),
      medium: sizeUrl(art, 600),
      large: sizeUrl(art, 1200),
      max: sizeUrl(art, 1800),
    });
  }

  return albums;
}

export function buildSearchUrl(query: string, mode: SearchMode) {
  const params = new URLSearchParams({
    q: query,
    limit: mode === "all" ? "48" : "100",
  });
  return `https://api.deezer.com/search/album?${params.toString()}`;
}
