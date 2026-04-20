import type { DataSource } from "./types";
import type { OperationRequest, OperationResponse } from "@/features/types";
import { mockDevices } from "@/data/mockDevices";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockDataSource: DataSource = {
  async getDevices() {
    await wait(400);
    return mockDevices;
  },

  async createOperation(
    payload: OperationRequest
  ): Promise<OperationResponse> {
    await wait(700);

    console.log("Mock createOperation payload:", payload);

    return {
      operation_id: `op-${Date.now()}`,
      status: "queued",
    };
  },
};