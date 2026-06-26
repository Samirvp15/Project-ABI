import { getAccessToken } from "@/lib/auth";
import type {
  ApiResponse,
  Dataset,
  DatasetListResponse,
  DatasetPreviewResponse,
} from "@/types/dataset";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const body: ApiResponse<T> = await response.json();

  if (!response.ok) {
    const detail = (body as { detail?: { code?: string; message?: string } }).detail ?? body.error;
    const message =
      typeof detail === "object" && detail
        ? (detail.message ?? "Request failed")
        : "Request failed";
    const code =
      typeof detail === "object" && detail ? (detail.code ?? "REQUEST_FAILED") : "REQUEST_FAILED";
    throw new ApiError(message, code, response.status);
  }

  return body.data as T;
}

export async function uploadDataset(file: File, name?: string): Promise<Dataset> {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append("file", file);
  if (name) formData.append("name", name);

  const response = await fetch(`${API_URL}/datasets/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  return handleResponse<Dataset>(response);
}

export async function fetchDatasets(page = 1, pageSize = 20): Promise<DatasetListResponse> {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/datasets?page=${page}&page_size=${pageSize}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return handleResponse<DatasetListResponse>(response);
}

export async function fetchDataset(id: string): Promise<Dataset> {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/datasets/${id}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return handleResponse<Dataset>(response);
}

export async function fetchDatasetPreview(id: string): Promise<DatasetPreviewResponse> {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/datasets/${id}/preview`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return handleResponse<DatasetPreviewResponse>(response);
}

export async function deleteDataset(id: string): Promise<void> {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/datasets/${id}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  await handleResponse(response);
}
