import { ALLOWED_OPERATIONS } from "./constants";

export type Operation = (typeof ALLOWED_OPERATIONS)[number];

export type DeviceStatus = "online" | "offline" | "busy" | "error" | "unknown";
export type DeviceEncryptionStatus =
  | "unknown"
  | "available"
  | "missing_key"
  | "error";

export type Device = {
  device_id: string;
  status?: DeviceStatus | string;
  name?: string;
  last_seen?: string;
  encryption_status?: DeviceEncryptionStatus | string;
  public_key_fingerprint?: string;
  last_key_rotation?: string;
};

export type OperationRequest = {
  expression: string;
};

export type OperationResponse = {
  operation_id: string;
  task_id?: number;
  user_id?: number;
  expression?: string;
  device_id?: string;
  status: string;
  result?: string | number | null;
};

export type HistoryItem = {
  id: string;
  expression: string;
  device_id?: string;
  operation_id?: string;
  status: string;
};
