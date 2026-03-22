import type { Metadata } from "next";
import "./globals.css";

import ConfigureAmplifyClientSide from "@/components/ConfigureAmplify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="wanblog-dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased font-body">
        <ConfigureAmplifyClientSide />
        <Header />
        <div className="pt-24 min-h-[calc(100vh-80px)]">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
