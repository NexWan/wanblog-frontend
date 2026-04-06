import prodOutputs from "@/amplify_outputs.json";

export type AmplifyOutputs = typeof prodOutputs;

declare global {
  interface Window {
    __WANBLOG_AMPLIFY_OUTPUTS__?: AmplifyOutputs;
  }
}

export const defaultAmplifyOutputs: AmplifyOutputs = prodOutputs;

export function getClientAmplifyOutputs(): AmplifyOutputs {
  if (typeof window === "undefined") {
    return defaultAmplifyOutputs;
  }

  return window.__WANBLOG_AMPLIFY_OUTPUTS__ ?? defaultAmplifyOutputs;
}

export function getAmplifyStorageConfig(outputs: AmplifyOutputs = defaultAmplifyOutputs) {
  const storage = (outputs as unknown as {
    storage: {
      bucket_name: string;
      aws_region: string;
    };
  }).storage;

  if (!storage) {
    throw new Error("Amplify storage configuration is missing from the active outputs file.");
  }

  return storage;
}
