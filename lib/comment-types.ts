export type Comment = {
  id: string;
  blogId: string;
  authorName: string;
  authorUserId: string;
  content: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CreateCommentInput = {
  blogId: string;
  authorName: string;
  authorUserId: string;
  content: string;
};
