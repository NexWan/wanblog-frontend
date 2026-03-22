import "server-only";

import { cookies } from "next/headers";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/api";
import { getServerAmplifyOutputs } from "@/lib/amplify-outputs.server";
import type { Schema } from "../../wanblog-backend/amplify/data/resource";

const outputs = getServerAmplifyOutputs();

const serverClient = generateServerClientUsingCookies<Schema>({
  config: outputs,
  cookies,
});

async function assertNoErrors(
  errors: { message: string }[] | undefined,
) {
  if (errors?.length) {
    throw new Error(errors.map((error) => error.message).join(", "));
  }
}

export async function listBlogsPublic() {
  const { data, errors } = await serverClient.models.Blog.list({
    authMode: "iam",
  });

  await assertNoErrors(errors);

  return data;
}

export async function listBlogsForAdmin() {
  const { data, errors } = await serverClient.models.Blog.list({
    authMode: "userPool",
  });

  await assertNoErrors(errors);

  return data;
}

export async function getBlogBySlugPublic(slug: string) {
  const { data, errors } = await serverClient.models.Blog.listBlogsBySlug(
    { slug },
    {
      authMode: "iam",
    },
  );

  await assertNoErrors(errors);

  return data[0] ?? null;
}

export async function getBlogBySlugForAdmin(slug: string) {
  const { data, errors } = await serverClient.models.Blog.listBlogsBySlug(
    { slug },
    {
      authMode: "userPool",
    },
  );

  await assertNoErrors(errors);

  return data[0] ?? null;
}

export async function getBlogByIdForAdmin(blogId: string) {
  const { data, errors } = await serverClient.models.Blog.get(
    { blogId },
    {
      authMode: "userPool",
    },
  );

  await assertNoErrors(errors);

  return data ?? null;
}
