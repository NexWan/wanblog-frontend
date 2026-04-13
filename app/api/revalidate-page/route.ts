import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const returnTo = req.nextUrl.searchParams.get("return_to") ?? "/";

  // Prevent open-redirect: must be a relative path
  const safeReturnTo =
    returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";

  const isAdmin = await isCurrentUserAdmin();

  if (isAdmin) {
    revalidateTag("published-blogs", {});
    revalidatePath("/", "layout"); // revalidates entire app tree
  }

  return NextResponse.redirect(new URL(safeReturnTo, req.url));
}
