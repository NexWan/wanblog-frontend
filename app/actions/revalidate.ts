"use server";

import { revalidatePath, revalidateTag } from "next/cache";

export async function revalidateBlogCache(slug: string) {
  revalidateTag("published-blogs", {});
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
}

export async function revalidateProfileCache(userId: string, username: string) {
  revalidateTag(`profile-${userId}`, {});
  revalidateTag(`profile-username-${username}`, {});
  revalidateTag(`avatar-${userId}`, {});
  revalidatePath(`/user/${username}`);
}
