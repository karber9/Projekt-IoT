import { useEffect, useState } from "react";
import {
  ApiUnauthorizedError,
  createOperation,
  getOperationStatus,
  type OperationResponse,
} from "@/lib/api";
import { HISTORY_LIMIT } from "@/features/constants";
import type { HistoryItem } from "@/features/types";
import type { RealtimeEvent } from "@/features/realtime/types";
import { validateOperationExpression } from "@/features/validation";

const OPERATION_POLL_INTERVAL_MS = 1500;
const OPERATION_TIMEOUT_MS = 20000;

type UseSingleOperationOptions = {
  realtimeEvents: RealtimeEvent[];
  onUnauthorized: () => void;
};

export function useSingleOperation({
  realtimeEvents,
  onUnauthorized,
}: UseSingleOperationOptions) {
  const [expression, setExpression] = useState("");
  const [response, setResponse] = useState<OperationResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!response) {
      return;
    }

    const taskEvents = realtimeEvents.filter(
      (event) => event.type === "task.updated"
    );
    const matchingEvent = taskEvents.find(
      (event) => String(event.task_id) === response.operation_id
    );

    if (!matchingEvent) {
      return;
    }

    setResponse((currentResponse) => {
      if (
        !currentResponse ||
        currentResponse.operation_id !== String(matchingEvent.task_id)
      ) {
        return currentResponse;
      }

      const nextDeviceId = matchingEvent.device_id ?? currentResponse.device_id;
      if (
        currentResponse.status === matchingEvent.status &&
        currentResponse.result === matchingEvent.result &&
        currentResponse.device_id === nextDeviceId
      ) {
        return currentResponse;
      }

      return {
        ...currentResponse,
        status: matchingEvent.status,
        result: matchingEvent.result,
        device_id: nextDeviceId,
      };
    });
  }, [realtimeEvents, response]);

  useEffect(() => {
    if (!response || (response.result !== undefined && response.result !== null)) {
      return;
    }

    let isCancelled = false;
    let pollTimeoutId: number | null = null;
    const startedAt = Date.now();

    const pollOperationStatus = async () => {
      if (isCancelled) {
        return;
      }

      if (Date.now() - startedAt >= OPERATION_TIMEOUT_MS) {
        setResponse((currentResponse) => {
          if (
            !currentResponse ||
            currentResponse.operation_id !== response.operation_id ||
            (currentResponse.result !== undefined &&
              currentResponse.result !== null)
          ) {
            return currentResponse;
          }

          return {
            ...currentResponse,
            status: "timeout",
            result: "No response from device before timeout.",
          };
        });
        return;
      }

      try {
        const statusResponse = await getOperationStatus(response.operation_id);

        if (isCancelled) {
          return;
        }

        if (statusResponse.result !== undefined && statusResponse.result !== null) {
          setResponse((currentResponse) => {
            if (
              !currentResponse ||
              currentResponse.operation_id !== response.operation_id
            ) {
              return currentResponse;
            }

            return {
              ...currentResponse,
              ...statusResponse,
              device_id: statusResponse.device_id ?? currentResponse.device_id,
            };
          });
          return;
        }
      } catch (err) {
        if (err instanceof ApiUnauthorizedError) {
          onUnauthorized();
          return;
        }
      }

      pollTimeoutId = window.setTimeout(
        pollOperationStatus,
        OPERATION_POLL_INTERVAL_MS
      );
    };

    pollTimeoutId = window.setTimeout(
      pollOperationStatus,
      OPERATION_POLL_INTERVAL_MS
    );

    return () => {
      isCancelled = true;
      if (pollTimeoutId !== null) {
        window.clearTimeout(pollTimeoutId);
      }
    };
  }, [onUnauthorized, response]);

  const submitOperation = async () => {
    setError("");
    setResponse(null);

    const validationResult = validateOperationExpression(expression);

    if (!validationResult.isValid) {
      setError(validationResult.error);
      return;
    }

    setLoading(true);

    try {
      const data = await createOperation({
        expression: validationResult.expression,
      });

      setResponse(data);

      const newHistoryItem: HistoryItem = {
        id: crypto.randomUUID(),
        expression: validationResult.expression,
        device_id: data.device_id,
        operation_id: data.operation_id,
        status: data.status,
      };

      setHistory((currentHistory) =>
        [newHistoryItem, ...currentHistory].slice(0, HISTORY_LIMIT)
      );
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        onUnauthorized();
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error occurred while sending task request.");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    expression,
    setExpression,
    response,
    setResponse,
    error,
    loading,
    history,
    submitOperation,
  };
}
