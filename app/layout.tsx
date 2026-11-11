import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Navbar } from "@/components/stack/navbar";
import AuthSessionProvider from "@/components/providers/session-provider";
import { CartProvider } from "@/components/cart/cart-provider";
import { Toaster } from "@/components/ui/sonner";
import { SiteSettingsProvider } from "@/components/providers/site-settings-provider";
import { storefrontSettings } from "@/lib/site-settings-server";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const s = await storefrontSettings();
  return { title: s.siteName, description: s.siteDescription, icons: s.faviconUrl ? { icon: s.faviconUrl } : undefined };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await storefrontSettings();
  return (
    <html lang="id">
      <body className={`overflow-x-hidden antialiased`}>
        <AuthSessionProvider>
          <SiteSettingsProvider initial={settings}>
          <CartProvider>
            <Navbar />
            {children}
          </CartProvider>
          <Toaster />
          </SiteSettingsProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
