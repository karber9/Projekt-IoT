import type { OperationResponse } from "@/lib/api";
import {
  getOperationStatusMeta,
  isOperationTerminal,
} from "@/features/status/operationStatus";

type BatchResultsTableProps = {
  results: OperationResponse[];
};

export default function BatchResultsTable({ results }: BatchResultsTableProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200">
      <div className="border-b border-slate-200 px-2.5 py-1.5">
        <p className="text-xs font-semibold text-slate-800">Batch results</p>
      </div>
      <div className="max-h-64 overflow-auto">
        <table className="min-w-[520px] w-full table-fixed text-left text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="w-10 px-2.5 py-1.5 font-medium">#</th>
              <th className="px-2.5 py-1.5 font-medium">Expression</th>
              <th className="px-2.5 py-1.5 font-medium">Result</th>
              <th className="px-2.5 py-1.5 font-medium">Device</th>
              <th className="px-2.5 py-1.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map((result, index) => {
              const hasResult =
                result.result !== undefined && result.result !== null;
              const isTerminal = isOperationTerminal(result.status);
              const statusMeta = getOperationStatusMeta(result.status);

              return (
                <tr key={result.operation_id} className="text-slate-700">
                  <td className="px-2.5 py-1.5 text-slate-400">{index + 1}</td>
                  <td className="truncate px-2.5 py-1.5">
                    {result.expression ?? "n/a"}
                  </td>
                  <td className="truncate px-2.5 py-1.5 font-semibold">
                    {hasResult
                      ? String(result.result)
                      : isTerminal
                        ? "No result"
                        : "Waiting..."}
                  </td>
                  <td className="truncate px-2.5 py-1.5">
                    {result.device_id ?? "n/a"}
                  </td>
                  <td className="px-2.5 py-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 ${statusMeta.badgeClassName}`}
                      title={statusMeta.description}
                    >
                      {statusMeta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
