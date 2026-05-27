import type { OperationResponse } from "@/lib/api";

type BatchReportInput = {
  fileName: string;
  operationCount: number;
  status: "success" | "error";
  message: string;
  durationMs?: number;
  responses?: OperationResponse[];
  errorDetails?: string;
};

function formatDuration(durationMs: number) {
  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  return `${(durationMs / 1000).toFixed(1)} s`;
}

export function generateBatchReport({
  fileName,
  operationCount,
  status,
  message,
  durationMs,
  responses = [],
  errorDetails,
}: BatchReportInput) {
  const lines = [
    "Batch operations report",
    `Created at: ${new Date().toLocaleString()}`,
    `File: ${fileName}`,
    `Detected operations: ${operationCount}`,
    `Status: ${status}`,
    `Message: ${message}`,
  ];

  if (durationMs !== undefined) {
    lines.push(`Duration: ${formatDuration(durationMs)}`);
  }

  if (responses.length > 0) {
    lines.push("", "Results:");
    responses.forEach((response, index) => {
      lines.push(
        `${index + 1}. result=${response.result ?? "no result"}; operation_id=${response.operation_id}; device_id=${response.device_id ?? "n/a"}; status=${response.status}`
      );
    });
  }

  if (errorDetails) {
    lines.push("", "Error details:", errorDetails);
  }

  return lines.join("\n");
}

export function downloadTextReport(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
