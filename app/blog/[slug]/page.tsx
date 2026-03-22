import TagList from "@/components/blog/TagList";
import MarkdownPreview from "@/components/blog/MarkdownPreview";
import { getBlogBySlugForAdmin, getBlogBySlugPublic } from "@/lib/blog-data.server";
import { isCurrentUserAdmin } from "@/lib/auth";
import { getMarkdownContentServer } from "@/lib/blog-storage.server";

type BlogDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const isAdmin = await isCurrentUserAdmin();
  const blog = isAdmin
    ? await getBlogBySlugForAdmin(slug)
    : await getBlogBySlugPublic(slug);

  if (!blog) {
    return (
      <main className="pt-32 pb-20 text-center text-on-surface">
        <h1 className="text-4xl font-headline font-bold mb-4">Post not found</h1>
        <p className="text-on-surface-variant font-body mb-8">This blog post does not exist.</p>
      </main>
    );
  }

  if (blog.status !== "PUBLISHED" && !isAdmin) {
    return (
      <main className="pt-32 pb-20 text-center text-on-surface">
        <h1 className="text-4xl font-headline font-bold mb-4">Post unavailable</h1>
        <p className="text-on-surface-variant font-body mb-8">This blog post is unpublished or does not exist.</p>
      </main>
    );
  }

  const markdownContent = await getMarkdownContentServer(blog.contentPath);
  const words = blog.title.split(' ');
  const date = blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : 'Draft';
  const tag = (blog.tags && blog.tags.length > 0) ? blog.tags[0] : 'Blog';

  return (
    <main className="pb-20">
      <header className="max-w-5xl mx-auto px-6 mb-16 pt-8">
        <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden mb-12 editorial-shadow bg-surface-container-high flex items-center justify-center text-on-surface-variant">
           <span className="font-headline tracking-widest uppercase">No cover image available</span>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="inline-block bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-xs font-label uppercase tracking-widest mb-6 border border-tertiary/20">
            {tag}
          </div>
          <h1 className="font-headline text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-8 text-on-surface">
            {words.map((word, i) => 
               i % 3 === 0 && i !== 0
                ? <span key={i} className="text-primary italic">{word} </span>
                : word + ' '
            )}
          </h1>

          <div className="flex flex-col md:flex-row items-center gap-6 py-8 border-y border-outline-variant/15">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-primary/20 flex items-center justify-center overflow-hidden font-headline text-lg text-primary font-bold">
                {blog.authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">Written by</p>
                <p className="font-body font-bold text-primary">{blog.authorName}</p>
              </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-outline-variant/30"></div>
            <div>
              <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">Published</p>
              <p className="font-body font-bold text-on-surface">{date}</p>
            </div>
             <div className="hidden md:block w-px h-10 bg-outline-variant/30"></div>
            <div>
              <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">Status</p>
              <p className="font-body font-bold text-on-surface">{blog.status}</p>
            </div>
            <div className="hidden md:block w-px h-10 bg-outline-variant/30"></div>
            <div>
              <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">Tags</p>
              <TagList tags={(blog.tags ?? []).filter((t): t is string => Boolean(t))} />
            </div>
          </div>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6">
        <MarkdownPreview source={markdownContent} />
      </article>
    </main>
  );
}
