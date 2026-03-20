import Link from "next/link";
import { getCurrentUserGroups, isCurrentUserAdmin } from "@/lib/auth";

export default async function Home() {
  const [groups, admin] = await Promise.all([
    getCurrentUserGroups(),
    isCurrentUserAdmin(),
  ]);

  return (
    <main className="min-h-[calc(100vh-73px)] bg-zinc-50 px-6 py-14 text-zinc-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <section className="grid gap-8 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm md:grid-cols-[1.4fr_0.8fr]">
          <div className="flex flex-col gap-5">
            <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
              Placeholder landing page
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight">
              Draft ideas, publish stories, and grow WanBlog one step at a time.
            </h1>
            <p className="max-w-xl text-base leading-7 text-zinc-600">
              This is a simple landing area for now. We can turn it into your real
              homepage once you decide what content blocks, calls to action, and
              publishing flows you want.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth"
                className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
              >
                Log in
              </Link>
              <Link
                href="/admin"
                className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
              >
                Test admin route
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-100 p-6">
            <p className="text-sm font-medium text-zinc-600">Session preview</p>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-zinc-500">Groups</p>
                <p className="mt-1 font-mono text-zinc-900">
                  {groups.join(", ") || "none"}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Admin access</p>
                <p className="mt-1 font-mono text-zinc-900">
                  {admin ? "yes" : "no"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-900">Featured posts</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Placeholder space for highlighted articles or editor picks.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-900">Topics</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Placeholder categories like engineering, writing, and product notes.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-900">Newsletter</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Placeholder signup block for future audience capture.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
