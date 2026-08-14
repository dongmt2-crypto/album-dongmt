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

type RawResult = {
  collectionId?: number;
  collectionName?: string;
  artistName?: string;
  artworkUrl100?: string;
  releaseDate?: string;
  trackCount?: number;
  primaryGenreName?: string;
};

const sizeUrl = (art: string, px: number) =>
  art.replace(/\/\d+x\d+(bb)?\.(jpg|png)$/i, `/${px}x${px}bb.jpg`);

export function mapAlbums(results: unknown): Album[] {
  const raw = (Array.isArray(results) ? results : []) as RawResult[];
  const seen = new Set<number>();
  const albums: Album[] = [];

  for (const r of raw) {
    const id = typeof r.collectionId === "number" ? r.collectionId : null;
    const art = typeof r.artworkUrl100 === "string" ? r.artworkUrl100 : null;
    if (id === null || !art || seen.has(id)) continue;
    seen.add(id);

    albums.push({
      id,
      title: r.collectionName ?? "Untitled",
      artist: r.artistName ?? "Unknown artist",
      year: typeof r.releaseDate === "string" ? r.releaseDate.slice(0, 4) : null,
      trackCount: typeof r.trackCount === "number" ? r.trackCount : null,
      genre: r.primaryGenreName ?? null,
      thumb: sizeUrl(art, 300),
      medium: sizeUrl(art, 600),
      large: sizeUrl(art, 1200),
      max: sizeUrl(art, 3000),
    });
  }

  return albums;
}

export function buildSearchUrl(query: string, mode: SearchMode) {
  const params = new URLSearchParams({
    term: query,
    entity: "album",
    media: "music",
    limit: "48",
  });
  if (mode === "artist") params.set("attribute", "artistTerm");
  if (mode === "album") params.set("attribute", "albumTerm");
  return `https://itunes.apple.com/search?${params.toString()}`;
}
