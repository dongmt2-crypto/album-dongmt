import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Disc3 } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { CoverGrid, CoverGridSkeleton } from "@/components/CoverGrid";
import { CoverDialog } from "@/components/CoverDialog";
import { searchAlbums } from "@/lib/albums.functions";
import type { Album, SearchMode } from "@/lib/albums.shared";

const TITLE = "DONGMT — Search & Download Album Cover Art";
const DESCRIPTION =
  "Search album artwork by artist or album name across the web and download full-size covers, free and without an account.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SUGGESTIONS = ["Radiohead", "Kind of Blue", "Frank Ocean", "Daft Punk", "Rumours"];

function Index() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<SearchMode>("all");
  const [submitted, setSubmitted] = useState("");
  const [selected, setSelected] = useState<Album | null>(null);
  const search = useServerFn(searchAlbums);

  const query = useQuery({
    queryKey: ["albums", submitted, mode],
    queryFn: () => search({ data: { query: submitted, mode } }),
    enabled: submitted.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => 600 * (attempt + 1),
  });

  const run = (term: string) => {
    setInput(term);
    setSubmitted(term.trim());
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <header className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] text-primary">
            <Disc3 className="size-4" aria-hidden />
            DONGMT
          </div>
          <h1 className="mt-5 font-serif text-4xl leading-[1.1] text-foreground sm:text-6xl">
            Album cover arts
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Search by artist or album, and download it.
          </p>
        </header>

        <div className="mx-auto mt-10 max-w-2xl">
          <SearchBar
            value={input}
            onValueChange={setInput}
            mode={mode}
            onModeChange={setMode}
            onSubmit={() => setSubmitted(input.trim())}
          />
        </div>

        <section className="mt-14" aria-live="polite">
          {!submitted && (
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Try one of these
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => run(s)}
                    className="rounded-full px-4 py-2 text-sm text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground hover:ring-primary/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {submitted && query.isPending && <CoverGridSkeleton />}

          {submitted && query.isError && (
            <div className="mx-auto max-w-md text-center">
              <h2 className="font-serif text-2xl text-foreground">Search failed</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The image search didn't respond. Give it another try.
              </p>
              <button
                type="button"
                onClick={() => query.refetch()}
                className="mt-5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Retry
              </button>
            </div>
          )}

          {submitted && query.isSuccess && query.data.length === 0 && (
            <div className="mx-auto max-w-md text-center">
              <h2 className="font-serif text-2xl text-foreground">No covers found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Nothing matched “{submitted}”. Try a different spelling or switch the match mode.
              </p>
            </div>
          )}

          {submitted && query.isSuccess && query.data.length > 0 && (
            <>
              <p className="mb-8 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {query.data.length} covers for “{submitted}”
              </p>
              <CoverGrid albums={query.data} onOpen={setSelected} />
            </>
          )}
        </section>
      </div>

      <CoverDialog album={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
