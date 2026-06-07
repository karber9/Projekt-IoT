import type {
  Device,
  OperationRequest,
  OperationResponse,
} from "@/features/types";

export type { Device, OperationRequest, OperationResponse };

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
};

export type RegisterResponse = {
  id: number;
  email: string;
  created_at: string;
};

export type CurrentUser = {
  id: number;
  email: string;
  created_at: string;
};
