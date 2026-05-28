import { validateOperationExpression } from "@/features/validation";

export type BatchOperation = {
  expression: string;
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

export const SUPPORTED_BATCH_EXTENSIONS = [".json", ".csv", ".txt"] as const;

function toBatchOperation(value: unknown, index: number): BatchOperation {
  const expression =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? (value as Record<string, unknown>).expression
        : null;

  if (typeof expression !== "string") {
    throw new Error(`Row ${index + 1} must be an expression.`);
  }

  const validation = validateOperationExpression(expression);

  if (!validation.isValid) {
    throw new Error(`Row ${index + 1}: ${validation.error}`);
  }

  return { expression: validation.expression };
}

function parseCsv(content: string): BatchOperation[] {
  const [headerLine, ...rows] = content.trim().split(/\r?\n/);

  if (!headerLine) {
    throw new Error("CSV file is empty.");
  }

  const headers = headerLine.split(",").map((header) => header.trim());

  if (!headers.includes("expression")) {
    return [headerLine, ...rows]
      .filter((row) => row.trim())
      .map((row, index) => toBatchOperation(row, index));
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

function parseText(content: string): BatchOperation[] {
  return content
    .trim()
    .split(/\r?\n/)
    .filter((row) => row.trim())
    .map((row, index) => toBatchOperation(row, index));
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
    const isTxt = filename.toLowerCase().endsWith(".txt");

    if (!isCsv && !isJson && !isTxt) {
      return {
        isValid: false,
        error: "Unsupported file type. Use JSON, CSV, or TXT.",
      };
    }

    const operations = isCsv
      ? parseCsv(content)
      : isTxt
        ? parseText(content)
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
