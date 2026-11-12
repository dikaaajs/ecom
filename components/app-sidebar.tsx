"use client";
import * as React from "react";
import Link from "next/link";
import { BookOpen, ClipboardListIcon, FileLock2, LayoutDashboardIcon, Package, SettingsIcon, Store, Truck } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSiteSettings } from "@/components/providers/site-settings-provider";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

const navMain = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Produk", url: "/dashboard/product", icon: Package },
  { title: "Pesanan", url: "/dashboard/orders", icon: ClipboardListIcon },
  { title: "File Digital", url: "/dashboard/digital-assets", icon: FileLock2 },
];
const navSecondary = [
  { title: "Pengaturan Website", url: "/dashboard/settings", icon: SettingsIcon },
  { title: "Alamat Pengirim", url: "/dashboard/settings/shipping", icon: Truck },
  { title: "Docs · Panduan", url: "/dashboard/docs", icon: BookOpen },
];
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const { settings } = useSiteSettings();
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader><SidebarMenu><SidebarMenuItem>
        <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
          <Link href="/dashboard"><Store className="h-5 w-5" /><span className="truncate text-base font-semibold">{settings.siteName}</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem></SidebarMenu></SidebarHeader>
      <SidebarContent><NavMain items={navMain} /><NavSecondary items={navSecondary} className="mt-auto" /></SidebarContent>
      <SidebarFooter><NavUser user={{ name: session?.user?.name || session?.user?.username || "Admin", email: session?.user?.email || "", avatar: "" }} /></SidebarFooter>
    </Sidebar>
  );
}
