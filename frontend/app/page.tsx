"use client";

import { useState } from "react";
import { createTask, TaskResponse } from "@/lib/api";

const ALLOWED_OPERATIONS = ["add", "subtract", "multiply", "divide"] as const;
type Operation = (typeof ALLOWED_OPERATIONS)[number];

export default function Home() {
  const [operation, setOperation] = useState<Operation>("add");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [response, setResponse] = useState<TaskResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const parseNumber = (value: string): number | null => {
    if (value.trim() === "") {
      return null;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return null;
    }

    return parsed;
  };

  const handleSubmit = async () => {
    setError("");
    setResponse(null);

    if (!ALLOWED_OPERATIONS.includes(operation)) {
      setError("Selected operation is not allowed.");
      return;
    }

    const parsedA = parseNumber(a);
    const parsedB = parseNumber(b);

    if (parsedA === null || parsedB === null) {
      setError("A and B must be valid finite numbers.");
      return;
    }

    if (operation === "divide" && parsedB === 0) {
      setError("B cannot be 0 when dividing.");
      return;
    }

    setLoading(true);

    try {
      const data = await createTask({
        operation,
        a: parsedA,
        b: parsedB,
      });

      setResponse(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error occurred while sending task request.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold text-slate-800">
          FastAPI Task Sender
        </h1>
        <p className="mb-8 text-sm text-slate-500">
          Send a task to the FastAPI backend and see the response.
          Fill in the form below and click Send button to submit.
        </p>

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
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {response && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="mb-3 text-lg font-semibold text-slate-800">
              Server Response
            </h2>

            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-semibold">task_id:</span>{" "}
                {response.task_id}
              </p>
              <p>
                <span className="font-semibold">status:</span>{" "}
                {response.status}
              </p>
              {response.received && (
                <div>
                  <p className="mb-1 font-semibold">received:</p>
                  <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-slate-100">
                    {JSON.stringify(response.received, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}