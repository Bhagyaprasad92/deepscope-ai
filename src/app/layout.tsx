import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeepScope AI - Autonomous Research Agent",
  description: "Search, analyze, verify, and visualize data seamlessly with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
