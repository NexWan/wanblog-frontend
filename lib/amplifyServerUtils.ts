import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import prodOutputs from "@/amplify_outputs.json";
import devOutputs from "@/amplify_outputs_dev.json";

const outputs =
  process.env.NEXT_PUBLIC_ENV === "development" ? devOutputs : prodOutputs;

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs,
});
