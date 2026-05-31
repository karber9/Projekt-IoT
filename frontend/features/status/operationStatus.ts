export type OperationStatusKind =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "timeout"
  | "unknown";

type OperationStatusMeta = {
  kind: OperationStatusKind;
  label: string;
  description: string;
  badgeClassName: string;
};

export function getOperationStatusMeta(status: string): OperationStatusMeta {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes("timeout")) {
    return {
      kind: "timeout",
      label: "Timeout",
      description: "No result was received before the UI timeout.",
      badgeClassName: "bg-amber-50 text-amber-700",
    };
  }

  if (
    normalizedStatus.includes("fail") ||
    normalizedStatus.includes("error")
  ) {
    return {
      kind: "failed",
      label: "Failed",
      description: "Operation finished with an error.",
      badgeClassName: "bg-red-50 text-red-700",
    };
  }

  if (
    normalizedStatus.includes("complete") ||
    normalizedStatus.includes("success")
  ) {
    return {
      kind: "completed",
      label: "Completed",
      description: "Operation completed.",
      badgeClassName: "bg-green-50 text-green-700",
    };
  }

  if (
    normalizedStatus.includes("running") ||
    normalizedStatus.includes("dispatched") ||
    normalizedStatus.includes("sent")
  ) {
    return {
      kind: "running",
      label: "Running",
      description: "Operation was sent and is waiting for a result.",
      badgeClassName: "bg-blue-50 text-blue-700",
    };
  }

  if (normalizedStatus.includes("queued") || normalizedStatus.includes("pending")) {
    return {
      kind: "queued",
      label: "Queued",
      description: "Operation is queued.",
      badgeClassName: "bg-slate-100 text-slate-600",
    };
  }

  return {
    kind: "unknown",
    label: status || "Unknown",
    description: "Operation status is not recognized by the frontend.",
    badgeClassName: "bg-slate-100 text-slate-600",
  };
}

export function hasOperationFailed(status: string) {
  const kind = getOperationStatusMeta(status).kind;
  return kind === "failed" || kind === "timeout";
}

export function isOperationTerminal(status: string) {
  const kind = getOperationStatusMeta(status).kind;
  return kind === "completed" || kind === "failed" || kind === "timeout";
}
