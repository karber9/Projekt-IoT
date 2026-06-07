import { ALLOWED_OPERATIONS } from "./constants";
import type { Operation } from "./types";

export const parseNumber = (value: string): number | null => {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
};

type ValidateOperationValuesParams = {
  operation: Operation;
  a: string;
  b: string;
};

type ValidateOperationValuesResult =
  | {
      isValid: true;
      parsedA: number;
      parsedB: number;
    }
  | {
      isValid: false;
      error: string;
    };

export function validateOperationValues({
  operation,
  a,
  b,
}: ValidateOperationValuesParams): ValidateOperationValuesResult {
  if (!ALLOWED_OPERATIONS.includes(operation)) {
    return {
      isValid: false,
      error: "Selected operation is not allowed.",
    };
  }

  const parsedA = parseNumber(a);
  const parsedB = parseNumber(b);

  if (parsedA === null || parsedB === null) {
    return {
      isValid: false,
      error: "A and B must be valid finite numbers.",
    };
  }

  if (operation === "divide" && parsedB === 0) {
    return {
      isValid: false,
      error: "B cannot be 0 when dividing.",
    };
  }

  return {
    isValid: true,
    parsedA,
    parsedB,
  };
}