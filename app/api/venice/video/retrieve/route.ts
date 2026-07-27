import { dataUrlFromBuffer, requireStudioAuth, veniceFetch } from "@/lib/venice";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireStudioAuth();
  if (auth) return auth;

  const body = await request.json();
  const response = await veniceFetch("/video/retrieve", {
    method: "POST",
    body: JSON.stringify({
      model: body.model,
      queue_id: body.queue_id,
      delete_media_on_completion: false
    })
  });

  const contentType = response.headers.get("Content-Type") || "";

  if (contentType.includes("video/mp4")) {
    const buffer = await response.arrayBuffer();
    return Response.json({
      status: "COMPLETED",
      video: dataUrlFromBuffer(buffer, "video/mp4")
    });
  }

  const data = await response.json().catch(() => ({}));
  if (data.status === "COMPLETED" && body.download_url) {
    return Response.json({
      status: "COMPLETED",
      video: body.download_url
    });
  }

  return Response.json(data, { status: response.status });
}
