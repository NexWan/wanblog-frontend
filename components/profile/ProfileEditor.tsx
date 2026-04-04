"use client";

import React, { startTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "aws-amplify/auth";
import { updateProfile } from "@/lib/profile-data";
import { resolveAvatarUrl, uploadAvatar } from "@/lib/profile-storage";
import type { UserProfile } from "@/lib/profile-types";
import { cn } from "@/lib/utils";

type ProfileEditorProps = {
  initialProfile: UserProfile;
  currentUserId: string;
};

export default function ProfileEditor({ initialProfile, currentUserId }: ProfileEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(initialProfile.displayName ?? "");
  const [bio, setBio] = useState(initialProfile.bio ?? "");
  const [avatarPath, setAvatarPath] = useState(initialProfile.avatarPath ?? "");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setProfileError(null);

    try {
      const { path } = await uploadAvatar(file);
      setAvatarPath(path);
      const url = await resolveAvatarUrl(path);
      setAvatarPreviewUrl(url);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to upload avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      await updateProfile({
        userId: currentUserId,
        displayName: displayName.trim() || null,
        bio: bio.trim() || null,
        avatarPath: avatarPath || null,
      });
      setProfileSuccess("Profile saved.");
      startTransition(() => router.refresh());
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);

    try {
      await updatePassword({ oldPassword: currentPassword, newPassword });
      setPasswordSuccess("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-colors focus:border-primary/50";

  return (
    <div className="max-w-xl mx-auto px-6 pt-32 pb-20">
      <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-10">
        Edit Profile
      </h1>

      {/* Profile form */}
      <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div
            className={cn(
              "h-20 w-20 shrink-0 rounded-full border border-primary/30 bg-primary/10 bg-cover bg-center",
              isUploadingAvatar && "opacity-50",
            )}
            style={
              avatarPreviewUrl
                ? { backgroundImage: `url("${avatarPreviewUrl}")` }
                : initialProfile.avatarPath && !avatarPreviewUrl
                ? undefined
                : undefined
            }
          >
            {!avatarPreviewUrl && (
              <div className="flex h-full w-full items-center justify-center font-label text-lg uppercase tracking-widest text-primary">
                {(displayName || initialProfile.username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              disabled={isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="font-label text-xs uppercase tracking-widest text-primary hover:text-primary/80 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploadingAvatar ? "Uploading…" : "Change photo"}
            </button>
            <p className="mt-1 font-label text-[11px] text-on-surface-variant">
              JPG, PNG or WebP, max 5 MB
            </p>
          </div>
        </div>

        {/* Username (read-only) */}
        <div>
          <label className="mb-1.5 block font-label text-xs uppercase tracking-widest text-on-surface-variant">
            Username
          </label>
          <input
            type="text"
            value={initialProfile.username}
            readOnly
            className={cn(inputClass, "cursor-not-allowed opacity-60")}
          />
        </div>

        {/* Display name */}
        <div>
          <label className="mb-1.5 block font-label text-xs uppercase tracking-widest text-on-surface-variant">
            Display name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
            className={inputClass}
          />
        </div>

        {/* Bio */}
        <div>
          <label className="mb-1.5 block font-label text-xs uppercase tracking-widest text-on-surface-variant">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell readers a bit about yourself…"
            rows={4}
            className={cn(inputClass, "resize-none")}
          />
        </div>

        {profileError && (
          <p className="font-label text-xs text-error">{profileError}</p>
        )}
        {profileSuccess && (
          <p className="font-label text-xs text-primary">{profileSuccess}</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || isUploadingAvatar}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-6 py-2 font-label text-[11px] uppercase tracking-[0.24em] text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>

      {/* Password change */}
      <div className="mt-12 border-t border-outline-variant/15 pt-8">
        <button
          type="button"
          onClick={() => setShowPasswordSection((v) => !v)}
          className="font-label text-xs uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
        >
          {showPasswordSection ? "Hide password change" : "Change password"}
        </button>

        {showPasswordSection && (
          <form onSubmit={handleChangePassword} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block font-label text-xs uppercase tracking-widest text-on-surface-variant">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block font-label text-xs uppercase tracking-widest text-on-surface-variant">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block font-label text-xs uppercase tracking-widest text-on-surface-variant">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className={inputClass}
                required
              />
            </div>

            {passwordError && (
              <p className="font-label text-xs text-error">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="font-label text-xs text-primary">{passwordSuccess}</p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-primary/30 px-6 py-2 font-label text-[11px] uppercase tracking-[0.24em] text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isChangingPassword ? "Updating…" : "Update password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
