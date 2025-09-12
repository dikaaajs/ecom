"use client";

import { SectionCards } from "@/components/section-cards";
import data from "./data.json";
import { useAuth } from "@/lib/hooks/use-auth";
import { useState } from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";

export default function Page() {
  const { user, isAuthenticated } = useAuth();
  const [apiTestResult, setApiTestResult] = useState<string>("");

  const testAdminAPI = async () => {
    try {
      const response = await fetch("/api/admin/test");
      const data = await response.json();

      if (response.ok) {
        setApiTestResult(`✅ API Test Successful: ${data.message}`);
      } else {
        setApiTestResult(`❌ API Test Failed: ${data.message}`);
      }
    } catch (error) {
      setApiTestResult(`❌ API Test Error: ${error}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-600">
          You need to be logged in to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <DataTable data={data} />
        </div>
      </div>
    </div>
  );
}
