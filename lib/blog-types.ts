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

export const DRAFT_PUBLISHED_AT_PLACEHOLDER = "1970-01-01T00:00:00.000Z";

type BlogWithStatusAndPublishedAt = {
  status: BlogStatus;
  publishedAt?: string | null;
};

export function normalizeBlogPublishedAt<T extends BlogWithStatusAndPublishedAt>(blog: T): T {
  if (blog.status !== "DRAFT") {
    return {
      ...blog,
      publishedAt: blog.publishedAt ?? null,
    };
  }

  return {
    ...blog,
    publishedAt: null,
  };
}

export function serializeBlogPublishedAt<T extends BlogWithStatusAndPublishedAt>(blog: T): T {
  if (blog.status !== "DRAFT") {
    return blog;
  }

  return {
    ...blog,
    publishedAt: DRAFT_PUBLISHED_AT_PLACEHOLDER,
  };
}
