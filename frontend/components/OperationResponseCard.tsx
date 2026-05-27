import { useState } from "react";
import { type OperationResponse } from "@/lib/api";
import {
  getOperationStatusMeta,
  hasOperationFailed,
} from "@/features/status/operationStatus";

type OperationResponseCardProps = {
  response: OperationResponse | null;
  onClose: () => void;
};

export default function OperationResponseCard({
  response,
  onClose,
}: OperationResponseCardProps) {
  const isVisible = !!response;
  const [copiedResultKey, setCopiedResultKey] = useState<string | null>(null);
  const hasResult = response?.result !== undefined && response.result !== null;
  const resultText = hasResult ? String(response.result) : "";
  const statusMeta = response
    ? getOperationStatusMeta(response.status)
    : getOperationStatusMeta("");
  const isFailed = response ? hasOperationFailed(response.status) : false;
  const resultKey = response ? `${response.operation_id}:${resultText}` : "";
  const copied = copiedResultKey === resultKey;

  const copyResultAndClose = async () => {
    if (!response) return;
    if (!hasResult) return;

    try {
      await navigator.clipboard.writeText(resultText);
      setCopiedResultKey(resultKey);

      setTimeout(() => {
        onClose();
      }, 900);
    } catch {
      onClose();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!hasResult) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      void copyResultAndClose();
    }
  };

  return (
    <div
      role={hasResult ? "button" : "status"}
      tabIndex={hasResult ? 0 : -1}
      onClick={() => {
        void copyResultAndClose();
      }}
      onKeyDown={handleKeyDown}
      className={[
        "absolute inset-0 z-20 flex h-full w-full flex-col justify-between bg-blue-600 p-5",
        hasResult ? "cursor-pointer" : "cursor-wait",
        "transition-transform duration-500 ease-in-out",
        isVisible
          ? "translate-y-0 pointer-events-auto"
          : "-translate-y-[120%] pointer-events-none",
      ].join(" ")}
    >
      {response && (
        <>
          <div>
            <h2 className="mb-3 text-lg font-semibold text-white">
              Operation result
            </h2>

            <div className="space-y-3 text-xs text-white">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClassName}`}
              >
                {statusMeta.label}
              </span>
              <p className="text-white/80">
                {hasResult
                  ? isFailed
                    ? "Operation finished with an error."
                    : "Operation completed."
                  : "Waiting for the device response..."}
              </p>

              {hasResult ? (
                <pre className="max-h-64 overflow-auto rounded-lg bg-white/15 p-3 text-base font-semibold text-white whitespace-pre-wrap break-words">
                  {resultText}
                </pre>
              ) : (
                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-white/80" />
                </div>
              )}

              {response.device_id && (
                <p className="text-xs text-white/70">
                  Device: {response.device_id}
                </p>
              )}
            </div>
          </div>

          <p className="pt-4 text-center text-base font-semibold text-white/90">
            {!hasResult
              ? "Please wait..."
              : copied
                ? "Copied"
                : "Click anywhere to copy the result and close this card."}
          </p>
        </>
      )}
    </div>
  );
}
