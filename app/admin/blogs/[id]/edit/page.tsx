import { requireAdmin } from "@/lib/auth";
import BlogEditorShell from "@/components/blog/BlogEditorShell";
import { getBlogByIdForAdmin } from "@/lib/blog-data.server";
import { getMarkdownContentServer } from "@/lib/blog-storage.server";

type EditBlogPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  await requireAdmin();
  const { id } = await params;
  const blog = await getBlogByIdForAdmin(id);

  if (!blog) {
    return (
      <main className="px-6 max-w-7xl mx-auto mb-20">
        <div className="mx-auto flex w-full flex-col gap-8 mt-12">
          <section className="flex flex-col gap-2 rounded-2xl bg-surface-container p-10 border-l-4 border-error editorial-shadow">
            <p className="font-label text-xs uppercase tracking-[0.2em] text-error">Blog not found</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight font-headline text-on-surface">This blog could not be loaded</h1>
            <p className="mt-4 text-sm leading-relaxed text-on-surface-variant font-body">
              We could not find a blog with that ID.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const markdownContent = await getMarkdownContentServer(blog.contentPath);
  const initialTags = (blog.tags ?? []).filter(
    (tag: string | null | undefined): tag is string => Boolean(tag)
  );

  return (
    <main className="px-6 max-w-[1400px] mx-auto mb-20">
      <div className="mx-auto flex w-full flex-col gap-8 mt-12">
        <section className="flex flex-col gap-2 rounded-2xl bg-surface-container p-10 border-l-4 border-primary editorial-shadow">
          <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant">Admin edit shell</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight font-headline text-on-surface">{blog.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-on-surface-variant font-body">
            Wire this route to fetch the current blog record, hydrate the client editor, and
            let admins replace draft media, re-save markdown, and then prepare the
            published assets.
          </p>
        </section>

        <BlogEditorShell
          initialBlogId={blog.blogId}
          initialTitle={blog.title}
          initialSlug={blog.slug}
          initialExcerpt={blog.excerpt ?? ""}
          initialTags={initialTags}
          initialMarkdown={markdownContent}
          initialContentPath={blog.contentPath}
          initialStatus={blog.status}
          initialPublishedAt={blog.publishedAt ?? null}
        />
      </div>
    </main>
  );
}
