"use client";
import { createContext, useContext, useState, type ReactNode, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { defaultSiteSettings, type SiteSettings } from "@/lib/site-settings";
const SettingsContext = createContext({ settings: defaultSiteSettings, updateSettings: (_settings: SiteSettings) => {} });
export const useSiteSettings = () => useContext(SettingsContext);
export function SiteSettingsProvider({ initial, children }: { initial: SiteSettings; children: ReactNode }) {
  const [settings, updateSettings] = useState(initial);
  const dashboard = usePathname().startsWith("/dashboard");
  const theme = {
    "--storefront-accent": settings.primaryColor, "--storefront-button-text": settings.buttonTextColor,
    "--storefront-background": settings.backgroundColor, "--storefront-text": settings.textColor,
    backgroundColor: dashboard ? undefined : settings.backgroundColor, color: dashboard ? undefined : settings.textColor,
  } as CSSProperties;
  return <SettingsContext.Provider value={{ settings, updateSettings }}>
    <div className={dashboard ? "" : "storefront-theme min-h-screen"} style={theme}>{children}</div>
  </SettingsContext.Provider>;
}
