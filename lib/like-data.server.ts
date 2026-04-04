import "server-only";

import { cookies } from "next/headers";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/api";
import { getServerAmplifyOutputs } from "@/lib/amplify-outputs.server";
import type { Like } from "@/lib/like-types";

const outputs = getServerAmplifyOutputs();

type LikeServerClient = {
  models: {
    Like: {
      listLikesByBlogId: (
        input: { blogId: string },
        options: { authMode: "apiKey" }
      ) => Promise<{ data: Like[]; errors?: { message: string }[] }>;
    };
  };
};

const serverClient = generateServerClientUsingCookies({
  config: outputs,
  cookies,
}) as unknown as LikeServerClient;

function assertNoErrors(errors: { message: string }[] | undefined) {
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }
}

export async function getLikeCountByBlogId(blogId: string): Promise<number> {
  // TODO: handle pagination for posts with >100 likes (nextToken)
  const { data, errors } = await serverClient.models.Like.listLikesByBlogId(
    { blogId },
    { authMode: "apiKey" }
  );

  assertNoErrors(errors);

  return data.length;
}
