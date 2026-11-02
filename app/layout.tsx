import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/stack/navbar";
import AuthSessionProvider from "@/components/providers/session-provider";
import { CartProvider } from "@/components/cart/cart-provider";
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
          <CartProvider>
            <Navbar />
            {children}
          </CartProvider>
          <Toaster />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
