import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Album } from "@/lib/albums.shared";
import { downloadArtwork, type ArtworkSize } from "@/lib/download";

const SIZES: ArtworkSize[] = [600, 1200, 1800];

type Props = {
  album: Album | null;
  onClose: () => void;
};

export function CoverDialog({ album, onClose }: Props) {
  return (
    <Dialog open={album !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl border-border bg-card">
        {album && (
          <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_16rem]">
            <img
              src={album.large}
              alt={`${album.title} album cover by ${album.artist}`}
              className="aspect-square w-full rounded-sm object-cover ring-1 ring-border"
            />
            <div className="flex flex-col">
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="font-serif text-2xl leading-tight">
                  {album.title}
                </DialogTitle>
                <DialogDescription>{album.artist}</DialogDescription>
              </DialogHeader>

              <dl className="mt-4 space-y-1 text-xs text-muted-foreground">
                {album.year && (
                  <div className="flex justify-between gap-4">
                    <dt>Released</dt>
                    <dd className="text-foreground">{album.year}</dd>
                  </div>
                )}
                {album.genre && (
                  <div className="flex justify-between gap-4">
                    <dt>Genre</dt>
                    <dd className="text-foreground">{album.genre}</dd>
                  </div>
                )}
                {album.trackCount && (
                  <div className="flex justify-between gap-4">
                    <dt>Tracks</dt>
                    <dd className="text-foreground">{album.trackCount}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 space-y-2">
                {SIZES.slice()
                  .reverse()
                  .map((size, i) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => downloadArtwork(album, size)}
                      className={
                        i === 0
                          ? "flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                          : "flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground"
                      }
                    >
                      <Download className="size-4" aria-hidden />
                      Download {size}×{size}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
