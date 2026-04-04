import "server-only";

import { cookies } from "next/headers";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/api";
import { getServerAmplifyOutputs } from "@/lib/amplify-outputs.server";
import type { UserProfile } from "@/lib/profile-types";

const outputs = getServerAmplifyOutputs();

type ProfileServerClient = {
  models: {
    UserProfile: {
      get: (
        input: { userId: string },
        options: { authMode: "apiKey" }
      ) => Promise<{ data: UserProfile | null; errors?: { message: string }[] }>;
      getUserProfileByUsername: (
        input: { username: string },
        options: { authMode: "apiKey" }
      ) => Promise<{ data: UserProfile[]; errors?: { message: string }[] }>;
    };
  };
};

const serverClient = generateServerClientUsingCookies({
  config: outputs,
  cookies,
}) as unknown as ProfileServerClient;

function assertNoErrors(errors: { message: string }[] | undefined) {
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }
}

export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  const { data, errors } = await serverClient.models.UserProfile.getUserProfileByUsername(
    { username },
    { authMode: "apiKey" }
  );

  assertNoErrors(errors);

  return (data[0] as UserProfile) ?? null;
}

export async function getProfileByUserIdPublic(userId: string): Promise<UserProfile | null> {
  const { data, errors } = await serverClient.models.UserProfile.get(
    { userId },
    { authMode: "apiKey" }
  );

  assertNoErrors(errors);

  return data as UserProfile | null;
}
