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
  if (mode === "artist") return `${value} artist photo album covers`;
  // "Albums by artist": ask for the artist's full discography of cover art.
  if (mode === "album") return `${value} discography all album covers art`;
  return `${value} album cover`;
}

/** HTML image-search results page (no API key, no account). */
export function buildImageSearchUrl(query: string, mode: SearchMode) {
  const params = new URLSearchParams({
    q: buildQuery(query, mode),
    form: "HDRSC2",
    first: "1",
    count: "60",
    // Pin locale and strict safe-search: server egress has no user context,
    // which otherwise yields off-topic and unsafe results.
    mkt: "en-US",
    cc: "US",
    setlang: "en",
    safeSearch: "Strict",
    adlt: "strict",
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

/** Query tokens used to keep only results that actually match the search. */
function tokensOf(query: string) {
  return query
    .toLocaleLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((t) => t.length >= 3);
}

function isRelevant(album: Album, tokens: string[]) {
  if (tokens.length === 0) return true;
  const haystack = `${album.title} ${album.source} ${album.full}`.toLocaleLowerCase();
  return tokens.some((t) => haystack.includes(t));
}

/** Pull the embedded JSON metadata blocks out of the search results HTML. */
export function parseImageResults(html: string, query = ""): Album[] {
  const tokens = tokensOf(query);
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

    const album: Album = {
      id: full,
      title: raw.t ? decodeEntities(raw.t).trim() : "Album cover",
      source: hostOf(raw.purl ?? full),
      width: dims ? Number(dims[1]) : null,
      height: dims ? Number(dims[2]) : null,
      thumb: typeof raw.turl === "string" && raw.turl ? raw.turl : full,
      full,
    };

    if (!isRelevant(album, tokens)) continue;
    albums.push(album);
  }

  return albums;
}
