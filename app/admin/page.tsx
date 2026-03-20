import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  const groups = await requireAdmin();

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-900">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Protected Route
          </p>
          <h1 className="text-3xl font-semibold">Admin dashboard</h1>
          <p className="text-sm text-zinc-600">
            You can see this page because your access token contains the
            <code className="ml-1 rounded bg-zinc-100 px-2 py-1 text-xs">
              admin
            </code>
            group.
          </p>
        </div>

        <div className="rounded-xl bg-zinc-100 p-4">
          <p className="text-sm text-zinc-600">Current Cognito groups</p>
          <p className="mt-2 font-mono text-sm">{groups.join(", ") || "none"}</p>
        </div>

        <Link
          href="/"
          className="inline-flex w-fit rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
