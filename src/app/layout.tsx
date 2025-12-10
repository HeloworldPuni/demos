import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "~/app/globals.css";
import Providers from "~/app/providers";
import { METADATA } from "~/lib/utils";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: METADATA.name,
  openGraph: {
    title: METADATA.name,
    description: METADATA.description,
    url: METADATA.homeUrl,
    siteName: METADATA.name
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/onchainkit.css" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
