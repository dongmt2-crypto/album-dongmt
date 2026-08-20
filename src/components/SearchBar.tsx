import { Search } from "lucide-react";
import type { SearchMode } from "@/lib/albums.shared";

const MODES: { value: SearchMode; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "artist", label: "Artist" },
  { value: "album", label: "Albums by artist" },
];

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  onSubmit: () => void;
};

export function SearchBar({ value, onValueChange, mode, onModeChange, onSubmit }: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="w-full"
    >
      <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 transition-colors focus-within:border-primary/70">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Search an artist or album…"
          aria-label="Search an artist or album"
          className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Search
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Match on</span>
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => onModeChange(m.value)}
            aria-pressed={mode === m.value}
            className={
              mode === m.value
                ? "rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/40"
                : "rounded-full px-3 py-1 text-xs text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground"
            }
          >
            {m.label}
          </button>
        ))}
      </div>
    </form>
  );
}
