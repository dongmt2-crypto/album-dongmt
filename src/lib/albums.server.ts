let cached: { token: string; expiresAt: number } | null = null;

/** Client-credentials token for the Spotify Web API, cached until shortly before expiry. */
export async function getSpotifyToken(): Promise<string> {
  const id = process.env["SPOTIFY_CLIENT_ID"];
  const secret = process.env["SPOTIFY_CLIENT_SECRET"];
  if (!id || !secret) {
    throw new Error("Spotify credentials are not configured");
  }

  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
  });

  if (!res.ok) {
    throw new Error(`Spotify auth failed (status ${res.status})`);
  }

  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("Spotify auth returned no token");

  cached = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return cached.token;
}

export function clearSpotifyToken() {
  cached = null;
}
