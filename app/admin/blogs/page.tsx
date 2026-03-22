import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import TagList from "@/components/blog/TagList";
import { listBlogsForAdmin } from "@/lib/blog-data.server";

export default async function AdminBlogsPage() {
  await requireAdmin();

  const blogs = await listBlogsForAdmin();

  console.log("AdminBlogsPage blogs", blogs);

  return (
    <main className="min-h-[calc(100vh-73px)] bg-zinc-50 px-6 py-14 text-zinc-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Admin blog list</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Manage posts</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600">
              Replace this placeholder list with admin-only blog queries that include both
              drafts and published entries.
            </p>
          </div>

          <Link
            href="/admin/blogs/new"
            className="inline-flex w-fit rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            New post shell
          </Link>
        </section>

        <section className="grid gap-5">
          {blogs.map((blog) => (
            <article
              key={blog.blogId}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {blog.status}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-zinc-900">{blog.title}</h2>
                  </div>

                  <TagList tags={(blog.tags ?? []).filter((tag): tag is string => Boolean(tag))} />

                  <div className="space-y-1 text-sm text-zinc-600">
                    <p>blogId: {blog.blogId}</p>
                    <p>slug: {blog.slug}</p>
                    <p>contentPath: {blog.contentPath}</p>
                  </div>
                </div>

                <Link
                  href={`/admin/blogs/${blog.blogId}/edit`}
                  className="inline-flex w-fit rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
                >
                  Edit shell
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
