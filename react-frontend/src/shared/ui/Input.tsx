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
            className="text-label-sm text-white/60 font-inter font-medium"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'glass-input',
            error && '!border-[rgba(239,68,68,0.50)] focus:!shadow-[inset_0_1px_1px_rgba(255,255,255,0.10),0_0_0_1px_rgba(239,68,68,0.40)]',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-[#fca5a5]">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
