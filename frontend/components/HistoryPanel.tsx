import type { HistoryItem } from "@/features/types";

type HistoryPanelProps = {
  history: HistoryItem[];
};

export default function HistoryPanel({ history }: HistoryPanelProps) {
  return (
    <section className="h-full rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800">History</h2>
        <p className="mt-1 text-sm text-slate-500">
          Check your last operations
        </p>
      </div>

      <div className="space-y-4">
        {history.map((item) => (
          <div key={item.id} className="border-b border-slate-200 pb-3">
            <p className="text-sm text-slate-700">
              {item.operation} | a: {item.a} | b: {item.b}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              Result: {item.response}
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