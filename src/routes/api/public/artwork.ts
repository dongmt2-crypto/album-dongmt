import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_HOSTS = /(^|\.)mzstatic\.com$/i;

function sanitize(name: string) {
  return name.replace(/[^a-z0-9\-_() .]/gi, "_").slice(0, 120);
}

export const Route = createFileRoute("/api/public/artwork")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const src = url.searchParams.get("src");
        const filename = url.searchParams.get("filename") ?? "album-cover.jpg";

        if (!src) return new Response("Missing src", { status: 400 });

        let target: URL;
        try {
          target = new URL(src);
        } catch {
          return new Response("Invalid src", { status: 400 });
        }
        if (target.protocol !== "https:" || !ALLOWED_HOSTS.test(target.hostname)) {
          return new Response("Host not allowed", { status: 403 });
        }

        const upstream = await fetch(target.toString());
        if (!upstream.ok || !upstream.body) {
          return new Response("Artwork unavailable", { status: 502 });
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
            "Content-Disposition": `attachment; filename="${sanitize(filename)}"`,
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
