import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppWidget from "@/components/ui/WhatsAppWidget";
import StructuredData from "@/components/seo/StructuredData";
import { GoogleTracking } from "@/components/analytics/GoogleTracking";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sweetlife.cafe"),
  title: {
    default: "Sweet Life Cafe | Korean Cafe & Restaurant in Newry",
    template: "%s | Sweet Life Cafe",
  },
  description: "Sweet Life Cafe - Authentic Korean cuisine, Bingsu, Bubble Tea, specialty coffee, sushi, and more in the heart of Newry. Order online for pickup or delivery.",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "cafe newry",
    "korean food newry",
    "bingsu ireland",
    "bubble tea newry",
    "breakfast newry",
    "lunch newry",
    "sushi newry",
    "coffee shop newry",
    "sweet life cafe",
  ],
  authors: [{ name: "Sweet Life Cafe" }],
  openGraph: {
    title: "Sweet Life Cafe | Korean Cafe & Restaurant in Newry",
    description: "Authentic Korean cuisine, Bingsu, Bubble Tea, specialty coffee, and more. Order online or visit us at 12 Monaghan St, Newry.",
    url: "https://sweetlife.cafe",
    siteName: "Sweet Life Cafe",
    locale: "en_GB",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sweet Life Cafe | Korean Cafe & Restaurant in Newry",
    description: "Authentic Korean cuisine, Bingsu, Bubble Tea, specialty coffee, and more in Newry.",
    images: ["https://sweetlife.cafe/SweetLifeCafe_Hero_1.webp"],
  },
  robots: {
    index: true,
    follow: true,
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
        <link
          rel="preload"
          href="/SweetLifeCafe_Hero_1.webp"
          as="image"
          type="image/webp"
          fetchPriority="high"
        />
        <StructuredData />
      </head>
      <body className={`${plusJakartaSans.variable} ${playfairDisplay.variable} font-sans antialiased`}>
        <GoogleTracking>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow pt-16">{children}</main>
            <Footer />
            <WhatsAppWidget />
          </div>
        </GoogleTracking>
        {/* explicit mode: auto would also collect on preview deployments (they run production bundles) */}
        <Analytics mode={process.env.VERCEL_ENV === "production" ? "production" : "development"} />
      </body>
    </html>
  );
}
