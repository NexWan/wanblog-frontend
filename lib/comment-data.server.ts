import "server-only";

import { cookies } from "next/headers";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/api";
import { getServerAmplifyOutputs } from "@/lib/amplify-outputs.server";
import type { Comment } from "@/lib/comment-types";

const outputs = getServerAmplifyOutputs();

type CommentServerClient = {
  models: {
    Comment: {
      listCommentsByBlogId: (
        input: { blogId: string },
        options: { authMode: "apiKey" }
      ) => Promise<{ data: Comment[]; errors?: { message: string }[] }>;
    };
  };
};

const serverClient = generateServerClientUsingCookies({
  config: outputs,
  cookies,
}) as unknown as CommentServerClient;

function assertNoErrors(errors: { message: string }[] | undefined) {
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }
}

export async function listCommentsByBlogId(blogId: string): Promise<Comment[]> {
  // TODO: handle pagination for posts with >100 comments (nextToken)
  const { data, errors } = await serverClient.models.Comment.listCommentsByBlogId(
    { blogId },
    { authMode: "apiKey" }
  );

  assertNoErrors(errors);

  return data as Comment[];
}
