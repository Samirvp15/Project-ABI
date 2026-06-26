"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteDataset,
  fetchDataset,
  fetchDatasetPreview,
  fetchDatasets,
  uploadDataset,
} from "@/services/datasets";

export function useDatasets(page = 1) {
  return useQuery({
    queryKey: ["datasets", page],
    queryFn: () => fetchDatasets(page),
  });
}

export function useDataset(id: string) {
  return useQuery({
    queryKey: ["datasets", id],
    queryFn: () => fetchDataset(id),
    enabled: !!id,
  });
}

export function useDatasetPreview(id: string) {
  return useQuery({
    queryKey: ["datasets", id, "preview"],
    queryFn: () => fetchDatasetPreview(id),
    enabled: !!id,
  });
}

export function useUploadDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, name }: { file: File; name?: string }) => uploadDataset(file, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
    },
  });
}

export function useDeleteDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDataset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
    },
  });
}
