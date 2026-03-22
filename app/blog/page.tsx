import Link from "next/link";
import TagList from "@/components/blog/TagList";
import { placeholderBlogs } from "@/lib/blog-skeleton";

const publishedBlogs = placeholderBlogs.filter((blog) => blog.status === "PUBLISHED");

export default function BlogIndexPage() {
  return (
    <main className="min-h-[calc(100vh-73px)] bg-zinc-50 px-6 py-14 text-zinc-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Public blog index</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Published posts will eventually be listed here.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600">
            This route is intentionally a shell. Replace the placeholder array with an
            Amplify Data query that fetches only
            <code className="mx-1 rounded bg-zinc-100 px-2 py-1 text-xs">PUBLISHED</code>
            blogs and routes readers to
            <code className="mx-1 rounded bg-zinc-100 px-2 py-1 text-xs">/blog/[slug]</code>.
          </p>
        </section>

        <section className="grid gap-5">
          {publishedBlogs.map((blog) => (
            <article
              key={blog.blogId}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    {blog.authorName}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-zinc-900">{blog.title}</h2>
                </div>

                <p className="text-sm leading-6 text-zinc-600">
                  Future reader flow: fetch the blog record by slug, resolve the markdown
                  file from S3, then render it with the shared markdown component.
                </p>

                <TagList tags={blog.tags} />

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href={`/blog/${blog.slug}`}
                    className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
                  >
                    Open skeleton
                  </Link>
                  <span className="rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600">
                    contentPath: {blog.contentPath}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
