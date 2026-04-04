"use client";

import { useMemo, useState } from "react";
import type { EnrichedBlog } from "@/lib/enriched-blog-types";
import PostCard from "@/components/PostCard";
import { cn } from "@/lib/utils";

type SortKey = "date-desc" | "date-asc" | "likes-desc" | "likes-asc";

export default function BlogFilter({ blogs }: { blogs: EnrichedBlog[] }) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("date-desc");

  const allTags = useMemo(
    () => [...new Set(blogs.flatMap((b) => b.tags))].sort(),
    [blogs]
  );

  const filtered = useMemo(() => {
    let result = blogs;

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter((b) => b.title.toLowerCase().includes(term));
    }

    if (activeTag !== null) {
      result = result.filter((b) => b.tags.includes(activeTag));
    }

    return [...result].sort((a, b) => {
      switch (sort) {
        case "date-desc":
          return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
        case "date-asc":
          return (a.publishedAt ?? "").localeCompare(b.publishedAt ?? "");
        case "likes-desc":
          return b.likeCount - a.likeCount;
        case "likes-asc":
          return a.likeCount - b.likeCount;
      }
    });
  }, [blogs, search, activeTag, sort]);

  function clearFilters() {
    setSearch("");
    setActiveTag(null);
    setSort("date-desc");
  }

  return (
    <div>
      {/* Controls row */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-surface-container-high rounded-xl px-4 py-3 text-sm font-body text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-1 focus:ring-primary/40"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="bg-surface-container-high rounded-xl px-4 py-3 text-sm font-label text-on-surface-variant outline-none cursor-pointer"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="likes-desc">Most liked</option>
          <option value="likes-asc">Least liked</option>
        </select>
      </div>

      {/* Tag pills */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setActiveTag(null)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold font-label transition-colors",
              activeTag === null
                ? "bg-primary text-on-primary"
                : "bg-surface-container-high hover:bg-primary/20 text-on-surface-variant"
            )}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold font-label transition-colors",
                activeTag === tag
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-high hover:bg-primary/20 text-on-surface-variant"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs font-label text-on-surface-variant mb-8">
        {filtered.length} post{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
        {filtered.length > 0 ? (
          filtered.map((blog) => (
            <PostCard
              key={blog.blogId}
              post={{
                title: blog.title,
                slug: blog.slug,
                excerpt: blog.excerpt,
                authorName: blog.authorName,
                tags: blog.tags,
                publishedAt: blog.publishedAt,
                coverImageUrl: blog.coverImageUrl,
                likeCount: blog.likeCount,
                blogId: blog.blogId,
              }}
            />
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-on-surface-variant font-body">
            <p className="text-lg mb-2">No posts match your filters.</p>
            <button
              onClick={clearFilters}
              className="text-primary font-label text-sm hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
