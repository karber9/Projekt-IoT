const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 6;

export function validateEmail(value: string): string | null {
  if (!value.trim()) {
    return "Email is required.";
  }

  if (!EMAIL_PATTERN.test(value.trim())) {
    return "Enter a valid email address.";
  }

  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) {
    return "Password is required.";
  }

  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must have at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return null;
}

export function validateLoginForm(email: string, password: string): string | null {
  return validateEmail(email) ?? validatePassword(password);
}

export function validateRegisterForm(
  email: string,
  password: string,
  confirmPassword: string
): string | null {
  const baseError = validateEmail(email) ?? validatePassword(password);

  if (baseError) {
    return baseError;
  }

  if (!confirmPassword) {
    return "Confirm password is required.";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}
