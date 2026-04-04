"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "aws-amplify/auth";
import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { createLike, deleteLike, getUserLikeForBlog } from "@/lib/like-data";
import { cn } from "@/lib/utils";

type LikeButtonProps = {
  blogId: string;
  initialLikeCount: number;
};

export default function LikeButton({ blogId, initialLikeCount }: LikeButtonProps) {
  const router = useRouter();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const [userResult] = await Promise.allSettled([
        getCurrentUser(),
      ]);

      if (!active) return;

      if (userResult.status !== "fulfilled") return;

      const userId = userResult.value.userId;
      setCurrentUserId(userId);

      const like = await getUserLikeForBlog(blogId, userId).catch(() => null);
      if (active && like) setHasLiked(true);
    }

    hydrate().catch(console.error);

    return () => { active = false; };
  }, [blogId]);

  async function handleToggle() {
    if (!currentUserId) {
      router.push("/auth");
      return;
    }

    setIsLoading(true);

    try {
      if (hasLiked) {
        await deleteLike(blogId, currentUserId);
        setHasLiked(false);
        setLikeCount((n) => Math.max(0, n - 1));
      } else {
        await createLike(blogId, currentUserId);
        setHasLiked(true);
        setLikeCount((n) => n + 1);
      }
      router.refresh();
    } catch (err) {
      console.error("like toggle failed", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={hasLiked ? "Unlike this post" : "Like this post"}
      className={cn(
        "inline-flex items-center gap-1.5 font-label text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        hasLiked
          ? "text-primary"
          : "text-on-surface-variant hover:text-primary",
      )}
    >
      {hasLiked ? (
        <HeartFilled className="text-base" />
      ) : (
        <HeartOutlined className="text-base" />
      )}
      <span>{likeCount}</span>
    </button>
  );
}
