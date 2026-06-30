"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchChatMessages, fetchChatSessions, sendChatMessage } from "@/services/ai";
import type { ChatRequest } from "@/types/ai";

export function useChatSessions(datasetId: string) {
  return useQuery({
    queryKey: ["ai", "sessions", datasetId],
    queryFn: () => fetchChatSessions(datasetId),
    enabled: !!datasetId,
  });
}

export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ["ai", "messages", sessionId],
    queryFn: () => fetchChatMessages(sessionId!),
    enabled: !!sessionId,
  });
}

export function useSendChatMessage(datasetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<ChatRequest, "dataset_id">) =>
      sendChatMessage({ ...payload, dataset_id: datasetId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ai", "messages", data.session_id] });
      queryClient.invalidateQueries({ queryKey: ["ai", "sessions", datasetId] });
    },
  });
}
