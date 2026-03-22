import type { Metadata } from "next";
import "./globals.css";

import ConfigureAmplifyClientSide from "@/components/ConfigureAmplify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
    <html lang="en">
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
