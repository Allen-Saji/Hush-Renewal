import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "HushRenewal: private sealed-bid clearing for SaaS renewals",
  description:
    "Both sides submit one sealed reservation price. A neutral matcher clears the overlap and settles atomically on Canton. Neither party ever sees the other's number.",
  metadataBase: new URL("https://hushrenewal.allensaji.dev"),
  openGraph: {
    title: "HushRenewal: private sealed-bid clearing for SaaS renewals",
    description:
      "Seal one price each. A neutral matcher clears the overlap on Canton. Nobody sees the other's number.",
    type: "website",
    siteName: "HushRenewal",
  },
  twitter: {
    card: "summary_large_image",
    title: "HushRenewal: private sealed-bid clearing for SaaS renewals",
    description:
      "Seal one price each. A neutral matcher clears the overlap on Canton. Nobody sees the other's number.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased bg-bg text-ink selection:text-white">
        {children}
      </body>
    </html>
  );
}
