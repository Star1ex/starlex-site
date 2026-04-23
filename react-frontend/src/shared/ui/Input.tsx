import React, { InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full bg-white border-b border-black focus:outline-none focus:border-black py-2 text-black placeholder-gray-400 ${className}`}
      {...props}
    />
  )
);
Input.displayName = 'Input';
