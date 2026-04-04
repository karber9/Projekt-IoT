import { mockLogs } from "@/data/mockLogs";

type LogsPanelProps = {
  selectedDeviceId: string;
};

const levelClasses = {
  info: "bg-blue-100 text-blue-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  error: "bg-red-100 text-red-700",
};

export default function LogsPanel({ selectedDeviceId }: LogsPanelProps) {
  const filteredLogs = mockLogs.filter((log) => log.id === selectedDeviceId);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Activity logs</h2>
        <p className="mt-1 text-sm text-slate-500">
          Recent communication for the selected destination.
        </p>
      </div>

      <div className="space-y-3">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${levelClasses[log.level]}`}
                  >
                    {log.level}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {log.source}
                  </span>
                </div>

                <span className="text-xs text-slate-400">{log.timestamp}</span>
              </div>

              <p className="mt-3 text-sm text-slate-700">{log.message}</p>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            No logs available for this device.
          </div>
        )}
      </div>
    </section>
  );
}