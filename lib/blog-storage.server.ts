import "server-only";

import { cookies } from "next/headers";
import { getUrl } from "aws-amplify/storage/server";
import { runWithAmplifyServerContext } from "@/lib/amplifyServerUtils";
import { getServerAmplifyOutputs } from "@/lib/amplify-outputs.server";
import { getAmplifyStorageConfig } from "@/lib/amplify-outputs.shared";

const storageConfig = getAmplifyStorageConfig(getServerAmplifyOutputs());

const BLOG_STORAGE_BUCKET = {
  bucketName: storageConfig.bucket_name,
  region: storageConfig.aws_region,
};

export async function resolveAmplifyImageUrlServer(path: string) {
  return runWithAmplifyServerContext({
    nextServerContext: { cookies },
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

export async function getMarkdownContentServer(path: string) {
  const { url } = await resolveAmplifyImageUrlServer(path);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch markdown content from ${url}`);
  }

  return response.text();
}
