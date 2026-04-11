import { useState } from "react";
import { TaskResponse } from "@/lib/api";

type OperationResponseCardProps = {
  response: TaskResponse | null;
  onClose: () => void;
};

export default function OperationResponseCard({
  response,
  onClose,
}: OperationResponseCardProps) {
  const isVisible = !!response;
  const [copied, setCopied] = useState(false);

  const handleCardClick = async () => {
    if (!response) return;

    const textToCopy = [
      "Server Response",
      `task_id: ${response.task_id}`,
      `status: ${response.status}`,
      response.received
        ? `received:\n${JSON.stringify(response.received, null, 2)}`
        : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 900);
    } catch (error) {
      console.error("Failed to copy response:", error);
      onClose();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={[
        "absolute inset-0 z-20 flex h-full w-full cursor-pointer flex-col justify-between bg-blue-600 p-8",
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
              Server Response
            </h2>
  
            <div className="space-y-2 text-sm text-white">
              <p>
                <span className="font-semibold">task_id:</span> {response.task_id}
              </p>
              <p>
                <span className="font-semibold">status:</span> {response.status}
              </p>
  
              {response.received && (
                <div>
                  <p className="mb-1 font-semibold">received:</p>
                  <pre className="overflow-x-auto rounded-lg bg-white/80 p-4 text-black">
                    {JSON.stringify(response.received, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
  
          <p className="pt-6 text-center text-xl font-semibold text-white/90">
            {copied
              ? "Copied"
              : "Click anywhere to copy the response and close this card."}
          </p>
        </>
      )}
    </div>
  );
}