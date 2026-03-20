import { fetchAuthSession } from "aws-amplify/auth/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { runWithAmplifyServerContext } from "@/lib/amplifyServerUtils";

type GroupClaim = string[] | undefined;

export async function getCurrentUserGroups() {
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchAuthSession(contextSpec),
    });

    return (session.tokens?.accessToken.payload["cognito:groups"] as GroupClaim) ?? [];
  } catch {
    return [];
  }
}

export async function isCurrentUserAdmin() {
  const groups = await getCurrentUserGroups();

  return groups.includes("admin");
}

export async function requireAdmin() {
  const groups = await getCurrentUserGroups();

  if (!groups.includes("admin")) {
    redirect("/");
  }

  return groups;
}
