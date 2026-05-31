import type { CommunicationLog } from "@/features/logs/types";
import type { RealtimeEvent } from "@/features/realtime/types";

export function deriveCommunicationLogs(
  events: RealtimeEvent[]
): CommunicationLog[] {
  return events.map((event, index) => {
    const timestamp = event.received_at ?? new Date().toISOString();

    if (event.type === "communication.log") {
      return event.log;
    }

    if (event.type === "task.updated") {
      return {
        id: `task-${event.task_id}-${index}`,
        timestamp,
        direction: "device->server",
        device_id: event.device_id,
        task_id: event.task_id,
        message_type: "task.updated",
        status: event.status,
        payload_preview:
          event.result === undefined ? undefined : String(event.result),
      };
    }

    if (event.type === "device.updated") {
      return {
        id: `device-${event.device_id}-${index}`,
        timestamp,
        direction: "server",
        device_id: event.device_id,
        message_type: "device.updated",
        status: event.status,
      };
    }

    return {
      id: `batch-${event.batch_id}-${index}`,
      timestamp,
      direction: "server",
      message_type: "batch.progress",
      status: `${event.completed + event.failed}/${event.total}`,
      payload_preview: `batch_id=${event.batch_id}, pending=${event.pending}, running=${event.running}, failed=${event.failed}`,
    };
  });
}

export function filterLogsByDevice(
  logs: CommunicationLog[],
  deviceId: string
): CommunicationLog[] {
  if (!deviceId) {
    return logs;
  }

  return logs.filter((log) => log.device_id === deviceId);
}

export function getLogCategory(log: CommunicationLog) {
  const messageType = log.message_type.toLowerCase();

  if (log.error || messageType.includes("error")) {
    return "error";
  }

  if (messageType.includes("batch")) {
    return "batch";
  }

  if (messageType.includes("device")) {
    return "device";
  }

  return "task";
}
