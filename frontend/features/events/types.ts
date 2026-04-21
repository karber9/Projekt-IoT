export type EventType =
  | "mqtt_outgoing"
  | "mqtt_incoming"
  | "operation_result"
  | "device_updated";

type BaseEvent = {
  id: string;
  type: EventType;
  timestamp: string;
  message: string;
  device_id?: string;
  operation_id?: string;
};

export type MqttOutgoingEvent = BaseEvent & {
  type: "mqtt_outgoing";
  device_id: string;
  operation_id: string;
  topic: string;
  payload?: Record<string, unknown>;
  direction: "outgoing";
};

export type MqttIncomingEvent = BaseEvent & {
  type: "mqtt_incoming";
  device_id: string;
  operation_id: string;
  topic: string;
  payload?: Record<string, unknown>;
  direction: "incoming";
};

export type OperationResultEvent = BaseEvent & {
  type: "operation_result";
  device_id: string;
  operation_id: string;
  result: number;
};

export type DeviceUpdatedEvent = BaseEvent & {
  type: "device_updated";
};

export type AppEvent =
  | MqttOutgoingEvent
  | MqttIncomingEvent
  | OperationResultEvent
  | DeviceUpdatedEvent;

export type TraceEvent =
  | MqttOutgoingEvent
  | MqttIncomingEvent
  | OperationResultEvent;