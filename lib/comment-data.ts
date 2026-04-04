import { generateClient } from "aws-amplify/data";
import type { Comment, CreateCommentInput } from "@/lib/comment-types";

type CommentClient = {
  models: {
    Comment: {
      create: (
        input: CreateCommentInput,
        options: { authMode: "userPool" }
      ) => Promise<{ data: Comment | null; errors?: { message: string }[] }>;
      delete: (
        input: { id: string },
        options: { authMode: "userPool" }
      ) => Promise<{ data: { id: string } | null; errors?: { message: string }[] }>;
    };
  };
};

const client = generateClient() as unknown as CommentClient;

export async function createComment(input: CreateCommentInput): Promise<Comment> {
  const { data, errors } = await client.models.Comment.create(input, {
    authMode: "userPool",
  });

  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }

  if (!data) throw new Error("No data returned from createComment");

  return data as Comment;
}

export async function deleteComment(id: string): Promise<void> {
  const { errors } = await client.models.Comment.delete({ id }, {
    authMode: "userPool",
  });

  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }
}
