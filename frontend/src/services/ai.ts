import { getAccessToken } from "@/lib/auth";
import type {
  ChatMessageItem,
  ChatRequest,
  ChatResponse,
  ChatSessionItem,
} from "@/types/ai";
import type { ApiResponse } from "@/types/dataset";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function getErrorMessage(body: unknown, fallback: string): string {
  const detail = (body as { detail?: { message?: string } }).detail;
  if (typeof detail === "object" && detail?.message) return detail.message;
  const error = (body as ApiResponse).error;
  if (error?.message) return error.message;
  return fallback;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      if (!response.ok) {
        throw new Error(`Error del servidor (${response.status})`);
      }
      throw new Error("Respuesta inválida del servidor");
    }
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(body, `Error del servidor (${response.status})`));
  }

  return (body as ApiResponse<T>).data as T;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, init);
    return handleResponse<T>(response);
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        "No se pudo conectar con el backend. Verifica que esté en http://localhost:8000",
      );
    }
    throw err;
  }
}

export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  const token = getAccessToken();
  return request<ChatResponse>(`${API_URL}/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchChatSessions(datasetId: string): Promise<ChatSessionItem[]> {
  const token = getAccessToken();
  return request<ChatSessionItem[]>(`${API_URL}/ai/datasets/${datasetId}/sessions`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function fetchChatMessages(sessionId: string): Promise<ChatMessageItem[]> {
  const token = getAccessToken();
  return request<ChatMessageItem[]>(`${API_URL}/ai/sessions/${sessionId}/messages`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
