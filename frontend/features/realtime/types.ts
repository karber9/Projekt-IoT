export type RealtimeConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type TaskUpdatedEvent = {
  type: "task.updated";
  received_at?: string;
  task_id: number;
  status: string;
  result?: string | number | null;
  device_id?: string;
};

export type DeviceUpdatedEvent = {
  type: "device.updated";
  received_at?: string;
  device_id: string;
  status: string;
  last_seen?: string;
};

export type CommunicationLogEvent = {
  type: "communication.log";
  received_at?: string;
  log: {
    id: string;
    timestamp: string;
    direction: "frontend->server" | "server->device" | "device->server" | "server";
    device_id?: string;
    task_id?: number;
    message_type: string;
    status: string;
    payload_preview?: string;
    error?: string;
  };
};

export type BatchProgressEvent = {
  type: "batch.progress";
  received_at?: string;
  batch_id: string;
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
};

export type RealtimeEvent =
  | TaskUpdatedEvent
  | DeviceUpdatedEvent
  | CommunicationLogEvent
  | BatchProgressEvent;
