export const VENICE_BASE_URL = "https://api.venice.ai/api/v1";

export type VeniceKind = "image" | "video";

export async function requireStudioAuth() {
  const { isAuthenticated } = await import("./auth");
  if (!(await isAuthenticated())) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  return null;
}

export function apiKey() {
  const key = process.env.VENICE_API_KEY;
  if (!key) {
    throw new Error("VENICE_API_KEY no esta configurada");
  }
  return key;
}

export async function veniceFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey()}`);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");

  return fetch(`${VENICE_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });
}

export function dataUrlFromBuffer(buffer: ArrayBuffer, contentType: string) {
  return `data:${contentType};base64,${Buffer.from(buffer).toString("base64")}`;
}
