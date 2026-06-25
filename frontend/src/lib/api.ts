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

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const body = await response.json();

  if (!response.ok) {
    const detail = body?.detail ?? body?.error;
    const message =
      typeof detail === "object" ? detail.message : detail ?? "Request failed";
    const code = typeof detail === "object" ? detail.code : "REQUEST_FAILED";
    throw new ApiError(message, code, response.status);
  }

  return body.data as T;
}
