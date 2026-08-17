import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  buildDeezerSearchUrl,
  buildSearchUrl,
  mapAlbums,
  mapDeezerAlbums,
  type Album,
} from "./albums.shared";

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

    // Spotify now requires Premium for some app owners. Keep it primary, but
    // transparently use Deezer when Spotify denies or cannot serve the search.
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
          const body = (await res.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null;
          lastError = body?.error?.message ?? `status ${res.status}`;
          if (res.status === 403) break;
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

    console.warn("[albums] Spotify unavailable; using Deezer fallback:", lastError);
    try {
      const fallback = await fetch(buildDeezerSearchUrl(data.query, data.mode), {
        headers: { Accept: "application/json", "User-Agent": "DONGMT-Album-Art/1.0" },
      });
      if (!fallback.ok) throw new Error(`status ${fallback.status}`);
      const json = (await fallback.json()) as { data?: unknown; error?: { message?: string } };
      if (json.error) throw new Error(json.error.message ?? "provider error");
      return mapDeezerAlbums(json.data, data.query, data.mode).slice(0, 48);
    } catch (error) {
      const fallbackError = error instanceof Error ? error.message : String(error);
      console.error("[albums] Artwork providers failed:", { spotify: lastError, deezer: fallbackError });
      throw new Error("Artwork search is temporarily unavailable");
    }
  });
