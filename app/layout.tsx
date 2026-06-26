import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWAInstallProvider } from "@/components/pwa-install";

export const metadata: Metadata = {
  title: "MUVA Mobility V1 — Fleet Insights",
  description: "Transport Fleet Operations & Passenger Loyalty Management Platform for CityView Katsina.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F8A5F" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="antialiased min-h-screen bg-surface">
        <PWAInstallProvider>
          {children}
        </PWAInstallProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) {
                      console.log('ServiceWorker registered:', reg.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed:', err);
                    }
                  );
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
