"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAuthSession } from "aws-amplify/auth";

export default function AdminSidebarBlock() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchAuthSession()
      .then((session) => {
        const cognitoGroups = session.tokens?.accessToken?.payload?.["cognito:groups"];
        const adminGroups = Array.isArray(cognitoGroups)
          ? (cognitoGroups as string[])
          : [];
        setIsAdmin(adminGroups.includes("admin"));
      })
      .catch(() => {});
  }, []);

  if (!isAdmin) return null;

  return (
    <section className="bg-surface-container rounded-xl p-8 border-l-4 border-primary">
      <h3 className="text-2xl font-bold mb-4 font-headline">Administration</h3>
      <p className="text-on-surface-variant mb-6 text-sm font-body leading-relaxed">
        If you have access, you can manage the content listed on the platform here.
      </p>
      <Link
        href="/admin/blogs"
        className="block w-full text-center primary-gradient text-on-primary font-bold py-3 rounded-lg shadow-lg shadow-primary/10"
      >
        Manage Posts
      </Link>
    </section>
  );
}
