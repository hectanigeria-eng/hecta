import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

const siteTitle = "Hecta — Rent or buy a home you can trust";
const siteDescription =
  "Find verified rentals and homes for sale across Lagos. Verified landlords, real listings, smart search, and auto-generated tenancy agreements — no agents, no scams.";

export const metadata: Metadata = {
  // Resolves relative OG/icon URLs to absolute ones. Set NEXT_PUBLIC_SITE_URL
  // to the production domain in Coolify; falls back to localhost in dev.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: siteTitle,
  description: siteDescription,
  icons: {
    icon: "/assets/Hecta%20fav.png",
    apple: "/assets/Hecta%20fav.png",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
    images: [
      {
        url: "/assets/hecta-ogimage.jpg",
        width: 1200,
        height: 630,
        alt: "Hecta — verified rentals and homes for sale across Lagos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/assets/hecta-ogimage.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", inter.variable, bricolage.variable)}
    >
      <body className="bg-paper text-ink font-sans antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
