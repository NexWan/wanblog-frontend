import "server-only";

import { cookies } from "next/headers";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/api";
import { getServerAmplifyOutputs } from "@/lib/amplify-outputs.server";
import { normalizeBlogPublishedAt, type Blog } from "@/lib/blog-types";

const outputs = getServerAmplifyOutputs();

type BlogServerClient = {
  models: {
    Blog: {
      list: (options: { authMode: "apiKey" | "userPool" }) => Promise<{
        data: Blog[];
        errors?: { message: string }[];
      }>;
      listBlogsBySlug: (
        input: { slug: string },
        options: { authMode: "apiKey" | "userPool" }
      ) => Promise<{ data: Blog[]; errors?: { message: string }[] }>;
      listBlogsByStatus: (
        input: { status: string },
        options: { authMode: "apiKey" | "userPool"; sortDirection?: "ASC" | "DESC"; limit?: number }
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

export async function listLatestPublishedBlogs(limit = 4) {
  const { data, errors } = await serverClient.models.Blog.listBlogsByStatus(
    { status: "PUBLISHED" },
    { authMode: "apiKey", sortDirection: "DESC", limit },
  );

  await assertNoErrors(errors);

  return (data as Blog[]).map((blog) => normalizeBlogPublishedAt(blog));
}

export async function listBlogsPublic() {
  const { data, errors } = await serverClient.models.Blog.list({
    authMode: "apiKey",
  });

  await assertNoErrors(errors);

  return (data as Blog[]).map((blog) => normalizeBlogPublishedAt(blog));
}

export async function listBlogsForAdmin() {
  const { data, errors } = await serverClient.models.Blog.list({
    authMode: "userPool",
  });

  await assertNoErrors(errors);

  return (data as Blog[]).map((blog) => normalizeBlogPublishedAt(blog));
}

export async function getBlogBySlugPublic(slug: string) {
  const { data, errors } = await serverClient.models.Blog.listBlogsBySlug(
    { slug },
    { authMode: "apiKey" },
  );

  await assertNoErrors(errors);

  return data[0] ? normalizeBlogPublishedAt(data[0] as Blog) : null;
}

export async function getBlogBySlugForAdmin(slug: string) {
  const { data, errors } = await serverClient.models.Blog.listBlogsBySlug(
    { slug },
    { authMode: "userPool" },
  );

  await assertNoErrors(errors);

  return data[0] ? normalizeBlogPublishedAt(data[0] as Blog) : null;
}

export async function getBlogByIdForAdmin(blogId: string): Promise<Blog | null> {
  const { data, errors } = await serverClient.models.Blog.get(
    { blogId },
    { authMode: "userPool" },
  );

  await assertNoErrors(errors);

  if (Array.isArray(data)) {
    return data[0] ? normalizeBlogPublishedAt(data[0] as Blog) : null;
  }

  return data ? normalizeBlogPublishedAt(data as Blog) : null;
}
