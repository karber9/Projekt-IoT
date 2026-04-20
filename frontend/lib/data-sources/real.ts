import type { DataSource } from "./types";
import type {
  Device,
  OperationRequest,
  OperationResponse,
} from "@/features/types";
import { API_BASE_URL } from "@/lib/config";

export const realDataSource: DataSource = {
  async getDevices(): Promise<Device[]> {
    const response = await fetch(`${API_BASE_URL}/tasks/devices`);

    if (!response.ok) {
      throw new Error("Failed to fetch devices.");
    }

    return response.json();
  },

  async createOperation(
    payload: OperationRequest
  ): Promise<OperationResponse> {
    const response = await fetch(`${API_BASE_URL}/tasks/operations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to create operation.");
    }

    return response.json();
  },
};