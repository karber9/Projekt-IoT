import LogItemCard from "@/components/LogItemCard";
import { mockLogs } from "@/data/mockLogs";
import {
  filterEventsByDeviceId,
  sortEventsByTimestamp,
} from "@/features/events/utils";

type LogsPanelProps = {
  selectedDeviceId: string;
};

export default function LogsPanel({ selectedDeviceId }: LogsPanelProps) {
  const filteredLogs = filterEventsByDeviceId(mockLogs, selectedDeviceId);
  const visibleLogs = sortEventsByTimestamp(filteredLogs);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 shrink-0">
        <h2 className="text-lg font-semibold text-slate-800">
          Communication trace
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Live communication between the server and connected devices.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
        <div className="space-y-1">
          {visibleLogs.map((event) => (
            <LogItemCard key={event.id} event={event} />
          ))}

          {visibleLogs.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500">
              No communication events for this device.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}