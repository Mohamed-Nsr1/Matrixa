import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PWAProvider, InstallPrompt, UpdateNotification, OnlineStatusIndicator } from "@/components/pwa";
import { ServiceWorkerCleanup } from "@/components/pwa/ServiceWorkerCleanup";
import { ThemeProvider } from "@/hooks/use-theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Matrixa - Study Smart, Stay Focused",
    template: "%s | Matrixa"
  },
  description: "The ultimate study companion for Egyptian high school students. Overcome ADHD time blindness, plan your studies, and achieve academic success.",
  keywords: ["Matrixa", "Study App", "Egyptian Students", "Thanaweya Amma", "ADHD", "Study Planner", "Focus Timer", "Education"],
  authors: [{ name: "Matrixa Team" }],
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: [
      { url: "/favicon.png" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Matrixa - Study Smart, Stay Focused",
    description: "The ultimate study companion for Egyptian high school students",
    type: "website",
    siteName: "Matrixa",
  },
  twitter: {
    card: "summary_large_image",
    title: "Matrixa - Study Smart, Stay Focused",
    description: "The ultimate study companion for Egyptian high school students",
  },
  // Apple Mobile Web App Meta Tags
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Matrixa",
    "mobile-web-app-capable": "yes",
    "format-detection": "telephone=no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#8b5cf6" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1625" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className="dark">
      <head>
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Apple Splash Screens - iPhone */}
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#8b5cf6" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <ThemeProvider>
          <ServiceWorkerCleanup />
          <PWAProvider>
            <div className="relative min-h-screen">
              {/* Gradient Background Orbs */}
              <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan/5 rounded-full blur-[120px]" />
              </div>
              
              {/* Main Content */}
              <div className="relative z-10">
                {children}
              </div>
            </div>
            <Toaster />
            <InstallPrompt />
            <UpdateNotification />
            <OnlineStatusIndicator />
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
