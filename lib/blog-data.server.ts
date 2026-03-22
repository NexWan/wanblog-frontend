import "server-only";

import { cookies } from "next/headers";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/api";
import prodOutputs from "@/amplify_outputs.json";
import devOutputs from "@/amplify_outputs_dev.json";
import type { Schema } from "../../wanblog-backend/amplify/data/resource";

const outputs =
  process.env.NEXT_PUBLIC_ENV === "development" ? devOutputs : prodOutputs;

const serverClient = generateServerClientUsingCookies<Schema>({
  config: outputs,
  cookies,
});

export async function listBlogs() {
  const { data, errors } = await serverClient.models.Blog.list({
    authMode: "iam",
  });

  if (errors?.length) {
    throw new Error(errors.map((error) => error.message).join(", "));
  }

  return data;
}

export async function getBlogBySlug(slug: string) {
  const { data, errors } = await serverClient.models.Blog.listBlogsBySlug(
    { slug },
    {
      authMode: "iam",
    },
  );

  if (errors?.length) {
    throw new Error(errors.map((error) => error.message).join(", "));
  }

  return data[0] ?? null;
}
