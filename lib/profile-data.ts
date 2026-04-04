import { generateClient } from "aws-amplify/data";
import type { CreateProfileInput, UpdateProfileInput, UserProfile } from "@/lib/profile-types";

type ProfileClient = {
  models: {
    UserProfile: {
      create: (
        input: CreateProfileInput,
        options: { authMode: "userPool" }
      ) => Promise<{ data: UserProfile | null; errors?: { message: string }[] }>;
      update: (
        input: UpdateProfileInput,
        options: { authMode: "userPool" }
      ) => Promise<{ data: UserProfile | null; errors?: { message: string }[] }>;
      get: (
        input: { userId: string },
        options: { authMode: "userPool" | "apiKey" }
      ) => Promise<{ data: UserProfile | null; errors?: { message: string }[] }>;
      getUserProfileByUsername: (
        input: { username: string },
        options: { authMode: "apiKey" }
      ) => Promise<{ data: UserProfile[]; errors?: { message: string }[] }>;
    };
  };
};

const client = generateClient() as unknown as ProfileClient;

async function isUsernameTaken(username: string): Promise<boolean> {
  const { data } = await client.models.UserProfile.getUserProfileByUsername(
    { username },
    { authMode: "apiKey" }
  );
  return data.length > 0;
}

export async function createProfile(input: CreateProfileInput): Promise<UserProfile> {
  const taken = await isUsernameTaken(input.username);
  if (taken) throw new Error("Username is already taken.");

  const { data, errors } = await client.models.UserProfile.create(input, {
    authMode: "userPool",
  });

  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }

  if (!data) throw new Error("No data returned from createProfile");

  return data as UserProfile;
}

export async function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
  const { data, errors } = await client.models.UserProfile.update(input, {
    authMode: "userPool",
  });

  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }

  if (!data) throw new Error("No data returned from updateProfile");

  return data as UserProfile;
}

export async function getProfileByUserId(userId: string): Promise<UserProfile | null> {
  const { data, errors } = await client.models.UserProfile.get(
    { userId },
    { authMode: "userPool" }
  );

  if (errors?.length) {
    return null;
  }

  return data as UserProfile | null;
}

export async function getProfileByUserIdPublic(userId: string): Promise<UserProfile | null> {
  const { data } = await client.models.UserProfile.get(
    { userId },
    { authMode: "apiKey" }
  );

  return data as UserProfile | null;
}
