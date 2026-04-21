import type { HistoryItem } from "@/features/types";

type HistoryPanelProps = {
  history: HistoryItem[];
};

export default function HistoryPanel({ history }: HistoryPanelProps) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6 shrink-0">
        <h2 className="text-xl font-semibold text-slate-800">History</h2>
        <p className="mt-1 text-sm text-slate-500">
          Check your last operations
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
        {history.map((item) => (
          <div key={item.id} className="border-b border-slate-200 pb-3">
            <p className="text-xs text-slate-700">
              {item.operation} | a: {item.a} | b: {item.b} | ID:{" "}
              {item.device_id || "(server fallback)"} | opID: {item.operation_id}{" "}
              | Status: {item.status}
            </p>
          </div>
        ))}

        {history.length === 0 && (
          <p className="text-sm text-slate-400">No operations yet.</p>
        )}
      </div>
    </section>
  );
}