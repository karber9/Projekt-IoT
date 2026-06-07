import type { LogItem } from "@/data/mockLogs";

type LogItemCardProps = {
  log: LogItem;
};

const levelClasses = {
  info: "bg-blue-100 text-blue-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  error: "bg-red-100 text-red-700",
};

export default function LogItemCard({ log }: LogItemCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
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
  );
}