import type { EventType } from "./types";

export type EventUiDefinition = {
  label: string;
  shortLabel: string;
  accentClassName: string;
  isTraceEvent: boolean;
};

export const EVENT_UI_REGISTRY: Record<EventType, EventUiDefinition> = {
  mqtt_outgoing: {
    label: "MQTT outgoing",
    shortLabel: "OUT",
    accentClassName: "bg-blue-500",
    isTraceEvent: true,
  },
  mqtt_incoming: {
    label: "MQTT incoming",
    shortLabel: "IN",
    accentClassName: "bg-emerald-500",
    isTraceEvent: true,
  },
  operation_result: {
    label: "Operation result",
    shortLabel: "RES",
    accentClassName: "bg-violet-500",
    isTraceEvent: true,
  },
  device_updated: {
    label: "Device updated",
    shortLabel: "DEV",
    accentClassName: "bg-amber-500",
    isTraceEvent: false,
  },
};