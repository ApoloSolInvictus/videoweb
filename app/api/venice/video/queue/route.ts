import { requireStudioAuth, veniceFetch } from "@/lib/venice";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireStudioAuth();
  if (auth) return auth;

  const body = await request.json();
  const response = await veniceFetch("/video/queue", {
    method: "POST",
    body: JSON.stringify(body)
  });

  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" }
  });
}
