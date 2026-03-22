"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
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
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-sm text-tertiary shadow-sm font-label tracking-wide mb-8">
          {statusMessage}
        </div>
      ) : null}

      <section className="grid gap-6">
        {blogs.map((blog) => {
          const safeTags: string[] = (blog.tags ?? []).filter(
            (tag: string | null | undefined): tag is string => Boolean(tag)
          );

          return (
            <article
              key={blog.blogId}
              className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 transition hover:bg-surface-container-high"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <p className="font-label text-[10px] uppercase tracking-widest text-primary mr-3 inline-block bg-primary/10 px-2 py-0.5 rounded">
                      {blog.status}
                    </p>
                    <h2 className="mt-3 text-2xl font-bold text-on-surface font-headline">{blog.title}</h2>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {safeTags.map((tag: string) => (
                      <span key={tag} className="bg-surface-container-highest px-3 py-1 text-[10px] uppercase tracking-widest font-label text-on-surface-variant rounded-full border border-outline-variant/10">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-1 text-xs text-on-surface-variant/40 font-mono mt-4">
                    <p>blogId: {blog.blogId}</p>
                    <p>slug: {blog.slug}</p>
                    <p>contentPath: {blog.contentPath}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/blogs/${blog.blogId}/edit`}
                    className="inline-flex w-fit rounded-lg border border-outline-variant/30 px-5 py-2.5 text-xs font-bold font-label tracking-widest text-on-surface transition hover:bg-surface-bright"
                  >
                    Edit
                  </Link>

                  <button
                    type="button"
                    aria-label={`Delete ${blog.title}`}
                    onClick={() => setBlogPendingDelete(blog)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-error/20 bg-error/10 text-error transition hover:bg-error/20"
                  >
                    <span aria-hidden="true" className="text-lg leading-none">×</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {blogPendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-dim/80 backdrop-blur-md px-6">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container p-8 shadow-2xl editorial-shadow">
            <p className="font-label text-[10px] uppercase tracking-widest text-error">Confirm delete</p>
            <h2 className="mt-4 text-2xl font-bold text-on-surface font-headline leading-tight">
              Delete &quot;{blogPendingDelete.title}&quot;?
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-on-surface-variant font-body mb-8">
              This removes the blog record from the admin list. It does not currently clean up the markdown file or images from storage.
            </p>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setBlogPendingDelete(null)}
                disabled={isDeleting}
                className="rounded-lg px-5 py-2.5 text-xs font-bold font-label tracking-widest text-on-surface-variant hover:text-on-surface transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteConfirm()}
                disabled={isDeleting}
                className="rounded-lg bg-error px-5 py-2.5 text-xs font-bold font-label tracking-widest text-on-error transition hover:opacity-90 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Post"}
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
