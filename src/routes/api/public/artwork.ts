import { createFileRoute } from "@tanstack/react-router";

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
        // Only public https images; block private/loopback hosts.
        if (target.protocol !== "https:") {
          return new Response("Only https sources are allowed", { status: 403 });
        }
        if (/^(localhost$|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[)/i.test(target.hostname)) {
          return new Response("Host not allowed", { status: 403 });
        }

        const upstream = await fetch(target.toString(), {
          headers: { "User-Agent": "Mozilla/5.0", Accept: "image/*" },
        });
        const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
        if (!upstream.ok || !upstream.body || !contentType.startsWith("image/")) {
          return new Response("Artwork unavailable", { status: 502 });
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${sanitize(filename)}"`,
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
