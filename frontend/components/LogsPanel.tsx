import { useMemo, useState } from "react";
import LogItemCard from "@/components/LogItemCard";
import {
  filterLogsByDevice,
  getLogCategory,
} from "@/features/logs/deriveLogs";
import type {
  CommunicationLog,
  LogCategory,
  LogDirection,
} from "@/features/logs/types";
import type { RealtimeConnectionStatus } from "@/features/realtime/types";
import type { Device } from "@/lib/api";

type LogsPanelProps = {
  devices: Device[];
  logs: CommunicationLog[];
  connectionStatus: RealtimeConnectionStatus;
  connectionError: string;
};

export default function LogsPanel({
  devices,
  logs,
  connectionStatus,
  connectionError,
}: LogsPanelProps) {
  const [filterDeviceId, setFilterDeviceId] = useState("");
  const [filterCategory, setFilterCategory] = useState<LogCategory>("all");
  const [filterDirection, setFilterDirection] = useState<LogDirection>("all");
  const filteredLogs = useMemo(() => {
    const deviceLogs = filterLogsByDevice(logs, filterDeviceId);

    return deviceLogs.filter((log) => {
      const matchesCategory =
        filterCategory === "all" || getLogCategory(log) === filterCategory;
      const matchesDirection =
        filterDirection === "all" || log.direction === filterDirection;

      return matchesCategory && matchesDirection;
    });
  }, [filterCategory, filterDeviceId, filterDirection, logs]);
  const hasActiveFilters =
    Boolean(filterDeviceId) ||
    filterCategory !== "all" ||
    filterDirection !== "all";

  return (
    <section className="flex h-full min-h-[380px] flex-col rounded-xl bg-white p-3 shadow-sm sm:p-4 lg:min-h-0">
      <div className="mb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            Realtime logs
          </h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {connectionStatus}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {hasActiveFilters
            ? `Showing ${filteredLogs.length} of ${logs.length} events.`
            : "Showing the latest communication events."}
        </p>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <select
            aria-label="Filter logs by device"
            value={filterDeviceId}
            onChange={(event) => setFilterDeviceId(event.target.value)}
            className="min-w-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All devices</option>
            {devices.map((device) => (
              <option key={device.device_id} value={device.device_id}>
                {device.device_id}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter logs by category"
            value={filterCategory}
            onChange={(event) =>
              setFilterCategory(event.target.value as LogCategory)
            }
            className="min-w-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">All types</option>
            <option value="batch">Batch</option>
            <option value="task">Tasks</option>
            <option value="device">Devices</option>
            <option value="error">Errors</option>
          </select>
          <select
            aria-label="Filter logs by direction"
            value={filterDirection}
            onChange={(event) =>
              setFilterDirection(event.target.value as LogDirection)
            }
            className="min-w-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">All directions</option>
            <option value="frontend->server">Frontend to server</option>
            <option value="server->device">Server to device</option>
            <option value="device->server">Device to server</option>
            <option value="server">Server</option>
          </select>
        </div>
        {hasActiveFilters && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => {
                setFilterDeviceId("");
                setFilterCategory("all");
                setFilterDirection("all");
              }}
              className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {connectionError && (
        <div className="mb-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {connectionError}
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <LogItemCard key={log.id} log={log} />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-500">
            No realtime logs yet.
          </div>
        )}
      </div>
    </section>
  );
}
