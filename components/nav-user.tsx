"use client";
import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { BookOpen, LogOutIcon, MoreVerticalIcon, SettingsIcon, Store } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

export function NavUser({ user }: { user: { name: string; email: string; avatar: string } }) {
  const { isMobile } = useSidebar();
  const [leaving, setLeaving] = useState(false);
  const initials = user.name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();
  async function logout() {
    setLeaving(true);
    try {
      await signOut({ redirect: false });
      window.location.replace("/auth/signin");
    } catch {
      toast.error("Gagal keluar. Silakan coba lagi.");
      setLeaving(false);
    }
  }
  return <SidebarMenu><SidebarMenuItem><DropdownMenu>
    <DropdownMenuTrigger asChild><SidebarMenuButton size="lg">
      <Avatar className="h-8 w-8 rounded-lg"><AvatarImage src={user.avatar} alt={user.name} /><AvatarFallback>{initials}</AvatarFallback></Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-medium">{user.name}</span><span className="truncate text-xs text-muted-foreground">{user.email || "Administrator"}</span></div>
      <MoreVerticalIcon className="ml-auto size-4" />
    </SidebarMenuButton></DropdownMenuTrigger>
    <DropdownMenuContent className="min-w-56 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
      <DropdownMenuLabel>Administrator</DropdownMenuLabel><DropdownMenuSeparator />
      <DropdownMenuItem asChild><Link href="/"><Store />Lihat toko</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link href="/dashboard/settings"><SettingsIcon />Pengaturan website</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link href="/dashboard/docs"><BookOpen />Panduan penggunaan</Link></DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled={leaving} onSelect={event => { event.preventDefault(); void logout(); }}><LogOutIcon />{leaving ? "Sedang keluar…" : "Keluar"}</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu></SidebarMenuItem></SidebarMenu>;
}
