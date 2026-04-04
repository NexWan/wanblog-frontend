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
