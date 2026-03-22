import TagList from "@/components/blog/TagList";
import PostCard from "@/components/PostCard";
import { isCurrentUserAdmin } from "@/lib/auth";
import { listBlogsForAdmin, listBlogsPublic } from "@/lib/blog-data.server";
import { placeholderBlogs } from "@/lib/blog-skeleton";

const isAdmin = await isCurrentUserAdmin();

const blogs = isAdmin ? await listBlogsForAdmin() : await listBlogsPublic();

const publishedBlogs = blogs.filter((blog) => isAdmin || blog.status === "PUBLISHED");

export default function BlogIndexPage() {
  return (
    <main className="px-6 max-w-7xl mx-auto mb-20">
      <div className="flex items-center justify-between mb-12 mt-12">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight font-headline text-on-surface">The Perspectives</h1>
        <div className="h-px flex-grow mx-8 bg-outline-variant/20 hidden md:block"></div>
      </div>
      
      <p className="max-w-3xl text-sm leading-relaxed text-on-surface-variant font-body mb-16">
        This route is intentionally a shell for future published posts. Readers will click on a post to read its full long-form editorial content.
      </p>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
        {publishedBlogs.map((blog) => (
          <PostCard 
            key={blog.blogId} 
            post={{
              title: blog.title,
              slug: blog.slug,
              excerpt: "Future reader flow: fetch the blog record by slug, resolve S3 path, render.",
              authorName: blog.authorName,
              tags: blog.tags,
            }} 
          />
        ))}
      </section>
    </main>
  );
}
