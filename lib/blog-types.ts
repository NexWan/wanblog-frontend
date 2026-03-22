export type BlogStatus = "DRAFT" | "PUBLISHED";

export type Blog = {
  blogId: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  tags?: (string | null)[] | null;
  contentPath: string;
  coverImagePath?: string | null;
  authorName: string;
  authorUserId: string;
  status: BlogStatus;
  publishedAt?: string | null;
};

export type CreateBlogInput = {
  blogId: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  tags?: (string | null)[] | null;
  contentPath: string;
  coverImagePath?: string | null;
  authorName: string;
  authorUserId: string;
  status: BlogStatus;
  publishedAt?: string | null;
};

export type DeleteBlogInput = {
  blogId: string;
};
