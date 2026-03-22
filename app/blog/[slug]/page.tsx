import TagList from "@/components/blog/TagList";
import MarkdownPreview from "@/components/blog/MarkdownPreview";
import { getBlogBySlugForAdmin, getBlogBySlugPublic } from "@/lib/blog-data.server";
import { isCurrentUserAdmin } from "@/lib/auth";
import { getMarkdownContentServer } from "@/lib/blog-storage.server";

type BlogDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const isAdmin = await isCurrentUserAdmin();
  console.log("BlogDetailPage slug", slug, "isAdmin", isAdmin);
  const blog = isAdmin
    ? await getBlogBySlugForAdmin(slug)
    : await getBlogBySlugPublic(slug);

  if (!blog) {
    return (
      <main className="min-h-[calc(100vh-73px)] bg-zinc-50 px-6 py-14 text-zinc-900">
        <div className="mx-auto flex max-w-4xl flex-col gap-8">
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Blog not found</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">This blog post does not exist</h1>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              We could not find a blog post for this slug.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (blog.status !== "PUBLISHED" && !isAdmin) {
    return (
      <main className="min-h-[calc(100vh-73px)] bg-zinc-50 px-6 py-14 text-zinc-900">
        <div className="mx-auto flex max-w-4xl flex-col gap-8">
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Blog not found</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">This blog post is not available</h1>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              The blog post you are looking for is either unpublished or does not exist.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const markdownContent = await getMarkdownContentServer(blog.contentPath);

  return (
    <main className="min-h-[calc(100vh-73px)] bg-zinc-50 px-6 py-14 text-zinc-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Blog detail shell</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{blog.title}</h1>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-600">
            <span>Author: {blog.authorName}</span>
            <span>Status: {blog.status}</span>
            <span>Slug: {blog.slug}</span>
          </div>
          <div className="mt-5">
            <TagList tags={(blog.tags ?? []).filter((tag): tag is string => Boolean(tag))} />
          </div>
        </section>

        <MarkdownPreview source={markdownContent} />
      </div>
    </main>
  );
}
