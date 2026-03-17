"use client";

import { Amplify } from "aws-amplify";
import prodOutputs from "@/amplify_outputs.json";
import devOutputs from "@/amplify_outputs_dev.json";

const outputs = process.env.NEXT_PUBLIC_ENV == 'development' ? devOutputs : prodOutputs;

Amplify.configure(outputs, { ssr: true });

export default function ConfigureAmplifyClientSide() {
  return null;
}
