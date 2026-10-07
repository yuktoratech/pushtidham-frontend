import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '../components/auth-provider';

export const metadata: Metadata = {
  title: "Pushthidham Haveli",
  description: "A place of devotion, seva and community. Discover Pushthidham Haveli.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
