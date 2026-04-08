"use client";

import React, { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchAuthSession, fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import { createComment, deleteComment } from "@/lib/comment-data";
import type { Comment } from "@/lib/comment-types";
import { getProfileByUserIdPublic } from "@/lib/profile-data";
import type { UserProfile } from "@/lib/profile-types";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { cn } from "@/lib/utils";

type CommentSectionProps = {
  blogId: string;
  initialComments: Comment[];
  /** Server-resolved avatar URLs keyed by authorUserId. Skips client-side resolution for initial comments. */
  initialAvatarUrls?: Record<string, string | null>;
};

type AuthState = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userId: string | null;
  displayName: string | null;
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateStr));
}

export default function CommentSection({ blogId, initialComments, initialAvatarUrls }: CommentSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [profileMap, setProfileMap] = useState<Record<string, UserProfile>>({});
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isAdmin: false,
    userId: null,
    displayName: null,
  });
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch profiles for all unique comment authors
  useEffect(() => {
    const uniqueUserIds = [...new Set(initialComments.map((c) => c.authorUserId))];
    if (uniqueUserIds.length === 0) return;

    Promise.allSettled(uniqueUserIds.map((id) => getProfileByUserIdPublic(id))).then((results) => {
      const map: Record<string, UserProfile> = {};
      results.forEach((result, i) => {
        if (result.status === "fulfilled" && result.value) {
          map[uniqueUserIds[i]] = result.value;
        }
      });
      setProfileMap(map);
    });
  }, [initialComments]);

  useEffect(() => {
    let active = true;

    async function loadAuth() {
      const [sessionResult, userResult, attributesResult] = await Promise.allSettled([
        fetchAuthSession(),
        getCurrentUser(),
        fetchUserAttributes(),
      ]);

      if (!active) return;

      const groups =
        sessionResult.status === "fulfilled"
          ? sessionResult.value.tokens?.accessToken?.payload?.["cognito:groups"]
          : undefined;
      const isAdmin = Array.isArray(groups) && groups.includes("admin");

      if (userResult.status !== "fulfilled") {
        setAuthState({ isAuthenticated: false, isAdmin, userId: null, displayName: null });
        return;
      }

      const attributes = attributesResult.status === "fulfilled" ? attributesResult.value : null;
      const displayName = attributes?.preferred_username ?? userResult.value.username ?? null;
      const userId = userResult.value.userId;

      // Also fetch the current user's profile so new comments show their avatar
      const ownProfile = await getProfileByUserIdPublic(userId).catch(() => null);
      if (active && ownProfile) {
        setProfileMap((prev) => ({ ...prev, [userId]: ownProfile }));
      }

      if (active) {
        setAuthState({ isAuthenticated: true, isAdmin, userId, displayName });
      }
    }

    loadAuth().catch(console.error);

    return () => { active = false; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !authState.userId || !authState.displayName) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const newComment = await createComment({
        blogId,
        authorName: authState.displayName,
        authorUserId: authState.userId,
        content: commentText.trim(),
      });
      setComments((prev) => [newComment, ...prev]);
      setCommentText("");
      startTransition(() => router.refresh());
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to post comment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      startTransition(() => router.refresh());
    } catch (err) {
      console.error("deleteComment failed", err);
    } finally {
      setDeletingId(null);
    }
  }

  const canDelete = (comment: Comment) =>
    authState.isAdmin || comment.authorUserId === authState.userId;

  return (
    <div className="border-t border-outline-variant/15 pt-12">
      <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface mb-8">
        Comments
        {comments.length > 0 && (
          <span className="ml-2 font-label text-base font-normal text-on-surface-variant">
            ({comments.length})
          </span>
        )}
      </h2>

      {/* Comment form */}
      {authState.isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-10">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className={cn(
              "w-full rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-colors focus:border-primary/50 resize-none",
            )}
          />
          {submitError && (
            <p className="mt-2 font-label text-xs text-error">{submitError}</p>
          )}
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              className="inline-flex min-h-9 items-center justify-center rounded-full bg-primary px-5 py-2 font-label text-[11px] uppercase tracking-[0.24em] text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Posting…" : "Post comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-10 rounded-xl border border-outline-variant/20 bg-surface-container px-5 py-4">
          <p className="font-body text-sm text-on-surface-variant">
            <Link href="/auth" className="text-primary underline underline-offset-2 hover:text-primary/80">
              Log in
            </Link>{" "}
            to leave a comment.
          </p>
        </div>
      )}

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="font-body text-sm text-on-surface-variant">No comments yet. Be the first!</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {comments.map((comment) => {
            const authorProfile = profileMap[comment.authorUserId];
            return (
              <li key={comment.id} className="flex gap-4">
                <ProfileAvatar
                  avatarPath={authorProfile?.avatarPath}
                  resolvedUrl={initialAvatarUrls?.[comment.authorUserId]}
                  displayName={authorProfile?.displayName ?? comment.authorName}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="font-label text-xs font-bold uppercase tracking-widest text-on-surface">
                      {comment.authorName}
                    </span>
                    <span className="font-label text-xs text-on-surface-variant">
                      {formatDate(comment.createdAt)}
                    </span>
                    {canDelete(comment) && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className="ml-auto font-label text-xs text-error/60 hover:text-error transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === comment.id ? "Deleting…" : "Delete"}
                      </button>
                    )}
                  </div>
                  <p className="mt-1 font-body text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
