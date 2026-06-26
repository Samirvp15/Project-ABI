"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchAnalytics, refreshAnalytics } from "@/services/analytics";

export function useAnalytics(datasetId: string) {
  return useQuery({
    queryKey: ["analytics", datasetId],
    queryFn: () => fetchAnalytics(datasetId),
    enabled: !!datasetId,
  });
}

export function useRefreshAnalytics(datasetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => refreshAnalytics(datasetId),
    onSuccess: (data) => {
      queryClient.setQueryData(["analytics", datasetId], data);
    },
  });
}
