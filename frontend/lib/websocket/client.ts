import { WS_BASE_URL } from "@/lib/config";
import { parseWsMessage } from "@/lib/websocket/crypto";
import type { RealtimeConnectionStatus, RealtimeEvent } from "@/features/realtime/types";

const LOG_DIRECTIONS = [
  "frontend->server",
  "server->device",
  "device->server",
  "server",
] as const;

type LogDirection = (typeof LOG_DIRECTIONS)[number];

function isLogDirection(value: unknown): value is LogDirection {
  return (
    typeof value === "string" &&
    LOG_DIRECTIONS.includes(value as LogDirection)
  );
}

type RealtimeClientOptions = {
  token: string;
  onEvent: (event: RealtimeEvent) => void;
  onStatusChange: (status: RealtimeConnectionStatus) => void;
  onError?: (message: string) => void;
  decryptPayload?: (payload: string) => string;
  reconnectDelayMs?: number;
};

export class RealtimeClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private readonly reconnectDelayMs: number;

  constructor(private readonly options: RealtimeClientOptions) {
    this.reconnectDelayMs = options.reconnectDelayMs ?? 2000;
  }

  connect() {
    this.cleanupReconnectTimer();
    this.shouldReconnect = true;
    this.options.onStatusChange("connecting");

    const url = new URL(`${WS_BASE_URL}/ws/updates`);
    url.searchParams.set("token", this.options.token);

    this.socket = new WebSocket(url.toString());
    this.socket.onopen = () => this.options.onStatusChange("connected");
    this.socket.onmessage = (message) => this.handleMessage(message);
    this.socket.onerror = () => {
      this.options.onStatusChange("error");
      this.options.onError?.("WebSocket connection error.");
    };
    this.socket.onclose = () => {
      this.options.onStatusChange("disconnected");

      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(
          () => this.connect(),
          this.reconnectDelayMs
        );
      }
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    this.cleanupReconnectTimer();
    this.socket?.close();
    this.socket = null;
    this.options.onStatusChange("disconnected");
  }

  private cleanupReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private handleMessage(message: MessageEvent<string>) {
    try {
      const data = parseWsMessage(message.data, this.options.decryptPayload);
      const event = normalizeRealtimeEvent(data);

      if (event) {
        this.options.onEvent(event);
      }
    } catch {
      this.options.onError?.("Invalid WebSocket message received.");
    }
  }
}

export function normalizeRealtimeEvent(data: unknown): RealtimeEvent | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;

  if (record.type === "task.updated" && typeof record.task_id === "number") {
    return {
      type: "task.updated",
      task_id: record.task_id,
      status: String(record.status ?? "unknown"),
      result:
        typeof record.result === "string" || typeof record.result === "number"
          ? record.result
          : record.result === null
            ? null
            : undefined,
      device_id:
        typeof record.device_id === "string" ? record.device_id : undefined,
    };
  }

  if (typeof record.task_id === "number" && typeof record.status === "string") {
    return {
      type: "task.updated",
      task_id: record.task_id,
      status: record.status,
      result:
        typeof record.result === "string" || typeof record.result === "number"
          ? record.result
          : record.result === null
            ? null
            : undefined,
      device_id:
        typeof record.device_id === "string" ? record.device_id : undefined,
    };
  }

  if (
    record.type === "device.updated" &&
    typeof record.device_id === "string" &&
    typeof record.status === "string"
  ) {
    return {
      type: "device.updated",
      device_id: record.device_id,
      status: record.status,
      last_seen:
        typeof record.last_seen === "string" ? record.last_seen : undefined,
    };
  }

  if (record.type === "communication.log" && record.log && typeof record.log === "object") {
    const log = record.log as Record<string, unknown>;

    if (
      typeof log.id === "string" &&
      typeof log.timestamp === "string" &&
      isLogDirection(log.direction) &&
      typeof log.message_type === "string" &&
      typeof log.status === "string"
    ) {
      return {
        type: "communication.log",
        log: {
          id: log.id,
          timestamp: log.timestamp,
          direction: log.direction,
          device_id:
            typeof log.device_id === "string" ? log.device_id : undefined,
          task_id: typeof log.task_id === "number" ? log.task_id : undefined,
          message_type: log.message_type,
          status: log.status,
          payload_preview:
            typeof log.payload_preview === "string"
              ? log.payload_preview
              : undefined,
          error: typeof log.error === "string" ? log.error : undefined,
        },
      };
    }
  }

  return null;
}
