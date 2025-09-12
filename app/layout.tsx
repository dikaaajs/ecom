import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/stack/navbar";
import AuthSessionProvider from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Pixel Perfection",
  description: "next level pixel merch",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`overflow-x-hidden antialiased`}>
        <AuthSessionProvider>
          <Navbar />
          {children}
          <Toaster />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
