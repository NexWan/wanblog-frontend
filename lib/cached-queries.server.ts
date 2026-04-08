import "server-only";

import { unstable_cache } from "next/cache";
import {
  fetchPublishedBlogsPublic,
  fetchAllPublishedBlogsPublic,
  fetchBlogBySlugPublic,
  fetchPublishedBlogsByAuthorPublic,
  fetchProfileByUserIdPublic,
  fetchProfileByUsernamePublic,
} from "@/lib/appsync-public-fetch.server";
import {
  getProxyImageUrl,
  getMarkdownContentServer,
  resolveMarkdownImagesServer,
} from "@/lib/blog-storage.server";
import { fetchLikeCountByBlogIdPublic } from "@/lib/appsync-public-fetch.server";

// ---------------------------------------------------------------------------
// Blog data
// ---------------------------------------------------------------------------

export const cachedListLatestPublishedBlogs = unstable_cache(
  (limit: number) => fetchPublishedBlogsPublic(limit),
  ["list-latest-published-blogs"],
  { revalidate: 300, tags: ["published-blogs"] },
);

export const cachedListAllPublishedBlogs = unstable_cache(
  () => fetchAllPublishedBlogsPublic(),
  ["list-all-published-blogs"],
  { revalidate: 300, tags: ["published-blogs"] },
);

export const cachedGetBlogBySlug = unstable_cache(
  (slug: string) => fetchBlogBySlugPublic(slug),
  ["get-blog-by-slug"],
  { revalidate: 300, tags: ["published-blogs"] },
);

export const cachedListPublishedBlogsByAuthor = unstable_cache(
  (authorUserId: string) => fetchPublishedBlogsByAuthorPublic(authorUserId),
  ["list-published-blogs-by-author"],
  { revalidate: 300, tags: ["published-blogs"] },
);

// ---------------------------------------------------------------------------
// Profile data — factory pattern so each entity gets its own cache tag,
// enabling targeted per-user invalidation via revalidateTag(`profile-${userId}`)
// ---------------------------------------------------------------------------

export function cachedGetProfileByUserId(userId: string) {
  return unstable_cache(
    () => fetchProfileByUserIdPublic(userId),
    [`profile-user-${userId}`],
    { revalidate: 600, tags: [`profile-${userId}`] },
  )();
}

export function cachedGetProfileByUsername(username: string) {
  return unstable_cache(
    () => fetchProfileByUsernamePublic(username),
    [`profile-username-${username}`],
    { revalidate: 600, tags: [`profile-username-${username}`] },
  )();
}

// ---------------------------------------------------------------------------
// S3 image URLs — return stable proxy URLs (/api/image?path=...) instead of
// presigned URLs. Proxy URLs never expire, eliminating the timing mismatch
// between S3 presigned URL lifetime and Next.js cache TTLs.
// ---------------------------------------------------------------------------

export async function cachedResolveCoverImageUrl(
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  return getProxyImageUrl(path);
}

export function cachedResolveAvatarUrl(
  avatarPath: string,
  _userId: string,
): Promise<string | null> {
  if (!avatarPath) return Promise.resolve(null);
  return Promise.resolve(getProxyImageUrl(avatarPath));
}

// Combines fetch + image resolution in one cached call, keyed by contentPath + slug.
// Inline images are now proxy URLs, so the cached markdown never contains expiring URLs.
export const cachedGetResolvedMarkdown = unstable_cache(
  async (contentPath: string, _slug: string) => {
    const rawMarkdown = await getMarkdownContentServer(contentPath);
    return resolveMarkdownImagesServer(rawMarkdown);
  },
  ["get-resolved-markdown"],
  { revalidate: 3600, tags: ["published-blogs"] }, // 1 hour; proxy URLs don't expire
);

export const cachedGetLikeCountByBlogId = unstable_cache(
  (blogId: string) => fetchLikeCountByBlogIdPublic(blogId),
  ["get-like-count-by-blog-id"],
  { revalidate: 60 }, // 1 min — likes change frequently
);
