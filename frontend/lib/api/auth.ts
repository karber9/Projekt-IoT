import type {
  CurrentUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/lib/api/types";
import { requireOk, request } from "@/lib/api/client";

function normalizeUserResponse(result: unknown): CurrentUser {
  if (
    !result ||
    typeof result !== "object" ||
    !("id" in result) ||
    typeof result.id !== "number" ||
    !("email" in result) ||
    typeof result.email !== "string" ||
    !("created_at" in result) ||
    typeof result.created_at !== "string"
  ) {
    throw new Error("Invalid user response from server.");
  }

  return {
    id: result.id,
    email: result.email,
    created_at: result.created_at,
  };
}

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const result = await requireOk(
    await request("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }),
    "Invalid email or password."
  );

  if (
    !result ||
    typeof result !== "object" ||
    !("access_token" in result) ||
    typeof result.access_token !== "string"
  ) {
    throw new Error("Invalid login response from server.");
  }

  return {
    access_token: result.access_token,
    token_type:
      "token_type" in result && typeof result.token_type === "string"
        ? result.token_type
        : "bearer",
  };
}

export async function registerUser(
  data: RegisterRequest
): Promise<RegisterResponse> {
  const result = await requireOk(
    await request("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }),
    "Registration failed."
  );

  return normalizeUserResponse(result);
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const result = await requireOk(await request("/auth/me"), "Session expired.");

  return normalizeUserResponse(result);
}
