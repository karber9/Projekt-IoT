import type { CommunicationLog } from "@/features/logs/types";
import { getLogCategory } from "@/features/logs/deriveLogs";

type LogItemCardProps = {
  log: CommunicationLog;
};

export default function LogItemCard({ log }: LogItemCardProps) {
  const category = getLogCategory(log);
  const tone =
    category === "error"
      ? "bg-red-100 text-red-700"
      : log.direction === "device->server"
      ? "bg-emerald-100 text-emerald-700"
      : log.direction === "server->device"
        ? "bg-blue-100 text-blue-700"
        : log.direction === "frontend->server"
          ? "bg-violet-100 text-violet-700"
          : "bg-slate-100 text-slate-700";

  return (
    <div className="rounded-lg border border-slate-200 p-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}
          >
            {log.direction}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {category}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-slate-400">
            {log.message_type}
          </span>
        </div>

        <span className="text-xs text-slate-400">
          {new Date(log.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <p className="mt-2 text-xs font-medium text-slate-700">
        {buildLogTitle(log)}
      </p>
      {log.task_id !== undefined && (
        <p className="mt-1 text-xs text-slate-400">Task ID: {log.task_id}</p>
      )}
      {log.payload_preview && (
        <p className="mt-1.5 truncate rounded-md bg-slate-50 px-2 py-1 text-[11px] text-slate-500">
          {log.payload_preview}
        </p>
      )}
      {log.error && <p className="mt-1.5 text-xs text-red-600">{log.error}</p>}
    </div>
  );
}

function buildLogTitle(log: CommunicationLog) {
  if (log.message_type === "batch.progress") {
    return `Batch progress: ${log.status}`;
  }

  if (log.message_type === "task.updated") {
    return `Task ${log.task_id ?? ""} updated: ${log.status}`.trim();
  }

  if (log.message_type === "device.updated") {
    return `Device ${log.device_id ?? "unknown"} is ${log.status}`;
  }

  if (log.message_type === "operation.assigned") {
    return `Operation assigned to ${log.device_id ?? "server"}: ${log.status}`;
  }

  if (log.message_type === "mqtt.dispatched") {
    return `Request sent to ${log.device_id ?? "device"}: ${log.status}`;
  }

  if (log.message_type === "mqtt.result") {
    return `Result received from ${log.device_id ?? "device"}: ${log.status}`;
  }

  return `${log.device_id ? `Device ${log.device_id}` : "Server"}: ${log.status}`;
}
