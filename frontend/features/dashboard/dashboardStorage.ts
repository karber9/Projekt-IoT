import { HISTORY_LIMIT } from "@/features/constants";
import type { CommunicationLog } from "@/features/logs/types";
import type { HistoryItem } from "@/features/types";

const STORAGE_PREFIX = "iot_dashboard_state:";
const STORAGE_VERSION = 1;
const LOG_LIMIT = 500;
const LOG_DIRECTIONS = new Set<CommunicationLog["direction"]>([
  "frontend->server",
  "server->device",
  "device->server",
  "server",
]);

type DashboardStorageState = {
  version: typeof STORAGE_VERSION;
  history: HistoryItem[];
  logs: CommunicationLog[];
};

const emptyDashboardState: DashboardStorageState = {
  version: STORAGE_VERSION,
  history: [],
  logs: [],
};

export function getDashboardStorageKey(userScope: string | null) {
  if (!userScope) {
    return null;
  }

  return `${STORAGE_PREFIX}${encodeURIComponent(userScope)}`;
}

export function readDashboardState(
  storageKey: string | null
): DashboardStorageState {
  if (!storageKey || typeof window === "undefined") {
    return emptyDashboardState;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return emptyDashboardState;
    }

    const parsed = JSON.parse(rawValue) as unknown;
    if (!isRecord(parsed)) {
      return emptyDashboardState;
    }

    return {
      version: STORAGE_VERSION,
      history: Array.isArray(parsed.history)
        ? parsed.history
            .map(toHistoryItem)
            .filter((item): item is HistoryItem => item !== null)
            .slice(0, HISTORY_LIMIT)
        : [],
      logs: Array.isArray(parsed.logs)
        ? parsed.logs
            .map(toCommunicationLog)
            .filter((item): item is CommunicationLog => item !== null)
            .slice(0, LOG_LIMIT)
        : [],
    };
  } catch {
    return emptyDashboardState;
  }
}

export function writeDashboardHistory(
  storageKey: string | null,
  history: HistoryItem[]
) {
  if (!storageKey || typeof window === "undefined") {
    return;
  }

  const currentState = readDashboardState(storageKey);
  writeDashboardState(storageKey, {
    ...currentState,
    history: history.map(sanitizeHistoryItem).slice(0, HISTORY_LIMIT),
  });
}

export function writeDashboardLogs(
  storageKey: string | null,
  logs: CommunicationLog[]
) {
  if (!storageKey || typeof window === "undefined") {
    return;
  }

  const currentState = readDashboardState(storageKey);
  writeDashboardState(storageKey, {
    ...currentState,
    logs: logs.slice(0, LOG_LIMIT),
  });
}

export function mergeDashboardHistory(
  liveHistory: HistoryItem[],
  storedHistory: HistoryItem[]
) {
  const historyByKey = new Map<string, HistoryItem>();

  for (const item of storedHistory) {
    historyByKey.set(getHistoryKey(item), item);
  }

  for (const item of liveHistory) {
    historyByKey.set(getHistoryKey(item), item);
  }

  return Array.from(historyByKey.values())
    .sort((left, right) => right.created_at - left.created_at)
    .slice(0, HISTORY_LIMIT);
}

export function mergeDashboardLogs(
  liveLogs: CommunicationLog[],
  storedLogs: CommunicationLog[]
) {
  const logsById = new Map<string, CommunicationLog>();

  for (const log of storedLogs) {
    logsById.set(log.id, log);
  }

  for (const log of liveLogs) {
    logsById.set(log.id, log);
  }

  return Array.from(logsById.values())
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
    )
    .slice(0, LOG_LIMIT);
}

function writeDashboardState(
  storageKey: string,
  state: DashboardStorageState
) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Storage can be unavailable or full; dashboard should still work in memory.
  }
}

function getHistoryKey(item: HistoryItem) {
  if (item.kind === "operation" || item.operation_id) {
    return `operation:${item.operation_id ?? item.id}`;
  }

  return `batch:${item.id}`;
}

function sanitizeHistoryItem(item: HistoryItem): HistoryItem {
  return {
    ...item,
    source_file_url: undefined,
    report_file_url: undefined,
  };
}

function toHistoryItem(value: unknown): HistoryItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = toStringValue(value.id);
  const expression = toStringValue(value.expression);
  const status = toStringValue(value.status);
  const createdAt = toNumberValue(value.created_at);

  if (!id || !expression || !status || createdAt === null) {
    return null;
  }

  return sanitizeHistoryItem({
    id,
    kind: value.kind === "batch" ? "batch" : "operation",
    expression,
    device_id: toStringValue(value.device_id),
    operation_id: toStringValue(value.operation_id),
    status,
    result: toResultValue(value.result),
    created_at: createdAt,
    source_file_name: toStringValue(value.source_file_name),
    report_file_name: toStringValue(value.report_file_name),
    operation_count: toNumberValue(value.operation_count) ?? undefined,
  });
}

function toCommunicationLog(value: unknown): CommunicationLog | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = toStringValue(value.id);
  const timestamp = toStringValue(value.timestamp);
  const messageType = toStringValue(value.message_type);
  const status = toStringValue(value.status);

  if (!id || !timestamp || !messageType || !status) {
    return null;
  }

  const direction = LOG_DIRECTIONS.has(
    value.direction as CommunicationLog["direction"]
  )
    ? (value.direction as CommunicationLog["direction"])
    : "server";

  return {
    id,
    timestamp,
    direction,
    device_id: toStringValue(value.device_id),
    task_id: toNumberValue(value.task_id) ?? undefined,
    message_type: messageType,
    status,
    payload_preview: toStringValue(value.payload_preview),
    error: toStringValue(value.error),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function toNumberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toResultValue(value: unknown): string | number | null | undefined {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    value === null
  ) {
    return value;
  }

  return undefined;
}
