import "server-only";

import { cache } from "react";
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
          expiresIn: 43200, // 12 hours — keeps URLs valid well beyond ISR cache TTLs
        },
      });

      return {
        url: result.url.toString(),
        expiresAt: result.expiresAt,
      };
    },
  });
}

export const resolveCoverImageUrlServer = cache(async function resolveCoverImageUrlServer(
  coverImagePath: string | null | undefined,
): Promise<string | null> {
  if (!coverImagePath) return null;
  try {
    const { url } = await resolveAmplifyImageUrlServer(coverImagePath);
    return url;
  } catch {
    return null;
  }
});

export async function getMarkdownContentServer(path: string) {
  const { url } = await resolveAmplifyImageUrlServer(path);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch markdown content from ${url}`);
  }

  return response.text();
}

const amplifyImagePattern = /!\[([^\]]*)\]\(amplify:\/\/([^)]+)\)/g;

/**
 * Replaces all amplify:// image references in markdown with pre-signed HTTPS URLs
 * using guest credentials so authenticated non-admin users can view inline images.
 */
export async function resolveMarkdownImagesServer(markdown: string): Promise<string> {
  const imagePaths = [...new Set(
    Array.from(markdown.matchAll(amplifyImagePattern), (m) => m[2])
  )];

  if (imagePaths.length === 0) return markdown;

  const resolvedEntries = await Promise.all(
    imagePaths.map(async (path) => {
      const result = await resolveAmplifyImageUrlServer(path).catch(() => null);
      return [path, result?.url ?? null] as const;
    })
  );

  let resolved = markdown;
  for (const [path, url] of resolvedEntries) {
    if (url) {
      resolved = resolved.replaceAll(`amplify://${path}`, url);
    }
  }

  return resolved;
}
