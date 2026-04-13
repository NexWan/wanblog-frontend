import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  if (url.searchParams.get("revalidate") === "1") {
    url.searchParams.delete("revalidate");
    const returnTo = url.pathname + url.search; // preserve other query params

    const dest = new URL("/api/revalidate-page", request.url);
    dest.searchParams.set("return_to", returnTo);
    return NextResponse.redirect(dest);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon\\.ico|.*\\.).*)"],
};
