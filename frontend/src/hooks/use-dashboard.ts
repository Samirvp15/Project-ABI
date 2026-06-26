"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchDashboard } from "@/services/dashboard";
import type { DashboardFilters } from "@/types/dashboard";

export function useDashboard(datasetId: string, filters?: DashboardFilters) {
  return useQuery({
    queryKey: ["dashboard", datasetId, filters?.date_from ?? "", filters?.date_to ?? ""],
    queryFn: () => fetchDashboard(datasetId, filters),
    enabled: !!datasetId,
  });
}
