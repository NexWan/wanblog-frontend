import "server-only";

import { cookies } from "next/headers";
import { getUrl } from "aws-amplify/storage/server";
import { runWithAmplifyServerContext } from "@/lib/amplifyServerUtils";
import prodOutputs from "@/amplify_outputs.json";
import devOutputs from "@/amplify_outputs_dev.json";

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
