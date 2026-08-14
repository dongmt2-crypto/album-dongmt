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
    const url = buildSearchUrl(data.query, data.mode);
    let lastError = "";

    // Apple's search endpoint rate-limits bursts (403/429) and occasionally
    // returns an empty body, so retry a couple of times with backoff.
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 400 * attempt));
      try {
        const res = await fetch(url, {
          headers: { Accept: "application/json", "User-Agent": "CoverVault/1.0" },
        });
        if (!res.ok) {
          lastError = `status ${res.status}`;
          continue;
        }
        const text = await res.text();
        if (!text.trim()) {
          lastError = "empty response";
          continue;
        }
        const json = JSON.parse(text) as { results?: unknown };
        return mapAlbums(json.results);
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    throw new Error(`Artwork search failed (${lastError})`);
  });
