import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../wanblog-backend/amplify/data/resource";

export type Blog = Schema["Blog"]["type"];
export type BlogStatus = Blog["status"];
export type CreateBlogInput = Schema["Blog"]["createType"];

const client = generateClient<Schema>();

export async function postBlog(blog: Blog) {
  const { data, errors } = await client.models.Blog.create({
    ...blog,
  }, {
    authMode: "userPool",
  });

  return { data, errors };
}

export async function updateBlog(blogId: string, updates: Partial<CreateBlogInput>) {
  const { data, errors } = await client.models.Blog.update({
    blogId,
    ...updates,
  }, {
    authMode: "userPool",
  });

  if (errors?.length) {
    throw new Error(errors.map((error) => error.message).join(", "));
  }

  return { data, errors };
}

export async function createBlog(blog: CreateBlogInput) {
  const { data, errors } = await client.models.Blog.create(blog, {
    authMode: "userPool",
  });

  if (errors?.length) {
    throw new Error(errors.map((error) => error.message).join(", "));
  }

  return data;
}
