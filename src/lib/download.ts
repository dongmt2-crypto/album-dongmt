import type { Album } from "./albums.shared";

function safeTitle(album: Album) {
  const base = album.title.replace(/\s+/g, " ").trim() || "album-cover";
  return base.slice(0, 80);
}

export function artworkDownloadHref(album: Album) {
  const ext = /\.(png|webp|jpeg|jpg|gif)/i.exec(album.full)?.[1]?.toLowerCase() ?? "jpg";
  const filename = `${safeTitle(album)}.${ext === "jpeg" ? "jpg" : ext}`;
  return `/api/public/artwork?src=${encodeURIComponent(album.full)}&filename=${encodeURIComponent(filename)}`;
}

export function downloadArtwork(album: Album) {
  if (typeof document === "undefined") return;
  const link = document.createElement("a");
  link.href = artworkDownloadHref(album);
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
