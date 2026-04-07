import "server-only";

import { getServerAmplifyOutputs } from "@/lib/amplify-outputs.server";
import { normalizeBlogPublishedAt, type Blog } from "@/lib/blog-types";
import type { UserProfile } from "@/lib/profile-types";

const outputs = getServerAmplifyOutputs();
const dataConfig = (outputs as unknown as { data: { url: string; api_key: string } }).data;
const APPSYNC_URL = dataConfig.url;
const APPSYNC_API_KEY = dataConfig.api_key;

const BLOG_FIELDS = `
  blogId
  title
  slug
  excerpt
  tags
  contentPath
  coverImagePath
  authorName
  authorUserId
  status
  publishedAt
`;

const PROFILE_FIELDS = `
  userId
  username
  displayName
  bio
  avatarPath
  twitterUrl
  instagramUrl
  githubUrl
  websiteUrl
`;

async function appsyncFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(APPSYNC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": APPSYNC_API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`AppSync request failed: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as {
    data?: T;
    errors?: { message: string }[];
  };

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(", "));
  }

  return json.data as T;
}

export async function fetchPublishedBlogsPublic(limit?: number): Promise<Blog[]> {
  const data = await appsyncFetch<{
    listBlogsByStatus: { items: Blog[] };
  }>(
    `query ListBlogsByStatus($limit: Int) {
      listBlogsByStatus(status: "PUBLISHED", sortDirection: DESC, limit: $limit) {
        items { ${BLOG_FIELDS} }
      }
    }`,
    { limit: limit ?? null },
  );
  return data.listBlogsByStatus.items.map(normalizeBlogPublishedAt);
}

export async function fetchAllPublishedBlogsPublic(): Promise<Blog[]> {
  const data = await appsyncFetch<{
    listBlogsByStatus: { items: Blog[] };
  }>(
    `query ListAllPublishedBlogs {
      listBlogsByStatus(status: "PUBLISHED", sortDirection: DESC) {
        items { ${BLOG_FIELDS} }
      }
    }`,
  );
  return data.listBlogsByStatus.items.map(normalizeBlogPublishedAt);
}

export async function fetchBlogBySlugPublic(slug: string): Promise<Blog | null> {
  const data = await appsyncFetch<{
    listBlogsBySlug: { items: Blog[] };
  }>(
    `query ListBlogsBySlug($slug: String!) {
      listBlogsBySlug(slug: $slug) {
        items { ${BLOG_FIELDS} }
      }
    }`,
    { slug },
  );
  const blog = data.listBlogsBySlug.items[0];
  return blog ? normalizeBlogPublishedAt(blog) : null;
}

export async function fetchPublishedBlogsByAuthorPublic(authorUserId: string): Promise<Blog[]> {
  const data = await appsyncFetch<{
    listBlogsByAuthorUserId: { items: Blog[] };
  }>(
    `query ListBlogsByAuthorUserId($authorUserId: String!) {
      listBlogsByAuthorUserId(authorUserId: $authorUserId, sortDirection: DESC) {
        items { ${BLOG_FIELDS} }
      }
    }`,
    { authorUserId },
  );
  return data.listBlogsByAuthorUserId.items
    .filter((b) => b.status === "PUBLISHED")
    .map(normalizeBlogPublishedAt);
}

export async function fetchProfileByUserIdPublic(userId: string): Promise<UserProfile | null> {
  const data = await appsyncFetch<{
    getUserProfile: UserProfile | null;
  }>(
    `query GetUserProfile($userId: ID!) {
      getUserProfile(userId: $userId) { ${PROFILE_FIELDS} }
    }`,
    { userId },
  );
  return data.getUserProfile;
}

export async function fetchProfileByUsernamePublic(username: string): Promise<UserProfile | null> {
  const data = await appsyncFetch<{
    getUserProfileByUsername: { items: UserProfile[] };
  }>(
    `query GetUserProfileByUsername($username: String!) {
      getUserProfileByUsername(username: $username) {
        items { ${PROFILE_FIELDS} }
      }
    }`,
    { username },
  );
  return data.getUserProfileByUsername.items[0] ?? null;
}
