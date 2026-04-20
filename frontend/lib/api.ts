//!!!!!!!! OLD API FILE. ALL FUNCTIONS WERE MOVED TO DATA SOURCE LAYER. !!!!!!!!!

import { dataSource } from "@/lib/data-sources";
import type {
  Device,
  OperationRequest,
  OperationResponse,
} from "@/features/types";

export type { Device, OperationRequest, OperationResponse };

export async function getDevices(): Promise<Device[]> {
  return dataSource.getDevices();
}

export async function createOperation(
  data: OperationRequest
): Promise<OperationResponse> {
  return dataSource.createOperation(data);
}