"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import BatchFileInstructions from "@/components/BatchFileInstructions";
import BatchResultsTable from "@/components/BatchResultsTable";
import ErrorAlert from "@/components/ErrorAlert";
import Spinner from "@/components/Spinner";
import {
  getOperationStatus,
  uploadBatchFile,
  type OperationResponse,
} from "@/lib/api";
import {
  type BatchOperation,
  parseOperationsFile,
} from "@/features/batch/parseOperationsFile";
import {
  downloadTextReport,
  generateBatchReport,
} from "@/features/batch/generateBatchReport";
import type { RealtimeEvent } from "@/features/realtime/types";
import {
  hasOperationFailed,
  isOperationTerminal,
} from "@/features/status/operationStatus";

type BatchState = {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
};

const emptyBatchState: BatchState = {
  total: 0,
  pending: 0,
  running: 0,
  completed: 0,
  failed: 0,
};

const BATCH_RESULT_POLL_INTERVAL_MS = 1000;
const BATCH_RESULT_TIMEOUT_MS = 30000;

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(durationMs: number) {
  return `${(durationMs / 1000).toFixed(1)}s`;
}

function hasFinalResult(response: OperationResponse) {
  return (
    response.result !== undefined ||
    response.result === null ||
    isOperationTerminal(response.status)
  );
}

function sleep(durationMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

type BatchOperationsPanelProps = {
  realtimeEvents?: RealtimeEvent[];
};

export default function BatchOperationsPanel({
  realtimeEvents = [],
}: BatchOperationsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [operations, setOperations] = useState<BatchOperation[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [report, setReport] = useState("");
  const [batchResults, setBatchResults] = useState<OperationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [batchState, setBatchState] = useState<BatchState>(emptyBatchState);

  useEffect(() => {
    const latestProgress = realtimeEvents.find(
      (event) => event.type === "batch.progress"
    );

    if (!latestProgress) {
      return;
    }

    setBatchState({
      total: latestProgress.total,
      pending: latestProgress.pending,
      running: latestProgress.running,
      completed: latestProgress.completed,
      failed: latestProgress.failed,
    });
  }, [realtimeEvents]);

  const progress = useMemo(() => {
    if (batchState.total === 0) {
      return 0;
    }

    return Math.round(
      ((batchState.completed + batchState.failed) / batchState.total) * 100
    );
  }, [batchState]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError("");
    setSuccess("");
    setReport("");
    setBatchResults([]);
    setSelectedFile(null);
    setOperations([]);
    setBatchState(emptyBatchState);

    if (!file) {
      return;
    }

    const content = await file.text();
    const result = parseOperationsFile(content, file.name);

    if (!result.isValid) {
      setError(result.error);
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setOperations(result.operations);
    setBatchState({
      total: result.operations.length,
      pending: result.operations.length,
      running: 0,
      completed: 0,
      failed: 0,
    });
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setOperations([]);
    setError("");
    setSuccess("");
    setReport("");
    setBatchResults([]);
    setBatchState(emptyBatchState);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    setError("");
    setSuccess("");
    setReport("");
    setBatchResults([]);

    if (!selectedFile) {
      setError("Choose a JSON or CSV file before upload.");
      return;
    }

    setLoading(true);
    setBatchState((current) => ({
      ...current,
      pending: 0,
      running: current.total,
      completed: 0,
      failed: 0,
    }));

    try {
      const startedAt = Date.now();
      const response = await uploadBatchFile(selectedFile);
      setBatchResults(response);
      setBatchState({
        total: response.length,
        pending: response.length,
        running: response.length,
        completed: 0,
        failed: 0,
      });

      const finalResponses = await waitForBatchResults(response);
      const durationMs = Date.now() - startedAt;
      const failed = finalResponses.filter((item) =>
        hasOperationFailed(item.status)
      ).length;
      const completed = finalResponses.length - failed;
      const collectedResults = finalResponses.filter(hasFinalResult).length;
      const message =
        collectedResults === finalResponses.length
          ? `Completed ${finalResponses.length} operations in ${formatDuration(durationMs)}.`
          : `Collected ${collectedResults}/${finalResponses.length} results in ${formatDuration(durationMs)}.`;

      setBatchState({
        total: finalResponses.length,
        pending: 0,
        running: 0,
        completed,
        failed,
      });
      setSuccess(message);
      setReport(
        createReport("success", message, finalResponses, undefined, durationMs)
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Batch upload failed.";
      setError(message);
      setReport(createReport("error", "Batch upload failed.", [], message));
      setBatchState((current) => ({
        ...current,
        running: 0,
        failed: current.total,
      }));
    } finally {
      setLoading(false);
    }
  };

  const createReport = (
    status: "success" | "error",
    message: string,
    responses: OperationResponse[] = [],
    errorDetails?: string,
    durationMs?: number
  ) =>
    generateBatchReport({
      fileName: selectedFile?.name ?? "not selected",
      operationCount: operations.length,
      status,
      message,
      durationMs,
      responses,
      errorDetails,
    });

  const waitForBatchResults = async (
    queuedResponses: OperationResponse[]
  ): Promise<OperationResponse[]> => {
    const startedAt = Date.now();
    let latestResponses = queuedResponses;

    while (Date.now() - startedAt < BATCH_RESULT_TIMEOUT_MS) {
      const statusResponses = await Promise.all(
        latestResponses.map(async (response) => {
          if (hasFinalResult(response)) {
            return response;
          }

          try {
            const statusResponse = await getOperationStatus(
              response.operation_id
            );

            return {
              ...response,
              ...statusResponse,
              device_id: response.device_id ?? statusResponse.device_id,
            };
          } catch {
            return response;
          }
        })
      );

      latestResponses = statusResponses;
      setBatchResults(latestResponses);
      const completed = latestResponses.filter(hasFinalResult).length;
      setBatchState({
        total: latestResponses.length,
        pending: latestResponses.length - completed,
        running: latestResponses.length - completed,
        completed,
        failed: latestResponses.filter((item) =>
          hasOperationFailed(item.status)
        ).length,
      });

      if (completed === latestResponses.length) {
        return latestResponses;
      }

      await sleep(BATCH_RESULT_POLL_INTERVAL_MS);
    }

    const timedOutResponses = latestResponses.map((response) =>
      hasFinalResult(response)
        ? response
        : {
            ...response,
            status: "timeout",
            result: "No result received before timeout.",
          }
    );
    setBatchResults(timedOutResponses);
    return timedOutResponses;
  };

  return (
    <section className="rounded-xl bg-white p-3 shadow-sm">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-slate-800">
          File batch
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Upload JSON or CSV with multiple operations.
        </p>
      </div>

      <div className="space-y-3">
        <BatchFileInstructions />

        <div>
          <label
            htmlFor="batch-file"
            className="mb-1.5 block text-xs font-medium text-slate-700"
          >
            Operations file
          </label>
          <input
            ref={fileInputRef}
            id="batch-file"
            type="file"
            accept=".json,.csv,application/json,text/csv"
            onChange={handleFileChange}
            disabled={loading}
            className="block w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-50 file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 disabled:cursor-not-allowed"
          />
        </div>

        {selectedFile && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-2 text-xs text-blue-700">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{selectedFile.name}</p>
                <p className="mt-1">
                  {formatFileSize(selectedFile.size)} - {operations.length}{" "}
                  operations detected
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={loading}
                className="rounded-lg border border-blue-200 px-2 py-1 font-semibold text-blue-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2 text-xs text-slate-600">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span>Total: {batchState.total}</span>
            <span>Pending: {batchState.pending}</span>
            <span>Running: {batchState.running}</span>
            <span>Completed: {batchState.completed}</span>
            <span>Failed: {batchState.failed}</span>
            <span>Progress: {progress}%</span>
          </div>
        </div>

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-2 text-xs font-semibold text-green-700">
            {success}
          </div>
        )}

        <BatchResultsTable results={batchResults} />

        <button
          type="button"
          onClick={handleUpload}
          disabled={loading || !selectedFile}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading && <Spinner />}
          <span>{loading ? "Processing..." : "Upload file"}</span>
        </button>

        {report && (
          <button
            type="button"
            onClick={() =>
              downloadTextReport("batch-operations-report.txt", report)
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Download TXT report
          </button>
        )}

        <ErrorAlert message={error} />
      </div>
    </section>
  );
}
