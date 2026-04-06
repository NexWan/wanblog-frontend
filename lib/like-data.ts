import { generateClient } from "aws-amplify/data";
import type { Like } from "@/lib/like-types";

type LikeClient = {
  models: {
    Like: {
      create: (
        input: { blogId: string; userId: string },
        options: { authMode: "userPool" }
      ) => Promise<{ data: Like | null; errors?: { message: string }[] }>;
      delete: (
        input: { blogId: string; userId: string },
        options: { authMode: "userPool" }
      ) => Promise<{ data: { blogId: string; userId: string } | null; errors?: { message: string }[] }>;
      get: (
        input: { blogId: string; userId: string },
        options: { authMode: "apiKey" }
      ) => Promise<{ data: Like | null; errors?: { message: string }[] }>;
    };
  };
};

const client = generateClient() as unknown as LikeClient;

export async function createLike(blogId: string, userId: string): Promise<Like> {
  const { data, errors } = await client.models.Like.create(
    { blogId, userId },
    { authMode: "userPool" }
  );

  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }

  if (!data) throw new Error("No data returned from createLike");

  return data as Like;
}

export async function deleteLike(blogId: string, userId: string): Promise<void> {
  const { errors } = await client.models.Like.delete(
    { blogId, userId },
    { authMode: "userPool" }
  );

  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }
}

export async function getUserLikeForBlog(blogId: string, userId: string): Promise<Like | null> {
  const { data, errors } = await client.models.Like.get(
    { blogId, userId },
    { authMode: "apiKey" }
  );

  if (errors?.length) {
    return null;
  }

  return data as Like | null;
}
