import type { Album } from "./albums.shared";

const SIZE_KEY = { 600: "medium", 1200: "large", 1800: "max" } as const;

export type ArtworkSize = keyof typeof SIZE_KEY;

export function artworkDownloadHref(album: Album, size: ArtworkSize) {
  const src = album[SIZE_KEY[size]];
  const filename = `${album.artist} - ${album.title} (${size}x${size}).jpg`;
  return `/api/public/artwork?src=${encodeURIComponent(src)}&filename=${encodeURIComponent(filename)}`;
}

export function downloadArtwork(album: Album, size: ArtworkSize) {
  if (typeof document === "undefined") return;
  const link = document.createElement("a");
  link.href = artworkDownloadHref(album, size);
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
