import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildImageSearchUrl, parseImageResults, type Album } from "./albums.shared";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Cookie: "SRCHHPGUSR=ADLT=DEMOTE",
};

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
    const url = buildImageSearchUrl(data.query, data.mode);
    let lastError = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 400 * attempt));
      try {
        const res = await fetch(url, { headers: BROWSER_HEADERS });
        if (!res.ok) {
          lastError = `status ${res.status}`;
          continue;
        }
        const html = await res.text();
        const albums = parseImageResults(html).slice(0, 60);
        if (albums.length === 0) {
          lastError = "no images found in response";
          continue;
        }
        return albums;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    console.error("[albums] image search failed:", lastError);
    throw new Error("Image search is temporarily unavailable");
  });
