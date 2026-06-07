"use client";

import { useEffect, useMemo, useState } from "react";
import { RealtimeClient } from "@/lib/websocket/client";
import type {
  RealtimeConnectionStatus,
  RealtimeEvent,
} from "@/features/realtime/types";

const EVENT_LIMIT = 500;

export function useRealtimeEvents(token: string | null) {
  const [status, setStatus] = useState<RealtimeConnectionStatus>("idle");
  const [errorState, setErrorState] = useState({
    token: "",
    message: "",
  });
  const [eventState, setEventState] = useState<{
    token: string;
    events: RealtimeEvent[];
  }>({
    token: "",
    events: [],
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    const client = new RealtimeClient({
      token,
      onStatusChange: setStatus,
      onError: (message) => setErrorState({ token, message }),
      onEvent: (event) => {
        setEventState((current) => {
          const currentEvents = current.token === token ? current.events : [];

          return {
            token,
            events: [
              { ...event, received_at: new Date().toISOString() },
              ...currentEvents,
            ].slice(0, EVENT_LIMIT),
          };
        });
      },
    });

    client.connect();

    return () => client.disconnect();
  }, [token]);

  return useMemo(
    () => ({
      status: token ? status : "idle",
      error:
        token && errorState.token === token ? errorState.message : "",
      events: token && eventState.token === token ? eventState.events : [],
    }),
    [errorState, eventState, status, token]
  );
}
