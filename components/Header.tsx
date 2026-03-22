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
import ThemeToggle from "@/components/ThemeToggle";

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
  "inline-flex min-h-10 items-center justify-center rounded-full border border-outline-variant/40 px-4 py-2 font-label text-[11px] uppercase tracking-[0.24em] leading-none transition-all";
const mobileAuthActionClassName =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant/30 px-4 py-3 text-center font-label text-xs uppercase tracking-[0.24em] leading-none transition-all";
const trackedLabelClassName = "block pl-[0.16em] text-center leading-none";

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
  const avatarFallback = getAvatarFallback(displayName);

  if (avatarUrl) {
    return (
      <div
        role="img"
        aria-label={displayName ? `${displayName} profile` : "User profile"}
        className="h-10 w-10 shrink-0 rounded-full border border-white/10 bg-cover bg-center shadow-lg shadow-black/20"
        style={{ backgroundImage: `url("${avatarUrl}")` }}
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/15 font-label text-[11px] uppercase leading-none tracking-[0.2em] text-primary shadow-lg shadow-black/20">
      <span
        className={cn(
          "block text-center leading-none",
          avatarFallback.length === 1 ? "translate-x-px" : "pl-[0.12em]",
        )}
      >
        {avatarFallback}
      </span>
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
        <Link
          href="/"
          className="inline-flex min-h-10 items-center text-2xl font-black italic leading-none text-primary tracking-tight font-headline"
        >
          WanBlog
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-8 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={cn(
                "relative inline-flex min-h-10 items-center font-headline leading-none tracking-tight transition-colors hover:text-primary/80 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:transition-transform",
                pathname === link.path 
                  ? "text-primary font-bold after:scale-x-100 after:bg-primary" 
                  : "text-on-surface-variant after:scale-x-0 after:bg-primary"
              )}
            >
              {link.name}
            </Link>
          ))}
          <div className="ml-3 flex items-center gap-3">
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
                <span className={trackedLabelClassName}>
                  {isSigningOut ? "Logging out" : "Log out"}
                </span>
              </button>
            ) : (
              <Link
                href="/auth"
                className={cn(
                  authActionClassName,
                  "border-white/10 text-on-surface hover:bg-white/5",
                )}
              >
                <span className={trackedLabelClassName}>Log in</span>
              </Link>
            )}
          </div>
          <ThemeToggle className="ml-2" />
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex min-h-10 items-center p-2 font-label text-xs uppercase leading-none tracking-widest text-on-surface"
          >
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
                "inline-flex min-h-10 items-center font-headline text-lg leading-none tracking-tight",
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
                <span className={trackedLabelClassName}>
                  {isSigningOut ? "Logging out" : "Log out"}
                </span>
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
                <span className={trackedLabelClassName}>Log in</span>
              </Link>
            )}
          </div>
          <ThemeToggle compact />
        </div>
      )}
    </nav>
  );
}
