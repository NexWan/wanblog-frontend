"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  signOut,
} from "aws-amplify/auth";
import { cn } from "@/lib/utils";

type HeaderAuthState = {
  avatarUrl: string | null;
  displayName: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
};

const DEFAULT_AUTH_STATE: HeaderAuthState = {
  avatarUrl: null,
  displayName: null,
  isAdmin: false,
  isAuthenticated: false,
};

const authActionClassName =
  "rounded-full border border-outline-variant/40 px-4 py-2 font-label text-[11px] uppercase tracking-[0.24em] transition-all";
const mobileAuthActionClassName =
  "rounded-full border border-outline-variant/30 px-4 py-3 text-center font-label text-xs uppercase tracking-[0.24em] transition-all";

function getDisplayName(
  user: Awaited<ReturnType<typeof getCurrentUser>> | null,
  attributes: Awaited<ReturnType<typeof fetchUserAttributes>> | null,
) {
  return (
    attributes?.preferred_username ??
    attributes?.name ??
    user?.signInDetails?.loginId ??
    user?.username ??
    null
  );
}

function getAvatarUrl(attributes: Awaited<ReturnType<typeof fetchUserAttributes>> | null) {
  return attributes?.picture ?? attributes?.profile ?? null;
}

function getAvatarFallback(displayName: string | null) {
  if (!displayName) {
    return "WB";
  }

  const parts = displayName
    .split(/[\s@._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "WB";
}

function Avatar({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null;
  displayName: string | null;
}) {
  if (avatarUrl) {
    return (
      <div
        role="img"
        aria-label={displayName ? `${displayName} profile` : "User profile"}
        className="h-10 w-10 rounded-full border border-white/10 bg-cover bg-center shadow-lg shadow-black/20"
        style={{ backgroundImage: `url("${avatarUrl}")` }}
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/15 font-label text-[11px] uppercase tracking-[0.2em] text-primary shadow-lg shadow-black/20">
      {getAvatarFallback(displayName)}
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authState, setAuthState] = useState<HeaderAuthState>(DEFAULT_AUTH_STATE);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadAuthState() {
      const [sessionResult, userResult, attributesResult] = await Promise.allSettled([
        fetchAuthSession(),
        getCurrentUser(),
        fetchUserAttributes(),
      ]);

      if (!isActive) {
        return;
      }

      const groups =
        sessionResult.status === "fulfilled"
          ? sessionResult.value.tokens?.accessToken?.payload?.["cognito:groups"]
          : undefined;
      const isAdmin = Array.isArray(groups) && groups.includes("admin");

      if (userResult.status !== "fulfilled") {
        setAuthState({
          ...DEFAULT_AUTH_STATE,
          isAdmin,
        });
        return;
      }

      const attributes = attributesResult.status === "fulfilled" ? attributesResult.value : null;
      const displayName = getDisplayName(userResult.value, attributes);

      setAuthState({
        avatarUrl: getAvatarUrl(attributes),
        displayName,
        isAdmin,
        isAuthenticated: true,
      });
    }

    loadAuthState().catch((error) => {
      console.error("loadAuthState failed", error);

      if (isActive) {
        setAuthState(DEFAULT_AUTH_STATE);
      }
    });

    return () => {
      isActive = false;
    };
  }, [pathname]);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOut();
      setAuthState(DEFAULT_AUTH_STATE);
      setIsMenuOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("signOut failed", error);
    } finally {
      setIsSigningOut(false);
    }
  }

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
  ];
  if (authState.isAdmin) {
    navLinks.push({ name: "Admin", path: "/admin/blogs" });
  }

  return (
    <nav className="fixed top-0 w-full z-50 glass-nav shadow-2xl shadow-black/20">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-2xl font-black text-primary italic font-headline tracking-tight">
          WanBlog
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-8 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={cn(
                "font-headline tracking-tight transition-colors hover:text-primary/80",
                pathname === link.path 
                  ? "text-primary font-bold border-b-2 border-primary pb-1" 
                  : "text-on-surface-variant"
              )}
            >
              {link.name}
            </Link>
          ))}
          <div className="ml-4 flex items-center gap-3">
            <Avatar avatarUrl={authState.avatarUrl} displayName={authState.displayName} />
            {authState.isAuthenticated ? (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className={cn(
                  authActionClassName,
                  "border-primary/30 text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {isSigningOut ? "Logging out" : "Log out"}
              </button>
            ) : (
              <Link
                href="/auth"
                className={cn(
                  authActionClassName,
                  "border-white/10 text-on-surface hover:bg-white/5",
                )}
              >
                Log in
              </Link>
            )}
          </div>
          <button className="ml-4 p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer">
            <span className="text-primary text-xs uppercase tracking-widest font-label">Light/Dark</span>
          </button>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-on-surface font-label text-xs uppercase tracking-widest">
            {isMenuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-surface-container border-t border-outline-variant/10 p-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "font-headline text-lg tracking-tight",
                pathname === link.path ? "text-primary font-bold" : "text-on-surface-variant"
              )}
            >
              {link.name}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-3 border-t border-outline-variant/10 pt-4">
            <Avatar avatarUrl={authState.avatarUrl} displayName={authState.displayName} />
            {authState.isAuthenticated ? (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className={cn(
                  mobileAuthActionClassName,
                  "flex-1 border-primary/30 text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {isSigningOut ? "Logging out" : "Log out"}
              </button>
            ) : (
              <Link
                href="/auth"
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  mobileAuthActionClassName,
                  "flex-1 border-white/10 text-on-surface hover:bg-white/5",
                )}
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
