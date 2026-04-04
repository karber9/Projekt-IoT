import Spinner from "@/components/Spinner";
import { ALLOWED_OPERATIONS } from "@/features/constants";
import type { Operation } from "@/features/types";

type OperationFormProps = {
  operation: Operation;
  setOperation: (value: Operation) => void;
  a: string;
  setA: (value: string) => void;
  b: string;
  setB: (value: string) => void;
  loading: boolean;
  onSubmit: () => void;
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
}: OperationFormProps) {
  return (
    <div className="space-y-5">
      <div>
        <label
          htmlFor="operation"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Operation
        </label>
        <select
          id="operation"
          value={operation}
          onChange={(e) => setOperation(e.target.value as Operation)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
          className="mb-2 block text-sm font-medium text-slate-700"
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
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div>
        <label
          htmlFor="b"
          className="mb-2 block text-sm font-medium text-slate-700"
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
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {loading && <Spinner />}
        <span>{loading ? "Sending..." : "Send"}</span>
      </button>
    </div>
  );
}