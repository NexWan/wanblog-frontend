import { timingSafeEqual } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

type RevalidatePayload =
  | { type: "blog"; slug: string; authorUserId?: string }
  | { type: "profile"; userId: string; username: string };

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  const expectedSecret = process.env.REVALIDATION_SECRET;

  if (!expectedSecret) {
    return NextResponse.json({ error: "Revalidation secret not configured" }, { status: 500 });
  }

  const secretBuf = Buffer.from(secret ?? "");
  const expectedBuf = Buffer.from(expectedSecret);
  const isValid =
    secretBuf.length === expectedBuf.length && timingSafeEqual(secretBuf, expectedBuf);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  let payload: RevalidatePayload;
  try {
    payload = (await req.json()) as RevalidatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (payload.type === "blog") {
    const { slug } = payload;
    revalidateTag("published-blogs", {});
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    return NextResponse.json({ revalidated: true, type: "blog", slug });
  }

  if (payload.type === "profile") {
    const { userId, username } = payload;
    revalidateTag(`profile-${userId}`, {});
    revalidateTag(`profile-username-${username}`, {});
    revalidateTag("avatars", {});
    revalidatePath(`/user/${username}`);
    return NextResponse.json({ revalidated: true, type: "profile", userId, username });
  }

  return NextResponse.json({ error: "Unknown payload type" }, { status: 400 });
}
