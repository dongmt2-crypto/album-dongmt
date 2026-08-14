import { Download } from "lucide-react";
import type { Album } from "@/lib/albums.shared";
import { downloadArtwork } from "@/lib/download";

type Props = {
  album: Album;
  onOpen: (album: Album) => void;
};

export function CoverCard({ album, onOpen }: Props) {
  return (
    <figure className="group animate-in fade-in duration-500">
      <button
        type="button"
        onClick={() => onOpen(album)}
        className="relative block w-full overflow-hidden rounded-sm bg-card ring-1 ring-border transition-transform duration-300 hover:-translate-y-1 hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`View ${album.title} by ${album.artist}`}
      >
        <img
          src={album.thumb}
          alt={`${album.title} album cover by ${album.artist}`}
          loading="lazy"
          width={300}
          height={300}
          className="aspect-square w-full object-cover"
        />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </button>

      <figcaption className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{album.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {album.artist}
            {album.year ? ` · ${album.year}` : ""}
            {album.trackCount ? ` · ${album.trackCount} tracks` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadArtwork(album, 3000)}
          title="Download 3000px cover"
          aria-label={`Download ${album.title} cover at 3000 pixels`}
          className="shrink-0 rounded-full p-2 text-muted-foreground opacity-0 transition-all hover:bg-primary/15 hover:text-primary focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Download className="size-4" aria-hidden />
        </button>
      </figcaption>
    </figure>
  );
}
