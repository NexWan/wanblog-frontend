"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import TagList from "@/components/blog/TagList";
import { deleteBlog, type Blog } from "@/lib/blog-data";

type AdminBlogListProps = {
  initialBlogs: Blog[];
};

export default function AdminBlogList({ initialBlogs }: AdminBlogListProps) {
  const router = useRouter();
  const [blogs, setBlogs] = useState(initialBlogs);
  const [blogPendingDelete, setBlogPendingDelete] = useState<Blog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleDeleteConfirm() {
    if (!blogPendingDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteBlog({ blogId: blogPendingDelete.blogId });
      setBlogs((currentBlogs) =>
        currentBlogs.filter((blog) => blog.blogId !== blogPendingDelete.blogId),
      );
      setStatusMessage(`Deleted "${blogPendingDelete.title}".`);
      setBlogPendingDelete(null);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Deleting the blog failed."));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      {statusMessage ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 shadow-sm">
          {statusMessage}
        </div>
      ) : null}

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

              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/blogs/${blog.blogId}/edit`}
                  className="inline-flex w-fit rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
                >
                  Edit shell
                </Link>

                <button
                  type="button"
                  aria-label={`Delete ${blog.title}`}
                  onClick={() => setBlogPendingDelete(blog)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                >
                  <span aria-hidden="true">🗑</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {blogPendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 px-6">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Confirm delete</p>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-900">
              Delete &quot;{blogPendingDelete.title}&quot;?
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              This removes the blog record from the admin list. It does not currently clean up the
              markdown file or images from storage.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setBlogPendingDelete(null)}
                disabled={isDeleting}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteConfirm()}
                disabled={isDeleting}
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete post"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return `${fallback} ${error.message}`;
  }

  return fallback;
}
