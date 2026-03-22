import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { getServerAmplifyOutputs } from "@/lib/amplify-outputs.server";

const outputs = getServerAmplifyOutputs();

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs,
});
