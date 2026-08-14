# Album Cover Art Finder

A single-page site to search album artwork by artist or album name, preview covers large, and download them in high resolution.

## Image source

Google's image search needs a paid API key and returns small thumbnails, so the search is powered by the free Apple/iTunes artwork API instead — no keys, no accounts, and official covers up to 3000x3000. Results are the same albums you would find searching Google, but at print-quality resolution.

## What gets built

Home page (`/`) with:
- A search bar with a toggle: search by Artist or by Album (default: everything matching).
- Results as a responsive cover grid: artwork, album title, artist, year, track count.
- Click a cover to open a detail dialog: large preview, metadata, and download buttons for 600px, 1200px, and 3000px (largest is the primary action).
- One-click download on hover of each grid tile (largest size).
- Loading skeletons, empty state ("no albums found"), and error state with retry.
- A few suggested searches as chips when the page first loads.

## Design direction

Dark, gallery-like layout that lets the artwork carry the page: near-black background, warm off-white type, one accent color, generous grid gutters, subtle hover lift and fade-in on covers. Not a purple-gradient SaaS page.

## Technical notes

- `src/lib/albums.functions.ts`: a `createServerFn` that calls `https://itunes.apple.com/search` (`entity=album`, plus `attribute=artistTerm|albumTerm` when a mode is chosen), dedupes collections, and rewrites the returned `artworkUrl100` into 600/1200/3000 variants.
- Client uses TanStack Query (`useQuery`) against that server fn; no keys, no database, so Cloud is not needed.
- Download goes through a small server route (`src/routes/api/public/artwork.ts`) that streams the image with `Content-Disposition: attachment`, so downloads save the file instead of opening a cross-origin image tab. Filename: `Artist - Album (3000x3000).jpg`. URL host is validated against Apple's artwork domains before fetching.
- Components split into `SearchBar`, `CoverGrid`, `CoverCard`, `CoverDialog` under `src/components/`.
- SEO: unique `head()` on `/` with album-art-specific title, description, og/twitter tags.
