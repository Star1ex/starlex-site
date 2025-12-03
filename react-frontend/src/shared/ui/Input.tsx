import React, { InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full bg-[#F3E6DE] border-b border-[#d4a89a] focus:outline-none focus:border-[#c69a8c] py-2 text-[#60392f] placeholder-[#b68f84] ${className}`}
      {...props}
    />
  )
);
Input.displayName = 'Input';

