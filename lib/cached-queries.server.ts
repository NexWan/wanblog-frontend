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
  resolveCoverImageUrlServer,
  getMarkdownContentServer,
  resolveMarkdownImagesServer,
} from "@/lib/blog-storage.server";
import { fetchLikeCountByBlogIdPublic } from "@/lib/appsync-public-fetch.server";
import { resolveAvatarUrlServer } from "@/lib/profile-storage.server";

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
// S3 URLs — the guestCookies shim used internally does NOT call cookies()
// from next/headers, so these are safe inside unstable_cache.
// ---------------------------------------------------------------------------

export const cachedResolveCoverImageUrl = unstable_cache(
  (path: string) => resolveCoverImageUrlServer(path),
  ["resolve-cover-image-url"],
  { revalidate: 10800, tags: ["cover-images"] }, // 3 hours
);

export const cachedResolveAvatarUrl = unstable_cache(
  (path: string) => resolveAvatarUrlServer(path),
  ["resolve-avatar-url"],
  { revalidate: 10800, tags: ["avatars"] }, // 3 hours
);

// Combines fetch + image resolution in one cached call, keyed by contentPath + slug
// (small strings) instead of full markdown content — avoids oversized cache keys.
export const cachedGetResolvedMarkdown = unstable_cache(
  async (contentPath: string, _slug: string) => {
    const rawMarkdown = await getMarkdownContentServer(contentPath);
    return resolveMarkdownImagesServer(rawMarkdown);
  },
  ["get-resolved-markdown"],
  { revalidate: 10800 }, // 3 hours
);

export const cachedGetLikeCountByBlogId = unstable_cache(
  (blogId: string) => fetchLikeCountByBlogIdPublic(blogId),
  ["get-like-count-by-blog-id"],
  { revalidate: 60 }, // 1 min — likes change frequently
);
