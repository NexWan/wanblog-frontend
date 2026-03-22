import TagList from "@/components/blog/TagList";
import MarkdownPreview from "@/components/blog/MarkdownPreview";
import { placeholderBlogs, placeholderMarkdown } from "@/lib/blog-skeleton";

type BlogDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const blog = placeholderBlogs.find((entry) => entry.slug === slug) ?? placeholderBlogs[0];

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
            <TagList tags={blog.tags} />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-900">Planned runtime flow</p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-zinc-600">
            <li>Query the blog record by slug and verify it is published.</li>
            <li>Use the stored S3 path to download or resolve the markdown file.</li>
            <li>Render the markdown with a shared React renderer.</li>
            <li>Fetch comments and likes by blog ID.</li>
          </ol>
        </section>

        <MarkdownPreview source={placeholderMarkdown} />
      </div>
    </main>
  );
}
