import type { BatchOperation } from "@/features/batch/parseOperationsFile";
import type { OperationResponse } from "@/lib/api/types";
import { requireOk, request } from "@/lib/api/client";
import { normalizeOperationResponse } from "@/lib/api/operations";

export async function uploadBatchOperations(
  operations: BatchOperation[]
): Promise<OperationResponse[]> {
  const file = new File([JSON.stringify(operations)], "operations.json", {
    type: "application/json",
  });

  return uploadBatchFile(file);
}

export async function uploadBatchFile(
  file: File
): Promise<OperationResponse[]> {
  const formData = new FormData();
  formData.append("file", file);

  const result = await requireOk(
    await request("/tasks/upload", {
      method: "POST",
      body: formData,
    }),
    "Error while uploading operations file"
  );

  if (!Array.isArray(result)) {
    throw new Error("Invalid batch upload response from server.");
  }

  return result.map(normalizeOperationResponse);
}
