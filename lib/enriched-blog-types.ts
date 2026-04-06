export type EnrichedBlog = {
  blogId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  tags: string[]; // nulls stripped server-side
  authorName: string;
  publishedAt: string | null;
  coverImageUrl: string | null;
  likeCount: number;
  status: string;
};
