import PostCard from "@/components/PostCard";
import { isCurrentUserAdmin } from "@/lib/auth";
import { listBlogsForAdmin, listBlogsPublic } from "@/lib/blog-data.server";
import { resolveCoverImageUrlServer } from "@/lib/blog-storage.server";
import { getProfileByUserIdPublic } from "@/lib/profile-data.server";

export default async function BlogIndexPage() {
  const isAdmin = await isCurrentUserAdmin();
  const blogs = isAdmin ? await listBlogsForAdmin() : await listBlogsPublic();
  const publishedBlogs = blogs.filter((blog) => isAdmin || blog.status === "PUBLISHED");

  // Batch-fetch cover images and unique author profiles in parallel
  const uniqueAuthorIds = [...new Set(publishedBlogs.map((b) => b.authorUserId))];
  const [coverResults, profileResults] = await Promise.all([
    Promise.all(publishedBlogs.map((blog) => resolveCoverImageUrlServer(blog.coverImagePath ?? null))),
    Promise.all(uniqueAuthorIds.map((id) => getProfileByUserIdPublic(id).catch(() => null))),
  ]);

  const profileMap = Object.fromEntries(
    uniqueAuthorIds.map((id, i) => [id, profileResults[i]])
  );

  const blogsWithCovers = publishedBlogs.map((blog, i) => {
    const profile = profileMap[blog.authorUserId];
    const authorName = profile
      ? `${profile.displayName ?? profile.username} (${profile.username})`
      : blog.authorName;
    return { ...blog, coverImageUrl: coverResults[i], authorName };
  });

  return (
    <main className="px-6 max-w-7xl mx-auto mb-20">
      <div className="flex items-center justify-between mb-12 mt-12">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight font-headline text-on-surface">The Perspectives</h1>
        <div className="h-px flex-grow mx-8 bg-outline-variant/20 hidden md:block"></div>
      </div>

      <p className="max-w-3xl text-sm leading-relaxed text-on-surface-variant font-body mb-16">
        This route is intentionally a shell for future published posts. Readers will click on a post to read its full long-form editorial content.
      </p>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
        {blogsWithCovers.map((blog) => (
          <PostCard
            key={blog.blogId}
            post={{
              title: blog.title,
              slug: blog.slug,
              excerpt: blog.excerpt ?? "",
              authorName: blog.authorName,
              tags: blog.tags,
              publishedAt: blog.publishedAt,
              coverImageUrl: blog.coverImageUrl,
            }}
          />
        ))}
      </section>
    </main>
  );
}
