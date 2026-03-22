"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import { usePathname, useRouter } from "next/navigation";

type AuthState = {
  isAuthenticated: boolean;
  username: string | null;
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/admin/blogs", label: "Admin" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    username: null,
  });

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const user = await getCurrentUser();

        if (!isMounted) {
          return;
        }

        setAuthState({
          isAuthenticated: true,
          username: user.signInDetails?.loginId ?? user.username,
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setAuthState({
          isAuthenticated: false,
          username: null,
        });
      }
    };

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    setAuthState({
      isAuthenticated: false,
      username: null,
    });
    router.push("/");
    router.refresh();
  };

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-semibold text-zinc-900">
            WanBlog
          </Link>

          <nav className="hidden items-center gap-5 text-sm text-zinc-600 sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? "text-zinc-900" : "hover:text-zinc-900"}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {authState.isAuthenticated ? (
            <>
              <span className="hidden text-sm text-zinc-500 sm:inline">
                {authState.username}
              </span>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
