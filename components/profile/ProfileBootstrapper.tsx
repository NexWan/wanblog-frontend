"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProfile } from "@/lib/profile-data";

type ProfileBootstrapperProps = {
  userId: string;
  username: string;
  displayName: string | null;
};

export default function ProfileBootstrapper({ userId, username, displayName }: ProfileBootstrapperProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createProfile({ userId, username, displayName })
      .then(() => router.push(`/user/${username}`))
      .catch((err) => {
        console.error("createProfile failed", err);
        setError(err instanceof Error ? err.message : "Failed to create profile.");
      });
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
