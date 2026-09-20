import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Opaline UI", template: "%s — Opaline UI" },
  description: "The source-first interface system behind Spar.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
