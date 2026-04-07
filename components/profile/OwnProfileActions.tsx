"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import ProfileBootstrapper from "@/components/profile/ProfileBootstrapper";

type OwnProfileActionsProps = {
  username: string;
  /** null when the profile doesn't exist yet */
  profileUserId: string | null;
};

type BootstrapState = {
  userId: string;
  displayName: string | null;
};

export default function OwnProfileActions({ username, profileUserId }: OwnProfileActionsProps) {
  const [isOwn, setIsOwn] = useState(false);
  const [bootstrap, setBootstrap] = useState<BootstrapState | null>(null);

  useEffect(() => {
    let active = true;

    async function check() {
      const [userResult, attrsResult] = await Promise.allSettled([
        getCurrentUser(),
        fetchUserAttributes(),
      ]);

      if (!active || userResult.status !== "fulfilled") return;

      const userId = userResult.value.userId;
      const attrs = attrsResult.status === "fulfilled" ? attrsResult.value : null;
      const preferredUsername = attrs?.preferred_username ?? null;

      if (profileUserId !== null) {
        // Profile exists — show "Edit profile" if it belongs to the current user
        if (userId === profileUserId) setIsOwn(true);
      } else {
        // Profile doesn't exist — offer to bootstrap if this is the current user's username
        if (preferredUsername === username) {
          const displayName = attrs?.given_name ?? preferredUsername ?? null;
          setBootstrap({ userId, displayName });
        }
      }
    }

    check().catch(() => {});
    return () => { active = false; };
  }, [username, profileUserId]);

  // Bootstrap: overlay the "Profile not found" page with the bootstrapper UI
  if (bootstrap) {
    return (
      <div className="fixed inset-0 z-50 bg-base-100 flex items-center justify-center">
        <ProfileBootstrapper
          userId={bootstrap.userId}
          username={username}
          displayName={bootstrap.displayName}
        />
      </div>
    );
  }

  if (!isOwn) return null;

  return (
    <Link
      href={`/user/${username}/edit`}
      className="inline-flex min-h-9 items-center justify-center rounded-full border border-outline-variant/40 px-5 py-2 font-label text-[11px] uppercase tracking-[0.24em] text-on-surface-variant hover:text-on-surface transition-colors"
    >
      Edit profile
    </Link>
  );
}
