import { API_BASE_URL } from "@/lib/config";
import { getStoredToken } from "@/features/auth/tokenStorage";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiUnauthorizedError extends ApiError {
  constructor(message = "Session expired. Please sign in again.") {
    super(message, 401);
    this.name = "ApiUnauthorizedError";
  }
}

export async function parseApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export function getApiErrorMessage(result: unknown, fallback: string): string {
  if (
    result &&
    typeof result === "object" &&
    "detail" in result &&
    Array.isArray(result.detail)
  ) {
    const messages = result.detail
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const record = item as Record<string, unknown>;
        const rawLocation = Array.isArray(record.loc)
          ? record.loc.filter((part) => part !== "body").join(".")
          : "";
        const message = typeof record.msg === "string" ? record.msg : "";

        if (!message) {
          return null;
        }

        return rawLocation ? `${rawLocation}: ${message}` : message;
      })
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  if (
    result &&
    typeof result === "object" &&
    "detail" in result &&
    typeof result.detail === "string"
  ) {
    return result.detail;
  }

  if (typeof result === "string" && result.trim()) {
    return result;
  }

  return fallback;
}

function getHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers);
  const token = getStoredToken();

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

export async function request(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: getHeaders(init),
    });
  } catch {
    throw new Error(
      "Cannot reach backend API. Check if the backend container is running."
    );
  }
}

export async function requestWithFallback(
  preferredPath: string,
  fallbackPath: string,
  init?: RequestInit
): Promise<Response> {
  const response = await request(preferredPath, init);

  if (response.status !== 404) {
    return response;
  }

  return request(fallbackPath, init);
}

export async function requireOk(
  response: Response,
  fallbackMessage: string
): Promise<unknown> {
  const result = await parseApiResponse(response);

  if (response.status === 401) {
    throw new ApiUnauthorizedError(getApiErrorMessage(result, fallbackMessage));
  }

  if (!response.ok) {
    throw new ApiError(
      getApiErrorMessage(result, fallbackMessage),
      response.status,
      result
    );
  }

  return result;
}
