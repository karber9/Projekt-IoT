import { ALLOWED_OPERATIONS } from "@/features/constants";
import type { Operation } from "@/features/types";

export type BatchOperation = {
  operation: Operation;
  a: number;
  b: number;
};

type ParseResult =
  | {
      isValid: true;
      operations: BatchOperation[];
    }
  | {
      isValid: false;
      error: string;
    };

export const SUPPORTED_BATCH_EXTENSIONS = [".json", ".csv"] as const;

function isOperation(value: unknown): value is Operation {
  return (
    typeof value === "string" &&
    ALLOWED_OPERATIONS.includes(value as Operation)
  );
}

function toBatchOperation(value: unknown, index: number): BatchOperation {
  if (!value || typeof value !== "object") {
    throw new Error(`Row ${index + 1} is not an object.`);
  }

  const item = value as Record<string, unknown>;
  const operation = item.operation;
  const a = Number(item.a);
  const b = Number(item.b);

  if (!isOperation(operation)) {
    throw new Error(`Row ${index + 1} has unsupported operation.`);
  }

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error(`Row ${index + 1} has invalid numeric values.`);
  }

  if (operation === "divide" && b === 0) {
    throw new Error(`Row ${index + 1} divides by zero.`);
  }

  return { operation, a, b };
}

function parseCsv(content: string): BatchOperation[] {
  const [headerLine, ...rows] = content.trim().split(/\r?\n/);

  if (!headerLine) {
    throw new Error("CSV file is empty.");
  }

  const headers = headerLine.split(",").map((header) => header.trim());

  if (
    !headers.includes("operation") ||
    !headers.includes("a") ||
    !headers.includes("b")
  ) {
    throw new Error("CSV file must include operation,a,b headers.");
  }

  return rows
    .filter((row) => row.trim())
    .map((row, index) => {
      const values = row.split(",").map((value) => value.trim());
      const record = Object.fromEntries(
        headers.map((header, valueIndex) => [header, values[valueIndex]])
      );

      return toBatchOperation(record, index);
    });
}

export function parseOperationsFile(
  content: string,
  filename: string
): ParseResult {
  try {
    if (!content.trim()) {
      return { isValid: false, error: "File is empty." };
    }

    const isCsv = filename.toLowerCase().endsWith(".csv");
    const isJson = filename.toLowerCase().endsWith(".json");

    if (!isCsv && !isJson) {
      return {
        isValid: false,
        error: "Unsupported file type. Use JSON or CSV.",
      };
    }

    const operations = isCsv
      ? parseCsv(content)
      : parseJsonOperations(content);

    if (operations.length === 0) {
      return { isValid: false, error: "File does not contain operations." };
    }

    return { isValid: true, operations };
  } catch (err) {
    return {
      isValid: false,
      error:
        err instanceof Error
          ? err.message
          : "Unable to parse operations file.",
    };
  }
}

function parseJsonOperations(content: string): BatchOperation[] {
  const data = JSON.parse(content) as unknown;

  if (!Array.isArray(data)) {
    throw new Error("JSON file must contain an array of operations.");
  }

  return data.map(toBatchOperation);
}
