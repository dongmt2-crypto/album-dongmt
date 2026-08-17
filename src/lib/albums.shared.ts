export type Album = {
  id: string;
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

type SpotifyImage = { url?: string; width?: number | null; height?: number | null };

type SpotifyAlbum = {
  id?: string;
  name?: string;
  release_date?: string;
  total_tracks?: number;
  images?: SpotifyImage[];
  artists?: { name?: string }[];
};

/** Spotify serves fixed image variants (640 / 300 / 64); pick the closest at or above the target. */
function pickImage(images: SpotifyImage[], target: number): string | null {
  const usable = images
    .filter((i) => typeof i.url === "string")
    .map((i) => ({ url: i.url as string, w: i.width ?? 0 }))
    .sort((a, b) => a.w - b.w);
  if (usable.length === 0) return null;
  return (usable.find((i) => i.w >= target) ?? usable[usable.length - 1]!).url;
}

export function mapAlbums(results: unknown, query: string, mode: SearchMode): Album[] {
  const raw = (Array.isArray(results) ? results : []) as SpotifyAlbum[];
  const seen = new Set<string>();
  const albums: Album[] = [];
  const needle = query.trim().toLocaleLowerCase();

  for (const r of raw) {
    const id = typeof r.id === "string" ? r.id : null;
    const images = Array.isArray(r.images) ? r.images : [];
    const max = pickImage(images, 640);
    if (id === null || !max || seen.has(id)) continue;
    const title = r.name ?? "Untitled";
    const artist = r.artists?.map((a) => a.name).filter(Boolean).join(", ") || "Unknown artist";
    if (mode === "artist" && !artist.toLocaleLowerCase().includes(needle)) continue;
    if (mode === "album" && !title.toLocaleLowerCase().includes(needle)) continue;
    seen.add(id);

    albums.push({
      id,
      title,
      artist,
      year: r.release_date ? r.release_date.slice(0, 4) : null,
      trackCount: typeof r.total_tracks === "number" ? r.total_tracks : null,
      genre: null,
      thumb: pickImage(images, 300) ?? max,
      medium: pickImage(images, 300) ?? max,
      large: max,
      max,
    });
  }

  return albums;
}

export function buildSearchUrl(query: string, mode: SearchMode) {
  const q =
    mode === "artist"
      ? `artist:"${query.trim()}"`
      : mode === "album"
        ? `album:"${query.trim()}"`
        : query.trim();
  const params = new URLSearchParams({ q, type: "album", limit: "48" });
  return `https://api.spotify.com/v1/search?${params.toString()}`;
}
