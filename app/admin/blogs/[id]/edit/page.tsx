import { requireAdmin } from "@/lib/auth";
import BlogEditorShell from "@/components/blog/BlogEditorShell";
import { placeholderBlogs, placeholderMarkdown } from "@/lib/blog-skeleton";

type EditBlogPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  await requireAdmin();
  const { id } = await params;
  const blog = placeholderBlogs.find((entry) => entry.blogId === id) ?? placeholderBlogs[0];

  return (
    <main className="min-h-[calc(100vh-73px)] bg-zinc-50 px-6 py-14 text-zinc-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Admin edit shell</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{blog.title}</h1>
          <p className="mt-4 text-sm leading-7 text-zinc-600">
            Wire this route to fetch the current blog record, hydrate the client editor, and
            let admins replace draft media, re-save markdown, and then prepare the
            published assets.
          </p>
        </section>

        <BlogEditorShell
          initialBlogId={blog.blogId}
          initialTitle={blog.title}
          initialSlug={blog.slug}
          initialTags={blog.tags}
          initialMarkdown={placeholderMarkdown}
        />
      </div>
    </main>
  );
}
