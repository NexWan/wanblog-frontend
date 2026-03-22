import { requireAdmin } from "@/lib/auth";
import MarkdownPreview from "@/components/blog/MarkdownPreview";
import { placeholderMarkdown } from "@/lib/blog-skeleton";

export default async function NewBlogPage() {
  await requireAdmin();

  return (
    <main className="min-h-[calc(100vh-73px)] bg-zinc-50 px-6 py-14 text-zinc-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Admin editor shell</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Create a new post</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600">
            Build the real editor here with a client component that owns title, slug, tags,
            markdown source, draft save, and publish actions.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Suggested editor fields</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-zinc-200 p-4">
                <p className="text-sm font-medium text-zinc-900">Title input</p>
                <p className="mt-2 text-sm text-zinc-600">
                  Keep title, slug, tags, and markdown state together in one client editor
                  component.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 p-4">
                <p className="text-sm font-medium text-zinc-900">Markdown textarea</p>
                <p className="mt-2 text-sm text-zinc-600">
                  Upload the markdown file to the draft S3 prefix before writing the blog
                  record.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 p-4">
                <p className="text-sm font-medium text-zinc-900">Draft + publish actions</p>
                <p className="mt-2 text-sm text-zinc-600">
                  Drafts should point to
                  <code className="mx-1 rounded bg-zinc-100 px-2 py-1 text-xs">
                    drafts/...
                  </code>
                  and published posts to
                  <code className="mx-1 rounded bg-zinc-100 px-2 py-1 text-xs">blogs/...</code>.
                </p>
              </div>
            </div>
          </div>

          <MarkdownPreview source={placeholderMarkdown} />
        </section>
      </div>
    </main>
  );
}
