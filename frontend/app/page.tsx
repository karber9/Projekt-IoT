"use client";

import { useState } from "react";
import { createTask, TaskResponse } from "@/lib/api";
import OperationForm from "@/components/OperationForm";
import OperationResponseCard from "@/components/OperationResponseCard";
import ErrorAlert from "@/components/ErrorAlert";
import DevicesPanel from "@/components/DevicesPanel";
import LogsPanel from "@/components/LogsPanel";
import DashboardHeader from "@/components/DashboardHeader";
import { validateOperationValues } from "@/features/validation";
import type { Operation } from "@/features/types";
import { mockLogs } from "@/data/mockDevices";


export default function Home() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    mockLogs[0].id
  );
  const [operation, setOperation] = useState<Operation>("add");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [response, setResponse] = useState<TaskResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedDevice = mockLogs.find(
    (device) => device.id === selectedDeviceId
  );

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
      <div className="mx-auto px-16 py-16">
        <DashboardHeader />
  
        <div className="mt-6 grid gap-6 lg:grid-cols-8">
          <div className="lg:col-span-2">
            <DevicesPanel 
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={setSelectedDeviceId}
            />
          </div>
          
          <section className="rounded-2xl bg-white p-8 shadow-sm lg:col-span-3">
          <div className="mb-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
            Target destination:{" "}
            <span className="font-semibold">
              {selectedDevice?.id ?? "Unknown device"}
            </span>
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

          <div className="lg:col-span-3">
            <LogsPanel selectedDeviceId={selectedDeviceId} />
          </div>
        </div>
      </div>
    </main>
  );
}