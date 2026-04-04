export type UserProfile = {
  userId: string;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatarPath?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CreateProfileInput = {
  userId: string;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatarPath?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
};

export type UpdateProfileInput = {
  userId: string;
  displayName?: string | null;
  bio?: string | null;
  avatarPath?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
};
