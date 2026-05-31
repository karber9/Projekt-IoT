const EXPRESSION_PATTERN =
  /^\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*([+\-*/])\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*$/;

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

type ValidateOperationValuesResult =
  | {
      isValid: true;
      expression: string;
    }
  | {
      isValid: false;
      error: string;
    };

export function validateOperationExpression(
  expression: string
): ValidateOperationValuesResult {
  const normalized = expression.trim();

  if (!normalized) {
    return {
      isValid: false,
      error: "Expression is required.",
    };
  }

  const match = EXPRESSION_PATTERN.exec(normalized);

  if (!match) {
    return {
      isValid: false,
      error: "Use a simple expression like 21/7 or 2+4.",
    };
  }

  const operator = match[2];
  const right = Number(match[3]);

  if (operator === "/" && right === 0) {
    return {
      isValid: false,
      error: "Cannot divide by 0.",
    };
  }

  return {
    isValid: true,
    expression: normalized,
  };
}