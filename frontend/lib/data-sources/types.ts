import type {
    Device,
    OperationRequest,
    OperationResponse,
  } from "@/features/types";
  
  export interface DataSource {
    getDevices(): Promise<Device[]>;
    createOperation(payload: OperationRequest): Promise<OperationResponse>;
  }