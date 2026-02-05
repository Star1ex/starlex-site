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
    'bg-gray-200',
    'bg-red-400',
    'bg-yellow-400',
    'bg-blue-400',
    'bg-green-500',
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-gray-500 dark:text-dark-text-muted">
        <span>Password strength</span>
        <span className="text-gray-700 dark:text-dark-text">{password ? label : '—'}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, idx) => {
          const isActive = idx < level;
          return (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-colors duration-200 ${
                isActive ? levelColors[level] : 'bg-gray-200/70 dark:bg-dark-border'
              }`}
            />
          );
        })}
      </div>
      {showRequirements && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-dark-text-muted">
          {checks.map((check) => (
            <div key={check.key} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${check.met ? 'bg-green-500' : 'bg-gray-300 dark:bg-dark-border'}`} />
              <span>{check.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
