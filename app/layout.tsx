import type { Metadata } from "next";
import "./globals.css";

import ConfigureAmplifyClientSide from "@/components/ConfigureAmplify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getServerAmplifyOutputs } from "@/lib/amplify-outputs.server";

const themeScript = `
  (() => {
    try {
      const storageKey = "wanblog-theme";
      const storedTheme = window.localStorage.getItem(storageKey);
      const nextTheme = storedTheme === "valentine" ? "valentine" : "wanblog-dark";
      document.documentElement.setAttribute("data-theme", nextTheme);
    } catch {
      document.documentElement.setAttribute("data-theme", "wanblog-dark");
    }
  })();
`;

export const metadata: Metadata = {
  title: "WanBlog",
  description: "WanBlog frontend",
  icons: {
    icon: "/tsuchinoko.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const amplifyOutputs = getServerAmplifyOutputs();
  const amplifyOutputsScript = `window.__WANBLOG_AMPLIFY_OUTPUTS__ = ${JSON.stringify(amplifyOutputs)};`;

  return (
    <html lang="en" data-theme="wanblog-dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: amplifyOutputsScript }} />
      </head>
      <body className="antialiased font-body">
        <ConfigureAmplifyClientSide outputs={amplifyOutputs} />
        <Header />
        <div className="pt-24 min-h-[calc(100vh-80px)]">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
