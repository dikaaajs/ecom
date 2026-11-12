"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
export function SiteHeader() {
  const pathname = usePathname();
  const currentPage = pathname === "/dashboard/settings/shipping" ? "Alamat Pengirim" :
    pathname.startsWith("/dashboard/settings") ? "Pengaturan Website" :
    pathname.startsWith("/dashboard/product/") ? "Detail Produk" :
    pathname.startsWith("/dashboard/product") ? "Produk" :
    pathname.startsWith("/dashboard/orders/") ? "Detail Pesanan" :
    pathname.startsWith("/dashboard/orders") ? "Pesanan" :
    pathname.startsWith("/dashboard/digital-assets") ? "File Digital" :
    pathname.startsWith("/dashboard/docs") ? "Panduan Penggunaan" : "Dashboard";
  return <header className="flex h-14 shrink-0 items-center gap-2 border-b">
    <div className="flex w-full items-center gap-2 px-4 lg:px-6">
      <SidebarTrigger className="-ml-1" /><Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
      <h1 className="text-sm font-medium sm:text-base">{currentPage}</h1>
      <Button asChild variant="outline" size="sm" className="ml-auto"><Link href="/dashboard/docs"><BookOpen className="size-4" />Docs</Link></Button>
    </div>
  </header>;
}
