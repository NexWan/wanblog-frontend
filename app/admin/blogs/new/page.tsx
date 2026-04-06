import { requireAdmin } from "@/lib/auth";
import BlogEditorShell from "@/components/blog/BlogEditorShell";
import { placeholderMarkdown } from "@/lib/blog-skeleton";

export default async function NewBlogPage() {
  await requireAdmin();

  return (
    <main className="px-6 max-w-[1400px] mx-auto mb-20">
      <div className="mx-auto flex w-full flex-col gap-8 mt-12">
        <section className="flex flex-col gap-2 rounded-2xl bg-surface-container p-10 border-l-4 border-primary editorial-shadow">
          <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant">Admin editor shell</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight font-headline text-on-surface">Create a new post</h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-on-surface-variant font-body">
            This editor shell now demonstrates draft markdown uploads plus draft media
            uploads that write Amplify storage paths into the markdown.
          </p>
        </section>

        <BlogEditorShell initialMarkdown={placeholderMarkdown} />
      </div>
    </main>
  );
}
