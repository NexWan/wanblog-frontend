import "server-only";

import { cookies } from "next/headers";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/api";
import { getServerAmplifyOutputs } from "@/lib/amplify-outputs.server";
import type { Blog } from "@/lib/blog-types";

const outputs = getServerAmplifyOutputs();

type BlogServerClient = {
  models: {
    Blog: {
      list: (options: { authMode: "iam" | "userPool" }) => Promise<{
        data: Blog[];
        errors?: { message: string }[];
      }>;
      listBlogsBySlug: (
        input: { slug: string },
        options: { authMode: "iam" | "userPool" }
      ) => Promise<{ data: Blog[]; errors?: { message: string }[] }>;
      get: (
        input: { blogId: string },
        options: { authMode: "userPool" }
      ) => Promise<{ data: Blog | Blog[] | null; errors?: { message: string }[] }>;
    };
  };
};

const serverClient = generateServerClientUsingCookies({
  config: outputs,
  cookies,
}) as unknown as BlogServerClient;

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

  return data as Blog[];
}

export async function listBlogsForAdmin() {
  const { data, errors } = await serverClient.models.Blog.list({
    authMode: "userPool",
  });

  await assertNoErrors(errors);

  return data as Blog[];
}

export async function getBlogBySlugPublic(slug: string) {
  const { data, errors } = await serverClient.models.Blog.listBlogsBySlug(
    { slug },
    {
      authMode: "iam",
    },
  );

  await assertNoErrors(errors);

  return (data[0] as Blog | undefined) ?? null;
}

export async function getBlogBySlugForAdmin(slug: string) {
  const { data, errors } = await serverClient.models.Blog.listBlogsBySlug(
    { slug },
    {
      authMode: "userPool",
    },
  );

  await assertNoErrors(errors);

  return (data[0] as Blog | undefined) ?? null;
}

export async function getBlogByIdForAdmin(blogId: string): Promise<Blog | null> {
  const { data, errors } = await serverClient.models.Blog.get(
    { blogId },
    {
      authMode: "userPool",
    },
  );

  await assertNoErrors(errors);

  if (Array.isArray(data)) {
    return (data[0] as Blog | undefined) ?? null;
  }

  return (data as Blog | null) ?? null;
}
