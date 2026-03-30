import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { appCssVariables, designTokens } from "@/lib/design-tokens";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VoteWatch",
  description: "A map-first UK political transparency website.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={ibmPlexSans.className}
        style={{
          ...appCssVariables(),
          fontSize: designTokens.typography.body,
        }}
      >
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f7f6f1_45%,#efede5_100%)]">
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
