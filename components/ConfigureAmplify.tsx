"use client";

import { Amplify } from "aws-amplify";
import type { AmplifyOutputs } from "@/lib/amplify-outputs.shared";

let hasConfiguredAmplify = false;
let configuredFingerprint: string | null = null;

const AMPLIFY_FINGERPRINT_STORAGE_KEY = "wanblog-amplify-config-fingerprint";

function getOutputsFingerprint(outputs: AmplifyOutputs) {
  return JSON.stringify({
    userPoolId: outputs.auth?.user_pool_id ?? null,
    userPoolClientId: outputs.auth?.user_pool_client_id ?? null,
    identityPoolId: outputs.auth?.identity_pool_id ?? null,
    region: outputs.auth?.aws_region ?? outputs.data?.aws_region ?? null,
    dataUrl: outputs.data?.url ?? null,
  });
}

function clearStorageKeys(storage: Storage) {
  const keysToRemove: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (!key) {
      continue;
    }

    if (
      key.startsWith("CognitoIdentityServiceProvider.") ||
      key.startsWith("aws-amplify") ||
      key.startsWith("amplify-") ||
      key.includes("federatedInfo") ||
      key.includes("identity-id") ||
      key.includes("identityId")
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key));
}

function clearStaleAmplifyCache() {
  try {
    clearStorageKeys(window.localStorage);
    clearStorageKeys(window.sessionStorage);
  } catch (error) {
    console.warn("Failed to clear stale Amplify auth cache after config change.", error);
  }
}

export default function ConfigureAmplifyClientSide({
  outputs,
}: {
  outputs: AmplifyOutputs;
}) {
  const nextFingerprint = getOutputsFingerprint(outputs);

  if (!hasConfiguredAmplify || configuredFingerprint !== nextFingerprint) {
    try {
      const previousFingerprint = window.localStorage.getItem(AMPLIFY_FINGERPRINT_STORAGE_KEY);

      if (previousFingerprint && previousFingerprint !== nextFingerprint) {
        clearStaleAmplifyCache();
      }

      window.localStorage.setItem(AMPLIFY_FINGERPRINT_STORAGE_KEY, nextFingerprint);
    } catch (error) {
      console.warn("Failed to persist Amplify config fingerprint.", error);
    }

    Amplify.configure(outputs, { ssr: true });
    hasConfiguredAmplify = true;
    configuredFingerprint = nextFingerprint;
  }

  return null;
}
