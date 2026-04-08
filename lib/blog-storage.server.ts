import "server-only";

import { getUrl } from "aws-amplify/storage/server";
import { runWithAmplifyServerContext } from "@/lib/amplifyServerUtils";
import { getServerAmplifyOutputs } from "@/lib/amplify-outputs.server";
import { getAmplifyStorageConfig } from "@/lib/amplify-outputs.shared";

const storageConfig = getAmplifyStorageConfig(getServerAmplifyOutputs());

const BLOG_STORAGE_BUCKET = {
  bucketName: storageConfig.bucket_name,
  region: storageConfig.aws_region,
};

// Empty cookie store — causes runWithAmplifyServerContext to use guest/unauthenticated
// Identity Pool credentials. Blog content (blogs/*) is publicly readable by guests, so
// this avoids 403s for authenticated non-admin users whose Cognito role may lack S3 access.
const guestCookies = () =>
  ({
    get: () => undefined,
    getAll: () => [],
    has: () => false,
    size: 0,
    [Symbol.iterator]: function* () {},
  }) as unknown as ReturnType<typeof import("next/headers")["cookies"]>;

export async function resolveAmplifyImageUrlServer(path: string) {
  return runWithAmplifyServerContext({
    nextServerContext: { cookies: guestCookies },
    operation: async (contextSpec) => {
      const result = await getUrl(contextSpec, {
        path,
        options: {
          bucket: BLOG_STORAGE_BUCKET,
          validateObjectExistence: true,
          expiresIn: 1800, // 30 minutes; STS credentials can cap URL lifetime below requested value
        },
      });

      return {
        url: result.url.toString(),
        expiresAt: result.expiresAt,
      };
    },
  });
}

export async function resolveCoverImageUrlServer(
  coverImagePath: string | null | undefined,
): Promise<string | null> {
  if (!coverImagePath) return null;
  try {
    const { url } = await resolveAmplifyImageUrlServer(coverImagePath);
    return url;
  } catch {
    return null;
  }
}

export async function getMarkdownContentServer(path: string) {
  const { url } = await resolveAmplifyImageUrlServer(path);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch markdown content from ${url}`);
  }

  return response.text();
}

/**
 * Reads markdown content from a draft S3 path using the authenticated request cookies.
 * Use this in admin server components where the path is under `drafts/` — those objects
 * require Identity Pool credentials tied to the admin's Cognito session, not guest access.
 */
export async function getMarkdownContentServerAuthenticated(path: string) {
  const { cookies } = await import("next/headers");
  const { url } = await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec) => {
      const result = await getUrl(contextSpec, {
        path,
        options: {
          bucket: BLOG_STORAGE_BUCKET,
          validateObjectExistence: true,
          expiresIn: 300, // short TTL — admin-only, not cached
        },
      });
      return { url: result.url.toString() };
    },
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch draft markdown content from ${url}`);
  }

  return response.text();
}

/**
 * Returns a stable server-side proxy URL for an S3 image path.
 * The proxy route (/api/image) generates a fresh presigned URL on each browser request,
 * so this URL never expires and can safely be embedded in cached HTML.
 */
export function getProxyImageUrl(path: string): string {
  return `/api/image?path=${encodeURIComponent(path)}`;
}

const amplifyImagePattern = /!\[([^\]]*)\]\(amplify:\/\/([^)]+)\)/g;

/**
 * Replaces all amplify:// image references in markdown with proxy URLs.
 * Proxy URLs are stable and never expire, so the cached markdown is always valid.
 */
export function resolveMarkdownImagesServer(markdown: string): string {
  const imagePaths = [...new Set(
    Array.from(markdown.matchAll(amplifyImagePattern), (m) => m[2])
  )];

  if (imagePaths.length === 0) return markdown;

  let resolved = markdown;
  for (const path of imagePaths) {
    resolved = resolved.replaceAll(`amplify://${path}`, getProxyImageUrl(path));
  }

  return resolved;
}
