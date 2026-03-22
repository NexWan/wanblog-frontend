import { generateClient } from "aws-amplify/data";
import type { Blog, BlogStatus, CreateBlogInput, DeleteBlogInput } from "@/lib/blog-types";

export type { Blog, BlogStatus, CreateBlogInput, DeleteBlogInput };

type BlogClient = {
  models: {
    Blog: {
      create: (
        input: CreateBlogInput | Blog,
        options: { authMode: "userPool" }
      ) => Promise<{ data: Blog | null; errors?: { message: string }[] }>;
      update: (
        input: Partial<CreateBlogInput> & { blogId: string },
        options: { authMode: "userPool" }
      ) => Promise<{ data: Blog | null; errors?: { message: string }[] }>;
      delete: (
        input: DeleteBlogInput,
        options: { authMode: "userPool" }
      ) => Promise<{ data: DeleteBlogInput | null; errors?: { message: string }[] }>;
    };
  };
};

const client = generateClient() as unknown as BlogClient;

export async function postBlog(blog: Blog) {
  const { data, errors } = await client.models.Blog.create({
    ...blog,
  }, {
    authMode: "userPool",
  });

  return { data: data as Blog | null, errors };
}

export async function updateBlog(blogId: string, updates: Partial<CreateBlogInput>) {
  const { data, errors } = await client.models.Blog.update({
    blogId,
    ...updates,
  }, {
    authMode: "userPool",
  });

  if (errors?.length) {
    throw new Error(errors.map((error: { message: string }) => error.message).join(", "));
  }

  return { data: data as Blog | null, errors };
}

export async function createBlog(blog: CreateBlogInput) {
  const { data, errors } = await client.models.Blog.create(blog, {
    authMode: "userPool",
  });

  if (errors?.length) {
    throw new Error(errors.map((error: { message: string }) => error.message).join(", "));
  }

  return data as Blog | null;
}

export async function deleteBlog(blog: DeleteBlogInput) {
  const { data, errors } = await client.models.Blog.delete(blog, {
    authMode: "userPool",
  });

  if (errors?.length) {
    throw new Error(errors.map((error: { message: string }) => error.message).join(", "));
  }

  return data as DeleteBlogInput | null;
}
