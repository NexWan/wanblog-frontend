import { requireAdmin } from "@/lib/auth";
import MarkdownPreview from "@/components/blog/MarkdownPreview";
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
            let admins replace or publish the markdown file.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Editing checklist</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-zinc-600">
              <li>Load the blog by ID for admin editing.</li>
              <li>Fetch the existing markdown from S3 into the textarea.</li>
              <li>Persist draft updates back to the draft content path.</li>
              <li>Publish by writing to the published path and setting `publishedAt`.</li>
            </ul>
          </div>

          <MarkdownPreview source={placeholderMarkdown} />
        </section>
      </div>
    </main>
  );
}
