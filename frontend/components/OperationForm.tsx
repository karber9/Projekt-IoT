import Spinner from "@/components/Spinner";
import ErrorAlert from "@/components/ErrorAlert";

type OperationFormProps = {
  expression: string;
  setExpression: (value: string) => void;
  loading: boolean;
  onSubmit: () => void;
  error: string | null;
};

export default function OperationForm({
  expression,
  setExpression,
  loading,
  onSubmit,
  error,
}: OperationFormProps) {
  return (
    <div className="rounded-xl bg-white p-2.5 shadow-sm sm:p-3">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-slate-800">
          Send operation
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter a simple expression. The server assigns it to an online agent.
        </p>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-2 text-xs text-blue-700">
          Target: <span className="font-semibold">server auto-select</span>
        </div>

        <div>
          <label
            htmlFor="expression"
            className="mb-1.5 block text-xs font-medium text-slate-700"
          >
            Expression
          </label>
          <input
            id="expression"
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="eg. 21/7 or 2+4"
            disabled={loading}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Supported operators: +, -, *, /. Example: -5+13.
          </p>
        </div>

        <button
          onClick={onSubmit}
          disabled={loading}
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
