import { getAccessToken } from "@/lib/auth";
import type { AnalyticsProfile } from "@/types/analytics";
import type { ApiResponse } from "@/types/dataset";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function handleResponse<T>(response: Response): Promise<T> {
  const body: ApiResponse<T> = await response.json();
  if (!response.ok) {
    const detail = (body as { detail?: { message?: string } }).detail;
    throw new Error(
      typeof detail === "object" && detail?.message ? detail.message : "Request failed",
    );
  }
  return body.data as T;
}

export async function fetchAnalytics(datasetId: string): Promise<AnalyticsProfile> {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/analytics/${datasetId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return handleResponse<AnalyticsProfile>(response);
}

export async function refreshAnalytics(datasetId: string): Promise<AnalyticsProfile> {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/analytics/${datasetId}/refresh`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return handleResponse<AnalyticsProfile>(response);
}
