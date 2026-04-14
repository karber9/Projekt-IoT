"use client";

import { useState } from "react";
import { createTask, TaskResponse } from "@/lib/api";
import OperationForm from "@/components/OperationForm";
import OperationResponseCard from "@/components/OperationResponseCard";
import DevicesPanel from "@/components/DevicesPanel";
import LogsPanel from "@/components/LogsPanel";
import DashboardHeader from "@/components/DashboardHeader";
import HistoryPanel from "@/components/HistoryPanel";
import { validateOperationValues } from "@/features/validation";
import type { Operation, HistoryItem } from "@/features/types";
import {HISTORY_LIMIT} from "@/features/constants";

export default function Home() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("serwer");
  const [operation, setOperation] = useState<Operation>("add");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [response, setResponse] = useState<TaskResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);

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
        device_id: selectedDeviceId,
      });

      setResponse(data);

      if (data !== null) {
        const newHistoryItem: HistoryItem = {
          id: crypto.randomUUID(),
          operation,
          a: parsedA,
          b: parsedB,
          response: "success",
        };

        setHistory((prev) => [newHistoryItem, ...prev].slice(0, HISTORY_LIMIT));
      }
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
    <main className="h-screen bg-slate-100 mx-auto flex flex-col px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <DashboardHeader />

        <div className="mt-6 min-h-0 grid flex-1 gap-6 lg:grid-cols-12">
          <div className="min-h-0 lg:col-span-2">
            <DevicesPanel
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={(id) =>
                setSelectedDeviceId((prev) => (prev === id ? "serwer" : id))
              }
            />
          </div>

          <section className="relative min-h-0 overflow-hidden rounded-2xl bg-white shadow-sm lg:col-span-4">
            <div className="relative p-4">
              <OperationForm
                operation={operation}
                setOperation={setOperation}
                a={a}
                setA={setA}
                b={b}
                setB={setB}
                loading={loading}
                onSubmit={handleSubmit}
                error={error}
              />
            </div>

            <OperationResponseCard
              response={response}
              onClose={() => setResponse(null)}
            />
          </section>

          <div className="min-h-0 lg:col-span-2">
            <HistoryPanel history={history} />
          </div>

          <div className="min-h-0 lg:col-span-4">
            <LogsPanel selectedDeviceId={selectedDeviceId} />
          </div>
        </div>
    </main>
  );
}