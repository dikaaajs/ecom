"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLoading from "@/components/loading/dashboard-loading";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.replace("/auth/signin");
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading || !isAuthenticated || !isAdmin) {
    return <DashboardLoading />;
  }

  return (
    <SidebarProvider className="font-satoshi">
      <AppSidebar variant="inset" />
      <SidebarInset className="min-w-0">
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
