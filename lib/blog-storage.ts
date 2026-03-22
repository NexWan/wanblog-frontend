import { copy, getUrl, list, uploadData } from "aws-amplify/storage";
import prodOutputs from "@/amplify_outputs.json";
import devOutputs from "@/amplify_outputs_dev.json";

export const AMPLIFY_IMAGE_PROTOCOL = "amplify://";
const outputs =
  process.env.NEXT_PUBLIC_ENV === "development" ? devOutputs : prodOutputs;

const storageConfig = (outputs as {
  storage: {
    bucket_name: string;
    aws_region: string;
  };
}).storage;

const BLOG_STORAGE_BUCKET = {
  bucketName: storageConfig.bucket_name,
  region: storageConfig.aws_region,
};

export type BlogStorageScope = "drafts" | "blogs";

export type BlogMediaItem = {
  path: string;
  scope: BlogStorageScope;
  url: string;
  altText: string;
};

type UploadBlogImageInput = {
  blogId: string;
  file: File;
  scope?: BlogStorageScope;
  altText?: string;
};

type UploadBlogMarkdownInput = {
  blogId: string;
  markdown: string;
  scope?: BlogStorageScope;
};

const amplifyImagePattern =
  /!\[([^\]]*)\]\(amplify:\/\/([^)]+)\)/g;

export function createBlogId() {
  return crypto.randomUUID();
}

export function buildBlogContentPath(blogId: string, scope: BlogStorageScope = "drafts") {
  return `${scope}/${blogId}/content/post.md`;
}

export function buildBlogImagePath({
  blogId,
  fileName,
  scope = "drafts",
}: {
  blogId: string;
  fileName: string;
  scope?: BlogStorageScope;
}) {
  const cleanName = sanitizeFilename(fileName);

  return `${scope}/${blogId}/media/${crypto.randomUUID()}-${cleanName}`;
}

export function toAmplifyImageMarkdown(path: string, altText = "Blog image") {
  return `![${escapeMarkdownText(altText)}](${AMPLIFY_IMAGE_PROTOCOL}${path})`;
}

export function extractAmplifyImagePaths(markdown: string) {
  return Array.from(markdown.matchAll(amplifyImagePattern), (match) => match[2]);
}

export function rewriteMarkdownAmplifyImagePaths(
  markdown: string,
  mapPath: (path: string) => string,
) {
  return markdown.replace(amplifyImagePattern, (_match, altText: string, path: string) => {
    return `![${altText}](${AMPLIFY_IMAGE_PROTOCOL}${mapPath(path)})`;
  });
}

export async function uploadBlogImage({
  blogId,
  file,
  scope = "drafts",
  altText,
}: UploadBlogImageInput) {
  const path = buildBlogImagePath({
    blogId,
    fileName: file.name,
    scope,
  });

  await uploadData({
    path,
    data: file,
    options: {
      bucket: BLOG_STORAGE_BUCKET,
      contentType: file.type || "application/octet-stream",
    },
  }).result;

  return {
    path,
    markdown: toAmplifyImageMarkdown(path, altText || stripExtension(file.name)),
  };
}

export async function uploadBlogMarkdown({
  blogId,
  markdown,
  scope = "drafts",
}: UploadBlogMarkdownInput) {
  const path = buildBlogContentPath(blogId, scope);

  await uploadData({
    path,
    data: new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
    options: {
      bucket: BLOG_STORAGE_BUCKET,
      contentType: "text/markdown; charset=utf-8",
    },
  }).result;

  return { path };
}

export async function publishDraftAssets(blogId: string, draftMarkdown: string) {
  const imagePaths = Array.from(new Set(extractAmplifyImagePaths(draftMarkdown)));

  for (const draftPath of imagePaths) {
    const publishedPath = toPublishedPath(draftPath, blogId);

    if (publishedPath !== draftPath) {
      await copy({
        source: { path: draftPath, bucket: BLOG_STORAGE_BUCKET },
        destination: { path: publishedPath, bucket: BLOG_STORAGE_BUCKET },
      });
    }
  }

  const publishedMarkdown = rewriteMarkdownAmplifyImagePaths(
    draftMarkdown,
    (draftPath) => toPublishedPath(draftPath, blogId),
  );

  const { path: contentPath } = await uploadBlogMarkdown({
    blogId,
    markdown: publishedMarkdown,
    scope: "blogs",
  });

  return {
    contentPath,
    markdown: publishedMarkdown,
    imagePaths: imagePaths.map((draftPath) => toPublishedPath(draftPath, blogId)),
  };
}

export async function resolveAmplifyImageUrl(path: string) {
  const result = await getUrl({
    path,
    options: {
      bucket: BLOG_STORAGE_BUCKET,
      validateObjectExistence: true,
    },
  });

  return {
    url: result.url.toString(),
    expiresAt: result.expiresAt,
  };
}

export async function resolveMarkdownAmplifyImages(markdown: string) {
  const imagePaths = Array.from(new Set(extractAmplifyImagePaths(markdown)));
  let resolvedMarkdown = markdown;

  for (const path of imagePaths) {
    const { url } = await resolveAmplifyImageUrl(path);
    resolvedMarkdown = resolvedMarkdown.replaceAll(`${AMPLIFY_IMAGE_PROTOCOL}${path}`, url);
  }

  return resolvedMarkdown;
}

export async function listBlogImages(blogId: string): Promise<BlogMediaItem[]> {
  const scopes: BlogStorageScope[] = ["drafts", "blogs"];

  const results = await Promise.all(
    scopes.map(async (scope) => {
      const response = await list({
        path: `${scope}/${blogId}/media/`,
        options: {
          bucket: BLOG_STORAGE_BUCKET,
          listAll: true,
        },
      });

      const items = response.items.filter((item) => item.path);
      const resolvedItems = await Promise.all(
        items.map(async (item) => {
          const { url } = await resolveAmplifyImageUrl(item.path);

          return {
            path: item.path,
            scope,
            url,
            altText: stripExtension(item.path.split("/").pop() ?? "Blog image"),
          };
        }),
      );

      return resolvedItems;
    }),
  );

  return results
    .flat()
    .sort((left, right) => left.path.localeCompare(right.path));
}

export async function getMarkdownContent(path: string) {
  const { url } = await resolveAmplifyImageUrl(path);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch markdown content from ${url}`);
  }

  return await response.text();
}

function toPublishedPath(path: string, blogId: string) {
  return path.replace(`drafts/${blogId}/`, `blogs/${blogId}/`);
}

function sanitizeFilename(fileName: string) {
  const trimmed = fileName.trim().toLowerCase();
  const normalized = trimmed.replace(/\s+/g, "-").replace(/[^a-z0-9._-]/g, "");

  return normalized || "image";
}

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}

function escapeMarkdownText(value: string) {
  return value.replace(/[[\]]/g, "");
}
