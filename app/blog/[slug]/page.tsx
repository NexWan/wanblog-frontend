import Link from "next/link";
import TagList from "@/components/blog/TagList";
import MarkdownPreview from "@/components/blog/MarkdownPreview";
import CommentSection from "@/components/blog/CommentSection";
import LikeButton from "@/components/blog/LikeButton";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { getBlogBySlugForAdmin, getBlogBySlugPublic } from "@/lib/blog-data.server";
import { isCurrentUserAdmin } from "@/lib/auth";
import { getMarkdownContentServer, resolveCoverImageUrlServer } from "@/lib/blog-storage.server";
import { listCommentsByBlogId } from "@/lib/comment-data.server";
import { getLikeCountByBlogId } from "@/lib/like-data.server";
import { getProfileByUserIdPublic } from "@/lib/profile-data.server";
import { resolveAvatarUrlServer } from "@/lib/profile-storage.server";

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

  const [markdownContent, coverImageUrl, comments, likeCount, authorProfile] = await Promise.all([
    getMarkdownContentServer(blog.contentPath),
    resolveCoverImageUrlServer(blog.coverImagePath ?? null),
    listCommentsByBlogId(blog.blogId),
    getLikeCountByBlogId(blog.blogId),
    getProfileByUserIdPublic(blog.authorUserId),
  ]);
  const authorAvatarUrl = await resolveAvatarUrlServer(authorProfile?.avatarPath);

  const uniqueCommentAuthorIds = [...new Set(comments.map((c) => c.authorUserId))];
  const commentAuthorProfiles = await Promise.all(
    uniqueCommentAuthorIds.map((id) => getProfileByUserIdPublic(id).catch(() => null))
  );
  const commentAvatarUrls: Record<string, string | null> = {};
  await Promise.all(
    uniqueCommentAuthorIds.map(async (userId, i) => {
      const profile = commentAuthorProfiles[i];
      commentAvatarUrls[userId] = await resolveAvatarUrlServer(profile?.avatarPath);
    })
  );
  const titleWords: string[] = blog.title.split(" ");
  const safeTags: string[] = (blog.tags ?? []).filter(
    (tag: string | null | undefined): tag is string => Boolean(tag)
  );
  const date = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "Draft";
  const tag = safeTags.length > 0 ? safeTags[0] : "Blog";
  const authorDisplayName = authorProfile?.displayName ?? blog.authorName;
  const authorLabel = authorProfile
    ? `${authorProfile.displayName ?? authorProfile.username} (${authorProfile.username})`
    : blog.authorName;

  return (
    <main className="pb-20">
      <header className="max-w-5xl mx-auto px-6 mb-16 pt-8">
        <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden mb-12 editorial-shadow bg-surface-container-high">
          {coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageUrl}
              alt={`Cover image for ${blog.title}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
              <span className="font-headline tracking-widest uppercase">No cover image available</span>
            </div>
          )}
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="inline-block bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-xs font-label uppercase tracking-widest mb-6 border border-tertiary/20">
            {tag}
          </div>
          <h1 className="font-headline text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-8 text-on-surface">
            {titleWords.map((word: string, i: number) => 
               i % 3 === 0 && i !== 0
                ? <span key={i} className="text-primary italic">{word} </span>
                : `${word} `
            )}
          </h1>

          <div className="flex flex-col md:flex-row items-center gap-6 py-8 border-y border-outline-variant/15">
            <div className="flex items-center gap-3">
              <ProfileAvatar
                avatarPath={authorProfile?.avatarPath}
                resolvedUrl={authorAvatarUrl}
                displayName={authorDisplayName}
                size="md"
              />
              <div>
                <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">Written by</p>
                {authorProfile ? (
                  <Link href={`/user/${authorProfile.username}`} className="font-body font-bold text-primary hover:underline">
                    {authorLabel}
                  </Link>
                ) : (
                  <p className="font-body font-bold text-primary">{authorLabel}</p>
                )}
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
              <TagList tags={safeTags} />
            </div>
            <div className="hidden md:block w-px h-10 bg-outline-variant/30"></div>
            <div className="flex flex-col items-center gap-1">
              <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">Likes</p>
              <LikeButton blogId={blog.blogId} initialLikeCount={likeCount} />
            </div>
          </div>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6">
        <MarkdownPreview source={markdownContent} />
      </article>

      <section className="max-w-3xl mx-auto px-6 mt-16 pb-8">
        <CommentSection blogId={blog.blogId} initialComments={comments} initialAvatarUrls={commentAvatarUrls} />
      </section>
    </main>
  );
}
