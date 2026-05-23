import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import { PageTransition } from "../src/components/PageTransition";
import { THEME_BOOT_SCRIPT } from "../src/context/ThemeContext";
import "../src/index.css";

export const metadata: Metadata = {
  title: "Third Wave Coffee",
  description:
    "Discover your perfect coffee match with AI-powered recommendations. Premium single-origin beans, essential gear, and curated bundles.",
  icons: {
    icon: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Apply the saved theme before paint to avoid FOUC on dark palettes. */}
        <script
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
        <link
          rel="preconnect"
          href="https://different-bulldog-772.convex.cloud"
          crossOrigin=""
        />
        <link
          rel="dns-prefetch"
          href="https://different-bulldog-772.convex.cloud"
        />
      </head>
      <body>
        <Providers>
          <PageTransition>{children}</PageTransition>
        </Providers>
      </body>
    </html>
  );
}
