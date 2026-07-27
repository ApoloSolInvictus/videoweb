import { imagePresets, videoPresets } from "@/lib/models";
import { VENICE_BASE_URL, requireStudioAuth } from "@/lib/venice";

export async function GET() {
  const auth = await requireStudioAuth();
  if (auth) return auth;

  const [images, videos] = await Promise.all([
    fetch(`${VENICE_BASE_URL}/models?type=image`, { cache: "no-store" }).then((r) => r.json()),
    fetch(`${VENICE_BASE_URL}/models?type=video`, { cache: "no-store" }).then((r) => r.json())
  ]);

  return Response.json({
    recommended: {
      images: imagePresets,
      videos: videoPresets
    },
    live: {
      images: images.data || [],
      videos: videos.data || []
    }
  });
}
