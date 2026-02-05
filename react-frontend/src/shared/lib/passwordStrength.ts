export type PasswordCheck = {
  key: string;
  label: string;
  test: (value: string) => boolean;
};

export const passwordChecks: PasswordCheck[] = [
  { key: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'Uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Lowercase letter', test: (v) => /[a-z]/.test(v) },
  { key: 'number', label: 'Number', test: (v) => /[0-9]/.test(v) },
  { key: 'symbol', label: 'Symbol', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export const evaluatePassword = (password: string) => {
  const checks = passwordChecks.map((check) => ({
    ...check,
    met: check.test(password),
  }));
  const score = checks.filter((c) => c.met).length;
  let label = 'Weak';
  if (score >= 5) label = 'Strong';
  else if (score >= 4) label = 'Good';
  else if (score >= 3) label = 'Fair';
  return { score, label, checks };
};
