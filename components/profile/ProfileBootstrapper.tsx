"use client";

import React, { startTransition, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { revalidateProfileCache } from "@/app/actions/revalidate";
import { createProfile } from "@/lib/profile-data";

type ProfileBootstrapperProps = {
  userId: string;
  username: string;
  displayName: string | null;
};

export default function ProfileBootstrapper({ userId, username, displayName }: ProfileBootstrapperProps) {
  const router = useRouter();
  const didStart = useRef(false);
  const isMounted = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isMounted.current = true;

    async function bootstrapProfile() {
      try {
        const profile = await createProfile({ userId, username, displayName });
        await revalidateProfileCache(profile.userId, profile.username).catch((err) =>
          console.warn("Profile cache revalidation failed (non-critical):", err),
        );

        if (!isMounted.current) return;

        startTransition(() => {
          router.refresh();
          router.replace(`/user/${username}`);
        });
      } catch (err) {
        if (!isMounted.current) return;
        console.error("createProfile failed", err);
        setError(err instanceof Error ? err.message : "Failed to create profile.");
      }
    }

    if (!didStart.current) {
      didStart.current = true;
      bootstrapProfile();
    }

    return () => { isMounted.current = false; };
  }, [userId, username, displayName, router]);

  if (error) {
    return (
      <main className="pt-32 pb-20 text-center text-on-surface">
        <p className="font-body text-sm text-error">{error}</p>
      </main>
    );
  }

  return (
    <main className="pt-32 pb-20 text-center text-on-surface">
      <p className="font-body text-sm text-on-surface-variant">Setting up your profile…</p>
    </main>
  );
}
