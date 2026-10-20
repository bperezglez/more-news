import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { themeInitScript } from "@/components/theme-toggle";
import { assetUrl } from "@/lib/site-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "More News — Titulares personal",
  description:
    "Agregador personal de titulares de El País, El Confidencial, 20 Minutos, ABC y más.",
  manifest: assetUrl("/manifest.webmanifest"),
  appleWebApp: {
    capable: true,
    title: "More News",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: assetUrl("/icons/icon-192.png"), sizes: "192x192", type: "image/png" },
      { url: assetUrl("/icons/icon.svg"), type: "image/svg+xml" },
    ],
    apple: assetUrl("/icons/icon-512.png"),
  },
  applicationName: "More News",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#151821" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <PwaProvider />
        {children}
      </body>
    </html>
  );
}
