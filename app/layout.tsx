import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '../components/auth-provider';
import { CatalogProvider } from '../components/catalog-provider';

export const metadata: Metadata = {
  title: "Pushtidham Haveli",
  description: "A place of devotion, seva and community in Ocala, Florida. Discover Pushtidham Haveli.",
  icons: {
    icon: { url: "/favicon.ico", sizes: "16x16 32x32 48x48 64x64", type: "image/x-icon" },
    shortcut: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><AuthProvider><CatalogProvider>{children}</CatalogProvider></AuthProvider></body>
    </html>
  );
}
