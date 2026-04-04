import Link from "next/link";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import ProfileBootstrapper from "@/components/profile/ProfileBootstrapper";
import PostCard from "@/components/PostCard";
import { getProfileByUsername } from "@/lib/profile-data.server";
import { listPublishedBlogsByAuthor } from "@/lib/blog-data.server";
import { resolveCoverImageUrlServer } from "@/lib/blog-storage.server";
import { resolveAvatarUrlServer } from "@/lib/profile-storage.server";
import { getCurrentUserSub } from "@/lib/auth";
import { runWithAmplifyServerContext } from "@/lib/amplifyServerUtils";
import { fetchUserAttributes } from "aws-amplify/auth/server";
import { cookies } from "next/headers";
import {
  XOutlined,
  InstagramOutlined,
  GithubOutlined,
  LinkOutlined,
} from "@ant-design/icons";

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

  const [blogs, profileAvatarUrl] = await Promise.all([
    listPublishedBlogsByAuthor(profile.userId),
    resolveAvatarUrlServer(profile.avatarPath),
  ]);
  const coverResults = await Promise.all(
    blogs.map((blog) => resolveCoverImageUrlServer(blog.coverImagePath ?? null))
  );
  const blogsWithCovers = blogs.map((blog, i) => ({ ...blog, coverImageUrl: coverResults[i] }));

  const socials = [
    { href: profile.twitterUrl, icon: <XOutlined />, label: "X / Twitter" },
    { href: profile.instagramUrl, icon: <InstagramOutlined />, label: "Instagram" },
    { href: profile.githubUrl, icon: <GithubOutlined />, label: "GitHub" },
    { href: profile.websiteUrl, icon: <LinkOutlined />, label: "Website" },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href));

  return (
    <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
      {/* Profile card */}
      <div className="flex flex-col items-center gap-5 text-center mb-16">
        <ProfileAvatar
          avatarPath={profile.avatarPath}
          resolvedUrl={profileAvatarUrl}
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

        {/* Socials */}
        {socials.length > 0 && (
          <div className="flex items-center gap-4 mt-1">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-label"
              >
                <span className="text-lg">{s.icon}</span>
              </a>
            ))}
          </div>
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

      {/* Published blogs */}
      <section>
        <div className="flex items-center gap-6 mb-10">
          <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface whitespace-nowrap">
            Posts by @{profile.username}
          </h2>
          <div className="h-px flex-grow bg-outline-variant/20"></div>
        </div>

        {blogsWithCovers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {blogsWithCovers.map((blog) => (
              <PostCard
                key={blog.blogId}
                post={{
                  title: blog.title,
                  slug: blog.slug,
                  excerpt: blog.excerpt,
                  authorName: profile.displayName ?? profile.username,
                  tags: blog.tags,
                  publishedAt: blog.publishedAt,
                  coverImageUrl: blog.coverImageUrl,
                  blogId: blog.blogId,
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-on-surface-variant font-body text-sm">
            No published posts yet.
          </p>
        )}
      </section>
    </main>
  );
}
