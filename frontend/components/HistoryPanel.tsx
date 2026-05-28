import type { HistoryItem } from "@/features/types";
import { getOperationStatusMeta } from "@/features/status/operationStatus";

type HistoryPanelProps = {
  history: HistoryItem[];
};

export default function HistoryPanel({ history }: HistoryPanelProps) {
  return (
    <section className="flex h-full min-h-[220px] flex-col rounded-xl bg-white p-3 shadow-sm sm:p-4 lg:min-h-0">
      <div className="mb-3 shrink-0">
        <h2 className="text-base font-semibold text-slate-800">History</h2>
        <p className="mt-1 text-xs text-slate-500">
          Check your last operations
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1 custom-scrollbar">
        {history.map((item) => {
          const statusMeta = getOperationStatusMeta(item.status);

          return (
            <div key={item.id} className="border-b border-slate-200 pb-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="break-words text-xs text-slate-700">
                  {item.expression}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClassName}`}
                  title={statusMeta.description}
                >
                  {statusMeta.label}
                </span>
              </div>
              {item.operation_id && (
                <p className="mt-1 text-xs text-slate-400">
                  Operation ID: {item.operation_id}
                </p>
              )}
              {item.device_id && (
                <p className="mt-1 text-xs text-slate-400">
                  Device: {item.device_id}
                </p>
              )}
            </div>
          );
        })}

        {history.length === 0 && (
          <p className="text-xs text-slate-400">No operations yet.</p>
        )}
      </div>
    </section>
  );
}
