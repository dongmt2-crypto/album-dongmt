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
    const { getSpotifyToken, clearSpotifyToken } = await import("./albums.server");
    const url = buildSearchUrl(data.query, data.mode);
    let lastError = "";

    // Retry transient upstream failures without imposing a client-side deadline.
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 400 * attempt));
      try {
        const token = await getSpotifyToken();
        const res = await fetch(url, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          clearSpotifyToken();
          lastError = "token expired";
          continue;
        }
        if (!res.ok) {
          lastError = `status ${res.status}`;
          continue;
        }
        const json = (await res.json()) as {
          albums?: { items?: unknown };
          error?: { message?: string };
        };
        if (json.error) {
          lastError = json.error.message ?? "provider error";
          continue;
        }
        return mapAlbums(json.albums?.items, data.query, data.mode).slice(0, 48);
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        if (lastError.includes("not configured")) break;
      }
    }

    console.error("[albums] search failed:", lastError);
    throw new Error(`Artwork search failed (${lastError})`);
  });
