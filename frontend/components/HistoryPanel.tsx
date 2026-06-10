import type { HistoryItem } from "@/features/types";

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
          if (item.kind === "batch") {
            return (
              <div key={item.id} className="border-b border-slate-200 pb-2.5">
                <div className="space-y-1.5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Batch file
                    </p>
                    {item.source_file_url ? (
                      <a
                        href={item.source_file_url}
                        download={item.source_file_name}
                        className="break-words text-xs font-semibold text-blue-700 hover:text-blue-800"
                      >
                        {item.source_file_name}
                      </a>
                    ) : (
                      <p className="break-words text-xs text-slate-700">
                        {item.source_file_name ?? item.expression}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Results
                    </p>
                    {item.report_file_url ? (
                      <a
                        href={item.report_file_url}
                        download={item.report_file_name}
                        className="break-words text-sm font-semibold text-blue-700 hover:text-blue-800"
                      >
                        {item.report_file_name ?? "Download report"}
                      </a>
                    ) : (
                      <p className="break-words text-sm font-semibold text-slate-400">
                        Report will appear after processing.
                      </p>
                    )}
                  </div>
                </div>

                {item.operation_count !== undefined && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    Operations: {item.operation_count}
                  </p>
                )}
              </div>
            );
          }

          const hasResult = item.result !== undefined && item.result !== null;
          const resultText = hasResult
            ? String(item.result)
            : "Waiting for result...";

          return (
            <div key={item.id} className="border-b border-slate-200 pb-2.5">
              <div className="space-y-1.5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Operation
                  </p>
                  <p className="break-words text-xs text-slate-700">
                    {item.expression}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Result
                  </p>
                  <p
                    className={[
                      "break-words text-sm font-semibold",
                      hasResult ? "text-slate-900" : "text-slate-400",
                    ].join(" ")}
                  >
                    {resultText}
                  </p>
                </div>
              </div>

              {item.operation_id && (
                <p className="mt-1.5 text-xs text-slate-400">
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
