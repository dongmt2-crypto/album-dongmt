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

type DeezerAlbum = {
  id?: number | string;
  title?: string;
  release_date?: string;
  nb_tracks?: number;
  cover_small?: string;
  cover_medium?: string;
  cover_big?: string;
  cover_xl?: string;
  artist?: { name?: string };
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

export function mapDeezerAlbums(results: unknown, query: string, mode: SearchMode): Album[] {
  const raw = (Array.isArray(results) ? results : []) as DeezerAlbum[];
  const seen = new Set<string>();
  const albums: Album[] = [];
  const needle = query.trim().toLocaleLowerCase();

  for (const result of raw) {
    const id = result.id === undefined ? null : String(result.id);
    const max = result.cover_xl ?? result.cover_big ?? result.cover_medium ?? null;
    if (!id || !max || seen.has(id)) continue;

    const title = result.title ?? "Untitled";
    const artist = result.artist?.name ?? "Unknown artist";
    if (mode === "artist" && !artist.toLocaleLowerCase().includes(needle)) continue;
    if (mode === "album" && !title.toLocaleLowerCase().includes(needle)) continue;
    seen.add(id);

    albums.push({
      id: `deezer-${id}`,
      title,
      artist,
      year: result.release_date ? result.release_date.slice(0, 4) : null,
      trackCount: typeof result.nb_tracks === "number" ? result.nb_tracks : null,
      genre: null,
      thumb: result.cover_medium ?? result.cover_small ?? max,
      medium: result.cover_medium ?? result.cover_big ?? max,
      large: result.cover_big ?? max,
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

export function buildDeezerSearchUrl(query: string, mode: SearchMode) {
  const value = query.trim().replaceAll('"', "");
  const q = mode === "artist" ? `artist:\"${value}\"` : mode === "album" ? `album:\"${value}\"` : value;
  const params = new URLSearchParams({ q, limit: "48", output: "json" });
  return `https://api.deezer.com/search/album?${params.toString()}`;
}
