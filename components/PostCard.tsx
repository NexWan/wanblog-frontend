import React from 'react';
import Link from 'next/link';

export default function PostCard({ post }: { post: any }) {
  // Map actual data to expected visuals
  const title = post.title || 'Untitled';
  const slug = post.slug || '';
  const excerpt = post.excerpt || '';
  const authorName = post.authorName || 'Author';
  const tag = (post.tags && post.tags.length > 0) ? post.tags[0] : 'Blog';
  const date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Draft';
  console.log(date, post)

  return (
    <Link href={`/blog/${slug}`} className="group cursor-pointer block">
      <div className="aspect-[4/5] overflow-hidden rounded-xl mb-6 bg-surface-container-high relative">
        <div className="w-full h-full bg-surface-dim opacity-50 flex items-center justify-center font-headline text-on-surface-variant group-hover:bg-surface-dim/80 transition-colors">
          No cover image
        </div>
        <div className="absolute top-4 left-4">
          <span className="font-label text-[10px] uppercase tracking-widest bg-surface-dim/80 backdrop-blur-md px-2 py-1 rounded text-primary">
            {authorName}
          </span>
        </div>
      </div>
      <div className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">
        {date} • {tag}
      </div>
      <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors font-headline">
        {title}
      </h3>
      <p className="text-on-surface-variant font-body leading-relaxed line-clamp-2">
        {excerpt}
      </p>
    </Link>
  );
}
