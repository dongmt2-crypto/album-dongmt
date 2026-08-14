import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

const searchInput = z.object({
  query: z.string().min(1).max(120),
  mode: z.enum(["all", "artist", "album"]).default("all"),
});

export const searchAlbums = createServerFn({ method: "GET" })
  .inputValidator((data) => searchInput.parse(data))
  .handler(async ({ data }): Promise<Album[]> => {
    const params = new URLSearchParams({
      term: data.query,
      entity: "album",
      media: "music",
      limit: "48",
    });
    if (data.mode === "artist") params.set("attribute", "artistTerm");
    if (data.mode === "album") params.set("attribute", "albumTerm");

    const res = await fetch(`https://itunes.apple.com/search?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Artwork search failed (${res.status})`);
    }
    const json = (await res.json()) as { results?: unknown[] };
    const raw = Array.isArray(json.results) ? json.results : [];

    const seen = new Set<number>();
    const albums: Album[] = [];

    for (const item of raw) {
      const r = item as Record<string, unknown>;
      const id = typeof r.collectionId === "number" ? r.collectionId : null;
      const art = typeof r.artworkUrl100 === "string" ? r.artworkUrl100 : null;
      if (id === null || !art || seen.has(id)) continue;
      seen.add(id);

      const size = (px: number) => art.replace(/\/\d+x\d+(bb)?\.(jpg|png)$/i, `/${px}x${px}bb.jpg`);
      const released = typeof r.releaseDate === "string" ? r.releaseDate.slice(0, 4) : null;

      albums.push({
        id,
        title: String(r.collectionName ?? "Untitled"),
        artist: String(r.artistName ?? "Unknown artist"),
        year: released,
        trackCount: typeof r.trackCount === "number" ? r.trackCount : null,
        genre: typeof r.primaryGenreName === "string" ? r.primaryGenreName : null,
        thumb: size(300),
        medium: size(600),
        large: size(1200),
        max: size(3000),
      });
    }

    return albums;
  });