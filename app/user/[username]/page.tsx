import Link from "next/link";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import ProfileBootstrapper from "@/components/profile/ProfileBootstrapper";
import { getProfileByUsername } from "@/lib/profile-data.server";
import { getCurrentUserSub } from "@/lib/auth";
import { runWithAmplifyServerContext } from "@/lib/amplifyServerUtils";
import { fetchUserAttributes } from "aws-amplify/auth/server";
import { cookies } from "next/headers";

type UserProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = await params;
  const [profile, currentSub] = await Promise.all([
    getProfileByUsername(username),
    getCurrentUserSub(),
  ]);

  const isOwn = Boolean(currentSub && profile && currentSub === profile.userId);

  if (!profile) {
    // If the logged-in user's username matches the slug, bootstrap their profile
    if (currentSub) {
      let preferredUsername: string | null = null;
      let displayName: string | null = null;

      try {
        const attributes = await runWithAmplifyServerContext({
          nextServerContext: { cookies },
          operation: (ctx) => fetchUserAttributes(ctx),
        });
        preferredUsername = attributes.preferred_username ?? null;
        displayName = attributes.given_name ?? attributes.preferred_username ?? null;
      } catch {
        // not authenticated or attributes unavailable
      }

      if (preferredUsername === username) {
        return (
          <ProfileBootstrapper
            userId={currentSub}
            username={username}
            displayName={displayName}
          />
        );
      }
    }

    return (
      <main className="pt-32 pb-20 text-center text-on-surface">
        <h1 className="text-4xl font-headline font-bold mb-4">Profile not found</h1>
        <p className="text-on-surface-variant font-body">
          No profile exists for <span className="text-primary">@{username}</span>.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 pt-32 pb-20">
      <div className="flex flex-col items-center gap-5 text-center">
        <ProfileAvatar
          avatarPath={profile.avatarPath}
          displayName={profile.displayName ?? profile.username}
          size="lg"
        />

        <div>
          {profile.displayName && (
            <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
              {profile.displayName}
            </h1>
          )}
          <p className="font-label text-sm text-on-surface-variant mt-1">@{profile.username}</p>
        </div>

        {profile.bio && (
          <p className="font-body text-sm text-on-surface leading-relaxed max-w-md whitespace-pre-wrap">
            {profile.bio}
          </p>
        )}

        {isOwn && (
          <Link
            href={`/user/${username}/edit`}
            className="inline-flex min-h-9 items-center justify-center rounded-full border border-outline-variant/40 px-5 py-2 font-label text-[11px] uppercase tracking-[0.24em] text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Edit profile
          </Link>
        )}
      </div>
    </main>
  );
}
