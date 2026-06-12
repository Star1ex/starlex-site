import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/lib/cn.js';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-label-sm text-[color:var(--sx-text-muted)] font-inter font-medium"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'glass-input',
            error && '!shadow-[var(--sx-focus-ring)]',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-[color:var(--sx-danger)]">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
