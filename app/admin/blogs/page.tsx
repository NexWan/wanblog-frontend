import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import AdminBlogList from "@/components/blog/AdminBlogList";
import { listBlogsForAdmin } from "@/lib/blog-data.server";

export default async function AdminBlogsPage() {
  await requireAdmin();
  const blogs = await listBlogsForAdmin();

  return (
    <main className="px-6 max-w-7xl mx-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 mt-12 mb-20">
        <section className="flex flex-col gap-6 rounded-2xl bg-surface-container p-10 border-l-4 border-primary editorial-shadow md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant">Admin blog list</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight font-headline text-on-surface">Manage Posts</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-on-surface-variant font-body">
              Listing all your drafts and published entries.
            </p>
          </div>

          <Link
            href="/admin/blogs/new"
            className="inline-flex w-fit rounded-lg primary-gradient px-6 py-3 text-sm font-bold font-label tracking-widest text-on-primary transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            New Draft
          </Link>
        </section>

        <AdminBlogList initialBlogs={blogs} />
      </div>
    </main>
  );
}
