import {
  cachedResolveCoverImageUrl,
  cachedGetProfileByUserId,
} from "@/lib/cached-queries.server";
import { fetchAllPublishedBlogsPublic } from "@/lib/appsync-public-fetch.server";
import type { EnrichedBlog } from "@/lib/enriched-blog-types";
import BlogFilter from "@/components/blog/BlogFilter";

export const dynamic = "force-dynamic";

export default async function BlogIndexPage() {
  const publishedBlogs = await fetchAllPublishedBlogsPublic();

  const uniqueAuthorIds = [...new Set(publishedBlogs.map((b) => b.authorUserId))];
  const [coverResults, profileResults] = await Promise.all([
    Promise.all(
      publishedBlogs.map((blog) =>
        cachedResolveCoverImageUrl(blog.coverImagePath ?? "").catch(() => null),
      ),
    ),
    Promise.all(
      uniqueAuthorIds.map((id) => cachedGetProfileByUserId(id).catch(() => null)),
    ),
  ]);

  const profileMap = Object.fromEntries(
    uniqueAuthorIds.map((id, i) => [id, profileResults[i]]),
  );

  const enrichedBlogs: EnrichedBlog[] = publishedBlogs.map((blog, i) => {
    const profile = profileMap[blog.authorUserId];
    const authorName = profile
      ? `${profile.displayName ?? profile.username} (${profile.username})`
      : blog.authorName;
    return {
      blogId: blog.blogId,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt ?? null,
      tags: (blog.tags ?? []).filter((t): t is string => t !== null),
      authorName,
      publishedAt: blog.publishedAt ?? null,
      coverImageUrl: coverResults[i] ?? null,
      status: blog.status,
      // likeCount omitted — LikeButton hydrates the real count client-side
    };
  });

  return (
    <main className="px-6 max-w-7xl mx-auto mb-20">
      <div className="flex items-center justify-between mb-12 mt-12">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight font-headline text-on-surface">
          The Perspectives
        </h1>
        <div className="h-px flex-grow mx-8 bg-outline-variant/20 hidden md:block"></div>
      </div>

      <p className="max-w-3xl text-sm leading-relaxed text-on-surface-variant font-body mb-16">
        This route is intentionally a shell for future published posts. Readers will click
        on a post to read its full long-form editorial content.
      </p>

      <BlogFilter blogs={enrichedBlogs} />
    </main>
  );
}
