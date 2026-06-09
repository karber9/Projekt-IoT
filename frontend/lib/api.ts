import { API_BASE_URL } from "@/features/constants";

export type Device = {
  device_id: string;
  status?: string;
};

export type OperationRequest = {
  operation: string;
  a: number;
  b: number;
  device_id: string;
};

export type OperationResponse = {
  operation_id: string;
  status: string;
};

async function parseApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function getDevices(): Promise<Device[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/devices`);
    const result = await parseApiResponse(response);

    if (!response.ok) {
      return [];
    }

    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

export async function createOperation(
  data: OperationRequest
): Promise<OperationResponse> {
  const response = await fetch(`${API_BASE_URL}/tasks/operations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await parseApiResponse(response);

  if (!response.ok) {
    throw new Error(result?.detail || "Error while sending operation request");
  }

  return result;
}