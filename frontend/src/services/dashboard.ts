import { getAccessToken } from "@/lib/auth";
import type { ChartBuildRequest, DashboardFilters, DashboardProfile, DashboardWidget } from "@/types/dashboard";
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

export async function fetchDashboard(
  datasetId: string,
  filters?: DashboardFilters,
): Promise<DashboardProfile> {
  const token = getAccessToken();
  const params = new URLSearchParams();
  if (filters?.date_from) params.set("date_from", filters.date_from);
  if (filters?.date_to) params.set("date_to", filters.date_to);

  const query = params.toString();
  const url = `${API_URL}/dashboard/${datasetId}${query ? `?${query}` : ""}`;
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return handleResponse<DashboardProfile>(response);
}

export async function buildCustomChart(
  datasetId: string,
  request: ChartBuildRequest,
): Promise<DashboardWidget> {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/dashboard/${datasetId}/chart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(request),
  });
  return handleResponse<DashboardWidget>(response);
}
