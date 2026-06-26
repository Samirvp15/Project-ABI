"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { buildCustomChart, fetchDashboard } from "@/services/dashboard";
import type { ChartBuildRequest, DashboardFilters } from "@/types/dashboard";

export function useDashboard(datasetId: string, filters?: DashboardFilters) {
  return useQuery({
    queryKey: ["dashboard", datasetId, filters?.date_from ?? "", filters?.date_to ?? ""],
    queryFn: () => fetchDashboard(datasetId, filters),
    enabled: !!datasetId,
  });
}

export function useBuildChart(datasetId: string) {
  return useMutation({
    mutationFn: (request: ChartBuildRequest) => buildCustomChart(datasetId, request),
  });
}
