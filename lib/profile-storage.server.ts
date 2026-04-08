import "server-only";

import { getUrl } from "aws-amplify/storage/server";
import { runWithAmplifyServerContext } from "@/lib/amplifyServerUtils";
import { getServerAmplifyOutputs } from "@/lib/amplify-outputs.server";
import { getAmplifyStorageConfig } from "@/lib/amplify-outputs.shared";

const storageConfig = getAmplifyStorageConfig(getServerAmplifyOutputs());

const PROFILE_STORAGE_BUCKET = {
  bucketName: storageConfig.bucket_name,
  region: storageConfig.aws_region,
};

// Use guest credentials — profiles/avatar/{entity_id}/* allows guest reads.
// Avoids 403s for authenticated non-owner users whose Cognito role lacks access.
const guestCookies = () =>
  ({
    get: () => undefined,
    getAll: () => [],
    has: () => false,
    size: 0,
    [Symbol.iterator]: function* () {},
  }) as unknown as ReturnType<typeof import("next/headers")["cookies"]>;

export async function resolveAvatarUrlServer(
  avatarPath: string | null | undefined,
): Promise<string | null> {
  if (!avatarPath) return null;
  try {
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies: guestCookies },
      operation: (contextSpec) =>
        getUrl(contextSpec, {
          path: avatarPath,
          options: { bucket: PROFILE_STORAGE_BUCKET, expiresIn: 1800 }, // 30 minutes
        }),
    });
    return result.url.toString();
  } catch {
    return null;
  }
}
