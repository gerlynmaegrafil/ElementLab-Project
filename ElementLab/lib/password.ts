export type PasswordCheck = { label: string; passed: boolean };

export function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    { label: "8+ characters", passed: password.length >= 8 },
    { label: "Uppercase letter (A-Z)", passed: /[A-Z]/.test(password) },
    { label: "Lowercase letter (a-z)", passed: /[a-z]/.test(password) },
    { label: "Number (0-9)", passed: /[0-9]/.test(password) },
    {
      label: "Special character (!@#$...)",
      passed: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export type StrengthLabel =
  | "Very Weak"
  | "Weak"
  | "Fair"
  | "Strong"
  | "Very Strong";

const LEVELS: { label: StrengthLabel; color: string }[] = [
  { label: "Very Weak", color: "#e53935" },
  { label: "Weak", color: "#fb8c00" },
  { label: "Fair", color: "#fdd835" },
  { label: "Strong", color: "#7cb342" },
  { label: "Very Strong", color: "#2e7d32" },
];

export function getPasswordStrength(password: string) {
  const checks = getPasswordChecks(password);
  const score = checks.filter((c) => c.passed).length; // 0-5
  const idx = Math.min(score, LEVELS.length - 1);
  return { score, ...LEVELS[idx] };
}

// We require ALL rules to pass — "strong strong" as requested.
export function isPasswordStrongEnough(password: string): boolean {
  return getPasswordChecks(password).every((c) => c.passed);
}
