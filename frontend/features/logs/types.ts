export type CommunicationLog = {
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

export type LogCategory = "all" | "batch" | "task" | "device" | "error";
export type LogDirection = CommunicationLog["direction"] | "all";
