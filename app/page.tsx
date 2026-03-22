import Link from "next/link";
import { getCurrentUserGroups, isCurrentUserAdmin } from "@/lib/auth";
import { SAMPLE_POSTS } from "@/lib/utils";
import PostCard from "@/components/PostCard";

export default async function Home() {
  const [groups, admin] = await Promise.all([
    getCurrentUserGroups(),
    isCurrentUserAdmin(),
  ]);

  const featuredPost = SAMPLE_POSTS.find(p => p.featured) || SAMPLE_POSTS[0];
  const recentPosts = SAMPLE_POSTS.filter(p => !p.featured);

  return (
    <main className="px-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="mb-20">
        <Link href={`/blog`} className="relative group block overflow-hidden rounded-xl bg-surface-container h-[716px] flex items-end">
          <img 
            src={featuredPost.image} 
            alt={featuredPost.title}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-dim via-transparent to-transparent"></div>
          <div className="relative z-10 p-8 md:p-16 max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <span className="font-label text-xs uppercase tracking-widest text-tertiary bg-tertiary/10 px-3 py-1 rounded-full">
                WanBlog Beta
              </span>
              <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                Session info: {admin ? "Admin access" : "User"}
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-on-surface leading-tight tracking-tighter font-headline">
              Draft ideas, publish stories, <span className="text-transparent bg-clip-text primary-gradient italic">grow WanBlog.</span>
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant mb-8 max-w-2xl font-body leading-relaxed">
              This is a simple landing area for now. We can turn it into your real homepage once you decide what content blocks, calls to action, and publishing flows you want.
            </p>
            <div className="primary-gradient text-on-primary w-fit px-8 py-4 rounded-lg font-bold flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-primary/20">
              Browse public blog
              <span className="text-xl leading-none">→</span>
            </div>
          </div>
        </Link>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Main Content */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold tracking-tight font-headline">Concept Preview</h2>
            <div className="h-px flex-grow mx-8 bg-outline-variant/20 hidden md:block"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16">
            {recentPosts.map((post) => (
              <PostCard key={post.id} post={{
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                authorName: post.author.name,
                tags: post.tags,
                publishedAt: new Date().toISOString()
              }} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-16">
          {/* Admin Block */}
          <section className="bg-surface-container rounded-xl p-8 border-l-4 border-primary">
            <h3 className="text-2xl font-bold mb-4 font-headline">Administration</h3>
            <p className="text-on-surface-variant mb-6 text-sm font-body leading-relaxed">
              If you have access, you can manage the content listed on the platform here. Groups: {groups.join(", ") || "none"}
            </p>
            <Link href="/admin/blogs" className="block w-full text-center primary-gradient text-on-primary font-bold py-3 rounded-lg shadow-lg shadow-primary/10">
              Manage Posts
            </Link>
          </section>

          {/* Tags */}
          <section>
            <h3 className="font-label text-sm uppercase tracking-[0.2em] text-on-surface-variant mb-8 flex items-center">
              Explore Topics
              <span className="ml-4 h-px flex-grow bg-outline-variant/20"></span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {['AWS AMPLIFY', 'NEXTJS', 'TYPESCRIPT', 'TAILWINDCSS', 'DARK MODE', 'UI DESIGN'].map(tag => (
                <span key={tag} className="bg-surface-container-high hover:bg-primary hover:text-on-primary transition-colors px-4 py-2 rounded-full text-xs font-bold font-label cursor-pointer">
                  {tag}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
