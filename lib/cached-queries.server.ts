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
// Profile data
// ---------------------------------------------------------------------------

export const cachedGetProfileByUserId = unstable_cache(
  (userId: string) => fetchProfileByUserIdPublic(userId),
  ["get-profile-by-user-id"],
  { revalidate: 600 },
);

export const cachedGetProfileByUsername = unstable_cache(
  (username: string) => fetchProfileByUsernamePublic(username),
  ["get-profile-by-username"],
  { revalidate: 600 },
);

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

export const cachedGetMarkdownContent = unstable_cache(
  (path: string) => getMarkdownContentServer(path),
  ["get-markdown-content"],
  { revalidate: 10800 }, // 3 hours
);

export const cachedResolveMarkdownImages = unstable_cache(
  (markdown: string, slug: string) => resolveMarkdownImagesServer(markdown),
  ["resolve-markdown-images"],
  { revalidate: 10800 }, // 3 hours
);
