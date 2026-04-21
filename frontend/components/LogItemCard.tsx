import { EVENT_UI_REGISTRY } from "@/features/events/registry";
import type { TraceEvent } from "@/features/events/types";

type LogItemCardProps = {
  event: TraceEvent;
};

function getEventDetails(event: TraceEvent): string {
  switch (event.type) {
    case "mqtt_outgoing":
      return `${event.device_id} · ${event.message}`;
    case "mqtt_incoming":
      return `${event.device_id} · ${event.message}`;
    case "operation_result":
      return `${event.device_id} · result: ${event.result}`;
  }
}

export default function LogItemCard({ event }: LogItemCardProps) {
  const eventUi = EVENT_UI_REGISTRY[event.type];
  const details = getEventDetails(event);

  return (
    <div
      className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1 text-[11px] leading-4 text-slate-700"
      title={`${event.message} | ${event.device_id} | ${event.operation_id}`}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${eventUi.accentClassName}`}
      />
      <span className="shrink-0 font-semibold text-slate-600">
        {eventUi.shortLabel}
      </span>
      <span className="truncate">{details}</span>
    </div>
  );
}