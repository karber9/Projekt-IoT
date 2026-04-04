"use client";

import { useState } from "react";
import { createTask, TaskResponse } from "@/lib/api";
import OperationForm from "@/components/OperationForm";
import OperationResponseCard from "@/components/OperationResponseCard";
import ErrorAlert from "@/components/ErrorAlert";
import DevicesPanel from "@/components/DevicesPanel";
import ConnectionStatusPanel from "@/components/ConnectionStatusPanel";
import LogsPanel from "@/components/LogsPanel";
import { validateOperationValues } from "@/features/validation";
import type { Operation } from "@/features/types";

export default function Home() {
  const [operation, setOperation] = useState<Operation>("add");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [response, setResponse] = useState<TaskResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setResponse(null);

    const validationResult = validateOperationValues({ operation, a, b });

    if (!validationResult.isValid) {
      setError(validationResult.error);
      return;
    }

    const { parsedA, parsedB } = validationResult;

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
  <main className="min-h-screen bg-slate-100">
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
          Control Center
        </p>
        <h1 className="text-3xl font-bold text-slate-800">
          Operations Dashboard
        </h1>
        <p className="text-sm text-slate-500">
          Send operations to the backend, monitor responses, and prepare the app
          for device communication and connection tracking.
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-800">
              Send operation
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose an operation, enter values, and send the request to the
              server.
            </p>
          </div>

          <OperationForm
            operation={operation}
            setOperation={setOperation}
            a={a}
            setA={setA}
            b={b}
            setB={setB}
            loading={loading}
            onSubmit={handleSubmit}
          />

          <ErrorAlert message={error} />
          <OperationResponseCard response={response} />
        </section>

        <aside className="space-y-6">
          <DevicesPanel />
          <ConnectionStatusPanel />
          <LogsPanel />
        </aside>
      </div>
    </div>
  </main>
 );
}