"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, type LucideIcon } from "lucide-react";
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export function NavMain({ items }: { items: { title: string; url: string; icon?: LucideIcon }[] }) {
  const pathname = usePathname();
  return <SidebarGroup><SidebarGroupContent className="flex flex-col gap-2"><SidebarMenu>
    <SidebarMenuItem><SidebarMenuButton asChild tooltip="Lihat toko"><Link href="/"><House /><span>Lihat toko</span></Link></SidebarMenuButton></SidebarMenuItem>
    {items.map(item => <SidebarMenuItem key={item.url}>
      <SidebarMenuButton asChild tooltip={item.title} isActive={item.url === "/dashboard" ? pathname === item.url : pathname === item.url || pathname.startsWith(item.url + "/")}>
        <Link href={item.url}>{item.icon && <item.icon />}<span>{item.title}</span></Link>
      </SidebarMenuButton>
    </SidebarMenuItem>)}
  </SidebarMenu></SidebarGroupContent></SidebarGroup>;
}
