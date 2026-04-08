import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { resolveAmplifyImageUrlServer } from "@/lib/blog-storage.server";

// Always dynamically rendered — each request generates a fresh presigned URL
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");

  if (!path || path.length > 2048) {
    return new NextResponse("Missing or invalid path parameter", { status: 400 });
  }

  try {
    const { url, expiresAt } = await resolveAmplifyImageUrlServer(path);

    // Cache the redirect for slightly less than the presigned URL's remaining lifetime
    const remainingMs = expiresAt.getTime() - Date.now();
    const safeMaxAge = Math.max(60, Math.floor(remainingMs / 1000) - 60);

    return NextResponse.redirect(url, {
      status: 302,
      headers: {
        "Cache-Control": `public, max-age=${safeMaxAge}, s-maxage=${safeMaxAge}`,
      },
    });
  } catch {
    return new NextResponse("Image not found", { status: 404 });
  }
}
