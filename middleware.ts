import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  if (url.searchParams.get("revalidate") === "1") {
    url.searchParams.delete("revalidate");

    // Heuristic: only bounce through the auth-check API route if the user has
    // Cognito session cookies. Unauthenticated traffic just gets the param
    // stripped and sees the page normally, avoiding an unnecessary Cognito call.
    //
    // Note: a logged-in admin clicking a malicious link could still trigger
    // revalidation (CSRF). The consequence is only a cache clear — no data is
    // modified — so this is an accepted low-severity trade-off for browser UX.
    const hasAuthCookie = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("CognitoIdentityServiceProvider."));

    if (!hasAuthCookie) {
      return NextResponse.redirect(url);
    }

    const returnTo = url.pathname + url.search; // preserve other query params
    const dest = new URL("/api/revalidate-page", request.url);
    dest.searchParams.set("return_to", returnTo);
    return NextResponse.redirect(dest);
  }
  return NextResponse.next();
}

export const config = {
  // Use `$` to anchor extension matching so slugs with dots (e.g. /blog/v1.5-notes)
  // are not accidentally excluded — only paths ending in a static file extension are.
  matcher: [
    "/((?!_next/|api/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|js|css|woff2?)$).*)",
  ],
};
