import type { Device } from "@/lib/api/types";
import {
  ApiUnauthorizedError,
  parseApiResponse,
  requestWithFallback,
} from "@/lib/api/client";

export async function getDevices(): Promise<Device[]> {
  const response = await requestWithFallback("/tasks/devices", "/api/devices");

  if (response.status === 401) {
    throw new ApiUnauthorizedError();
  }

  const result = await parseApiResponse(response);

  if (!response.ok) {
    return [];
  }

  return Array.isArray(result) ? result : [];
}
