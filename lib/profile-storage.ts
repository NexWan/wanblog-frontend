import { getUrl, uploadData } from "aws-amplify/storage";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  getAmplifyStorageConfig,
  getClientAmplifyOutputs,
} from "@/lib/amplify-outputs.shared";

const storageConfig = getAmplifyStorageConfig(getClientAmplifyOutputs());

const PROFILE_STORAGE_BUCKET = {
  bucketName: storageConfig.bucket_name,
  region: storageConfig.aws_region,
};

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
}

export function buildAvatarPath(identityId: string, fileName: string): string {
  const uuid = crypto.randomUUID();
  const safe = sanitizeFileName(fileName);
  return `profiles/avatar/${identityId}/${uuid}-${safe}`;
}

export async function uploadAvatar(file: File): Promise<{ path: string }> {
  const session = await fetchAuthSession();
  const identityId = session.identityId;

  if (!identityId) {
    throw new Error("No identity ID available. Make sure you are signed in.");
  }

  const path = buildAvatarPath(identityId, file.name);

  await uploadData({
    path,
    data: file,
    options: { bucket: PROFILE_STORAGE_BUCKET },
  }).result;

  return { path };
}

export async function resolveAvatarUrl(avatarPath: string): Promise<string | null> {
  try {
    const { url } = await getUrl({
      path: avatarPath,
      options: { bucket: PROFILE_STORAGE_BUCKET },
    });
    return url.href;
  } catch {
    return null;
  }
}
