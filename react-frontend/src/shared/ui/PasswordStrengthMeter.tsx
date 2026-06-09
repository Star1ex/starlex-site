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
    'bg-white/12',
    'bg-red-400',
    'bg-yellow-400',
    'bg-blue-400',
    'bg-green-500',
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-white/36">
        <span>Password strength</span>
        <span className="text-white/68">{password ? label : '—'}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, idx) => {
          const isActive = idx < level;
          return (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-colors duration-200 ${
                isActive ? levelColors[level] : 'bg-white/8'
              }`}
            />
          );
        })}
      </div>
      {showRequirements && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/42">
          {checks.map((check) => (
            <div key={check.key} className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${check.met ? 'bg-green-500' : 'bg-white/10'}`} />
              <span>{check.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
