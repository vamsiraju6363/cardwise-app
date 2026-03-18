import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "CardWise — Use the Right Card Every Time",
    template: "%s | CardWise",
  },
  description:
    "CardWise ranks your credit cards by reward rate for any store, so you always earn the most cashback or points.",
  openGraph: {
    title: "CardWise — Use the Right Card Every Time",
    description:
      "CardWise ranks your credit cards by reward rate for any store, so you always earn the most cashback or points.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CardWise — Use the Right Card Every Time",
    description:
      "CardWise ranks your credit cards by reward rate for any store, so you always earn the most cashback or points.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
