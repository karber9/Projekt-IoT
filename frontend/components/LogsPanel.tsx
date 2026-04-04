import { mockLogs } from "@/data/mockLogs";
import LogItemCard from "@/components/LogItemCard";

export default function LogsPanel() {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Activity logs</h2>
        <p className="mt-1 text-sm text-slate-500">
          Recent communication between server, MQTT, and devices.
        </p>
      </div>

      <div className="space-y-3">
        {mockLogs.map((log) => (
          <LogItemCard key={log.id} log={log} />
        ))}
      </div>
    </section>
  );
}