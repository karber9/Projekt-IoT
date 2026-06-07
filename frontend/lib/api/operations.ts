import type { OperationRequest, OperationResponse } from "@/lib/api/types";
import { requireOk, requestWithFallback } from "@/lib/api/client";

export function normalizeOperationResponse(result: unknown): OperationResponse {
  if (!result || typeof result !== "object") {
    throw new Error("Invalid operation response from server.");
  }

  const data = result as Record<string, unknown>;
  const rawOperationId = data.operation_id ?? data.task_id ?? data.id;

  if (rawOperationId === undefined || data.status === undefined) {
    throw new Error("Operation response is missing required fields.");
  }

  return {
    operation_id: String(rawOperationId),
    task_id: typeof data.task_id === "number" ? data.task_id : undefined,
    user_id: typeof data.user_id === "number" ? data.user_id : undefined,
    expression:
      typeof data.expression === "string"
        ? data.expression
        : typeof data.payload === "string"
          ? data.payload
          : undefined,
    device_id: typeof data.device_id === "string" ? data.device_id : undefined,
    status: String(data.status),
    result:
      typeof data.result === "string" || typeof data.result === "number"
        ? data.result
        : data.result === null
          ? null
          : undefined,
  };
}

export async function createOperation(
  data: OperationRequest
): Promise<OperationResponse> {
  const body = JSON.stringify({
    expression: data.expression,
  });

  const response = await requestWithFallback(
    "/tasks/operations",
    "/api/operations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    }
  );

  const result = await requireOk(
    response,
    "Error while sending operation request"
  );

  return normalizeOperationResponse(result);
}

export async function getOperationStatus(
  operationId: string
): Promise<OperationResponse> {
  const response = await requestWithFallback(
    `/tasks/${operationId}`,
    `/api/tasks/${operationId}`
  );

  const result = await requireOk(
    response,
    "Error while loading operation status"
  );

  return normalizeOperationResponse(result);
}
