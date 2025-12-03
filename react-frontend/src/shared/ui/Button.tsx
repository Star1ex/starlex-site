import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn.js";
import React, { type ButtonHTMLAttributes } from "react";

// This is a component for rendering buttons with different styles and sizes.

const buttonStyles = cva(
  "inline-flex items-center justify-center rounded-xl font-medium transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-[#FF8C7B] text-white hover:bg-[#FF8C7B",
        secondary: "w-full py-3 mt-8 bg-[#d4a89a] text-white font-semibold rounded-md shadow-md hover:bg-[#c69a8c] transition duration-200",
        outline: "border border-gray-300 text-gray-900 hover:bg-gray-100",
      },
      size: {
        sm: "px-3 py-1 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-5 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant,
  size,
  children,
  ...props
}) => {
  return (
    <button
      className={cn(buttonStyles({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
};
