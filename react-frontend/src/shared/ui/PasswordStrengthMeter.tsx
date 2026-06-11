import React from 'react';
import { evaluatePassword } from '@/shared/lib/passwordStrength.js';

type PasswordStrengthMeterProps = {
  password: string;
  showRequirements?: boolean;
};

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  showRequirements = true,
}) => {
  const { score, label, checks } = evaluatePassword(password);
  const level = score >= 5 ? 4 : score >= 4 ? 3 : score >= 3 ? 2 : score >= 2 ? 1 : 0;

  const levelColors = [
    'bg-[color:var(--sx-surface)]',
    'bg-[color:var(--sx-danger)]',
    'bg-[color:var(--priority-high-text)]',
    'bg-[color:var(--priority-low-text)]',
    'bg-[color:var(--status-done-text)]',
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-[color:var(--sx-text-subtle)]">
        <span>Password strength</span>
        <span className="text-[color:var(--sx-text-muted)]">{password ? label : '—'}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, idx) => {
          const isActive = idx < level;
          return (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-colors duration-200 ${
                isActive ? levelColors[level] : 'bg-[color:var(--sx-surface)]'
              }`}
            />
          );
        })}
      </div>
      {showRequirements && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[color:var(--sx-text-subtle)]">
          {checks.map((check) => (
            <div key={check.key} className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${check.met ? 'bg-[color:var(--status-done-text)]' : 'bg-[color:var(--sx-surface)]'}`} />
              <span>{check.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
