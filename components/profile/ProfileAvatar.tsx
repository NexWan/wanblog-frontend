"use client";

import React, { useEffect, useState } from "react";
import { resolveAvatarUrl } from "@/lib/profile-storage";
import { cn } from "@/lib/utils";

type ProfileAvatarProps = {
  avatarPath?: string | null;
  displayName?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-[11px]",
  lg: "h-20 w-20 text-lg",
};

function getInitials(displayName: string | null | undefined): string {
  if (!displayName) return "WB";
  const parts = displayName
    .split(/[\s@._-]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "WB";
}

export default function ProfileAvatar({
  avatarPath,
  displayName,
  size = "md",
  className,
}: ProfileAvatarProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const url = avatarPath
        ? await resolveAvatarUrl(avatarPath).catch(() => null)
        : await Promise.resolve(null);
      if (!cancelled) setResolvedUrl(url);
    }

    resolve();

    return () => { cancelled = true; };
  }, [avatarPath]);

  const initials = getInitials(displayName);
  const label = displayName ? `${displayName} profile picture` : "User profile picture";

  if (resolvedUrl) {
    return (
      <div
        role="img"
        aria-label={label}
        className={cn(
          "shrink-0 rounded-full border border-white/10 bg-cover bg-center shadow-lg shadow-black/20",
          sizeClasses[size],
          className,
        )}
        style={{ backgroundImage: `url("${resolvedUrl}")` }}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/15 font-label uppercase leading-none tracking-[0.2em] text-primary shadow-lg shadow-black/20",
        sizeClasses[size],
        className,
      )}
    >
      <span className={cn("block text-center leading-none", initials.length === 1 ? "translate-x-px" : "pl-[0.12em]")}>
        {initials}
      </span>
    </div>
  );
}
