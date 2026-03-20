import { fetchUserAttributes } from "aws-amplify/auth/server";
import Link from "next/link";
import { cookies } from "next/headers";
import { runWithAmplifyServerContext } from "@/lib/amplifyServerUtils";
import { getCurrentUserGroups, isCurrentUserAdmin } from "@/lib/auth";

export default async function Home() {
  const [user, groups, admin] = await Promise.all([
    runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => fetchUserAttributes(contextSpec),
    }),
    getCurrentUserGroups(),
    isCurrentUserAdmin(),
  ]);

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-900">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-zinc-600">
            Welcome {user?.preferred_username}
          </p>
          <h1 className="text-3xl font-semibold">Auth debug home</h1>
          <p className="text-sm text-zinc-600">
            This page reads your Cognito claims on the server so we can verify
            access control cleanly.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-zinc-100 p-4">
            <p className="text-sm text-zinc-600">Groups</p>
            <p className="mt-2 font-mono text-sm">{groups.join(", ") || "none"}</p>
          </div>
          <div className="rounded-xl bg-zinc-100 p-4">
            <p className="text-sm text-zinc-600">Admin access</p>
            <p className="mt-2 font-mono text-sm">{admin ? "yes" : "no"}</p>
          </div>
        </div>

        <Link
          href="/admin"
          className="inline-flex w-fit rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Visit admin test route
        </Link>
      </div>
    </main>
  );
}
