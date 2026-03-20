"use client";

import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import '@/app/globals.css';
import Link from "next/link";

function AuthPage() {
  return (
    <main className="min-h-[calc(100vh-73px)] bg-zinc-50 px-6 py-14">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
            Authentication
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900">
            You are authenticated
          </h1>
          <p className="text-sm text-zinc-600">
            This is a placeholder post-login page for now.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
          >
            Go to landing page
          </Link>
          <Link
            href="/admin"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Test admin route
          </Link>
        </div>
      </div>
    </main>
  );
}

export default withAuthenticator(AuthPage);
