export type BackendCommunicationLogContract = {
  type: "communication.log";
  log: {
    id: string;
    timestamp: string;
    direction: "frontend->server" | "server->device" | "device->server" | "server";
    message_type:
      | "batch.started"
      | "batch.operation.assigned"
      | "batch.completed"
      | "operation.requested"
      | "operation.assigned"
      | "mqtt.dispatched"
      | "mqtt.result"
      | "task.updated"
      | "device.status_changed"
      | "error"
      | string;
    status: string;
    device_id?: string;
    task_id?: number;
    payload_preview?: string;
    error?: string;
  };
};

export type BackendBatchProgressContract = {
  type: "batch.progress";
  batch_id: string;
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
};
