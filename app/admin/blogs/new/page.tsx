import { requireAdmin } from "@/lib/auth";
import BlogEditorShell from "@/components/blog/BlogEditorShell";
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
            This editor shell now demonstrates draft markdown uploads plus draft media
            uploads that write Amplify storage paths into the markdown.
          </p>
        </section>

        <BlogEditorShell initialMarkdown={placeholderMarkdown} />
      </div>
    </main>
  );
}
