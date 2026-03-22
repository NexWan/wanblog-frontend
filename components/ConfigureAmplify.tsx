"use client";

import { Amplify } from "aws-amplify";
import type { AmplifyOutputs } from "@/lib/amplify-outputs.shared";

let hasConfiguredAmplify = false;

export default function ConfigureAmplifyClientSide({
  outputs,
}: {
  outputs: AmplifyOutputs;
}) {
  if (!hasConfiguredAmplify) {
    Amplify.configure(outputs, { ssr: true });
    hasConfiguredAmplify = true;
  }

  return null;
}
