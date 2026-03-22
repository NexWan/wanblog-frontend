import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  defaultAmplifyOutputs,
  type AmplifyOutputs,
} from "@/lib/amplify-outputs.shared";

export function getServerAmplifyOutputs(): AmplifyOutputs {
  if (process.env.NEXT_PUBLIC_ENV !== "development") {
    return defaultAmplifyOutputs;
  }

  const devOutputsPath = path.join(process.cwd(), "amplify_outputs_dev.json");

  if (!existsSync(devOutputsPath)) {
    return defaultAmplifyOutputs;
  }

  try {
    return JSON.parse(readFileSync(devOutputsPath, "utf-8")) as AmplifyOutputs;
  } catch (error) {
    console.error("Failed to load amplify_outputs_dev.json, falling back to amplify_outputs.json", error);
    return defaultAmplifyOutputs;
  }
}
