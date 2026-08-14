import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildSearchUrl, mapAlbums, type Album } from "./albums.shared";

export const searchAlbums = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z
      .object({
        query: z.string().min(1).max(120),
        mode: z.enum(["all", "artist", "album"]).default("all"),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<Album[]> => {
    const res = await fetch(buildSearchUrl(data.query, data.mode), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Artwork search failed (${res.status})`);
    const json = (await res.json()) as { results?: unknown };
    return mapAlbums(json.results);
  });
