export type Album = {
  id: string;
  title: string;
  source: string;
  width: number | null;
  height: number | null;
  thumb: string;
  full: string;
};

export type SearchMode = "all" | "artist" | "album";

export function buildQuery(query: string, mode: SearchMode) {
  const value = query.trim();
  if (mode === "artist") return `${value} artist album covers`;
  if (mode === "album") return `${value} album cover art`;
  return `${value} album cover`;
}

/** HTML image-search results page (no API key, no account). */
export function buildImageSearchUrl(query: string, mode: SearchMode) {
  const params = new URLSearchParams({
    q: buildQuery(query, mode),
    form: "HDRSC2",
    first: "1",
    count: "60",
  });
  return `https://www.bing.com/images/search?${params.toString()}`;
}

function decodeEntities(input: string) {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

type RawResult = {
  murl?: string;
  turl?: string;
  t?: string;
  purl?: string;
};

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown source";
  }
}

/** Pull the embedded JSON metadata blocks out of the search results HTML. */
export function parseImageResults(html: string): Album[] {
  const albums: Album[] = [];
  const seen = new Set<string>();
  const blocks = html.match(/m="({&quot;[\s\S]*?})"/g) ?? [];

  for (const block of blocks) {
    const json = block.slice(3, -1);
    let raw: RawResult;
    try {
      raw = JSON.parse(decodeEntities(json)) as RawResult;
    } catch {
      continue;
    }

    const full = raw.murl;
    if (typeof full !== "string" || !full.startsWith("https://")) continue;
    if (seen.has(full)) continue;
    seen.add(full);

    const dims = /(\d{2,4})x(\d{2,4})/.exec(full);

    albums.push({
      id: full,
      title: raw.t ? decodeEntities(raw.t).trim() : "Album cover",
      source: hostOf(raw.purl ?? full),
      width: dims ? Number(dims[1]) : null,
      height: dims ? Number(dims[2]) : null,
      thumb: typeof raw.turl === "string" && raw.turl ? raw.turl : full,
      full,
    });
  }

  return albums;
}
