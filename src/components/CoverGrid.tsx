import type { Album } from "@/lib/albums.shared";
import { CoverCard } from "./CoverCard";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  albums: Album[];
  onOpen: (album: Album) => void;
};

export function CoverGrid({ albums, onOpen }: Props) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {albums.map((album) => (
        <CoverCard key={album.id} album={album} onOpen={onOpen} />
      ))}
    </div>
  );
}

export function CoverGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-square w-full rounded-sm" />
          <Skeleton className="mt-3 h-3.5 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
