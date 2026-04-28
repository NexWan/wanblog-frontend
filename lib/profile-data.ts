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

function isConditionalRequestFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.toLowerCase().includes("conditional request failed");
}

function isSameProfile(profile: UserProfile, input: CreateProfileInput): boolean {
  return profile.userId === input.userId && profile.username === input.username;
}

async function getProfileByUsernamePublic(username: string): Promise<UserProfile | null> {
  const { data } = await client.models.UserProfile.getUserProfileByUsername(
    { username },
    { authMode: "apiKey" }
  );
  return (data[0] as UserProfile) ?? null;
}

async function getExistingProfile(input: CreateProfileInput): Promise<UserProfile | null> {
  const byUserId = await getProfileByUserIdPublic(input.userId);
  if (byUserId) return byUserId;

  return getProfileByUsernamePublic(input.username);
}

export async function createProfile(input: CreateProfileInput): Promise<UserProfile> {
  const existing = await getExistingProfile(input);
  if (existing) {
    if (isSameProfile(existing, input)) return existing;
    if (existing.userId === input.userId) {
      throw new Error("A profile already exists for this account.");
    }
    throw new Error("Username is already taken.");
  }

  try {
    const { data, errors } = await client.models.UserProfile.create(input, {
      authMode: "userPool",
    });

    if (errors?.length) {
      const message = errors.map((e) => e.message).join(", ");
      if (message.toLowerCase().includes("conditional request failed")) {
        const profile = await getExistingProfile(input);
        if (profile && isSameProfile(profile, input)) return profile;
      }
      throw new Error(message);
    }

    if (!data) throw new Error("No data returned from createProfile");

    return data as UserProfile;
  } catch (error) {
    if (isConditionalRequestFailure(error)) {
      const profile = await getExistingProfile(input);
      if (profile && isSameProfile(profile, input)) return profile;
    }
    throw error;
  }
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
