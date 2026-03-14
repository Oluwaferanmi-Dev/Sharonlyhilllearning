import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sharonlyhill Learning - Healthcare Compliance Platform",
  description:
    "Comprehensive healthcare compliance assessments and learning programs. Master regulatory standards with expert-designed courses.",

  icons: {
    icon: [
      {
        url: "/cherith-logo.png",
      },
    ],
    apple: "/cherith-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/cherith-logo.png" />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
