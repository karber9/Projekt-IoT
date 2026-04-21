import { EVENT_UI_REGISTRY } from "./registry";
import type { AppEvent, TraceEvent } from "./types";

export function isTraceEvent(event: AppEvent): event is TraceEvent {
  return EVENT_UI_REGISTRY[event.type].isTraceEvent;
}

export function getTraceEvents(events: AppEvent[]): TraceEvent[] {
  return events.filter(isTraceEvent);
}

export function filterEventsByDeviceId<T extends { device_id?: string }>(
  events: T[],
  selectedDeviceId: string
): T[] {
  if (!selectedDeviceId) {
    return events;
  }

  return events.filter((event) => event.device_id === selectedDeviceId);
}

export function sortEventsByTimestamp<T extends { timestamp: string }>(
  events: T[]
): T[] {
  return [...events].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function limitEvents<T>(events: T[], limit: number): T[] {
  return events.slice(0, limit);
}

export function appendEventWithLimit<T>(
  events: T[],
  nextEvent: T,
  limit: number
): T[] {
  return [nextEvent, ...events].slice(0, limit);
}