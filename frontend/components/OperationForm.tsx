import Spinner from "@/components/Spinner";
import { ALLOWED_OPERATIONS } from "@/features/constants";
import type { Operation } from "@/features/types";
import ErrorAlert from "@/components/ErrorAlert";

type OperationFormProps = {
  operation: Operation;
  setOperation: (value: Operation) => void;
  a: string;
  setA: (value: string) => void;
  b: string;
  setB: (value: string) => void;
  loading: boolean;
  onSubmit: () => void;
  error: string | null;
  selectedDeviceId: string;
  selectedDeviceStatus?: string;
};

export default function OperationForm({
  operation,
  setOperation,
  a,
  setA,
  b,
  setB,
  loading,
  onSubmit,
  error,
  selectedDeviceId,
  selectedDeviceStatus,
}: OperationFormProps) {
  const selectedDeviceUnavailable =
    Boolean(selectedDeviceId) && selectedDeviceStatus !== "online";
  const targetLabel = selectedDeviceId
    ? `${selectedDeviceId}${selectedDeviceStatus ? ` (${selectedDeviceStatus})` : ""}`
    : "server auto-select";

  return (
    <div className="rounded-xl bg-white p-2.5 shadow-sm sm:p-3">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-slate-800">
          Send operation
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Choose an operation, enter values, and send the request to the server.
        </p>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-2 text-xs text-blue-700">
          Target:{" "}
          <span className="break-words font-semibold">
            {targetLabel}
          </span>
        </div>

        {selectedDeviceUnavailable && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
            Selected device is not online. Choose another device or use server
            auto-select.
          </div>
        )}

        <div>
          <label
            htmlFor="operation"
            className="mb-1.5 block text-xs font-medium text-slate-700"
          >
            Operation
          </label>
          <select
            id="operation"
            value={operation}
            onChange={(e) => setOperation(e.target.value as Operation)}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            {ALLOWED_OPERATIONS.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="a"
            className="mb-1.5 block text-xs font-medium text-slate-700"
          >
            A value
          </label>
          <input
            id="a"
            type="number"
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="eg. 2"
            step="any"
            disabled={loading}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
          />
        </div>

        <div>
          <label
            htmlFor="b"
            className="mb-1.5 block text-xs font-medium text-slate-700"
          >
            B value
          </label>
          <input
            id="b"
            type="number"
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder="eg. 3"
            step="any"
            disabled={loading}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
          />
        </div>

        <button
          onClick={onSubmit}
          disabled={loading || selectedDeviceUnavailable}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {loading && <Spinner />}
          <span>{loading ? "Sending..." : "Send"}</span>
        </button>

        <ErrorAlert message={error || ""} />
      </div>
    </div>
  );
}
