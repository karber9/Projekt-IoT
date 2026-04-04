"use client";

import { useState } from "react";
import { createTask, TaskResponse } from "@/lib/api";
import OperationForm from "@/components/OperationForm";
import OperationResponseCard from "@/components/OperationResponseCard";
import ErrorAlert from "@/components/ErrorAlert";
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
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold text-slate-800">
          FastAPI Task Sender
        </h1>
        <p className="mb-8 text-sm text-slate-500">
          Send a task to the FastAPI backend and see the response. Fill in the
          form below and click Send button to submit.
        </p>

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
      </div>
    </main>
  );
}