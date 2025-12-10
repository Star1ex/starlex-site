import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn.js";
import React, { type ButtonHTMLAttributes } from "react";


const buttonStyles = cva(
  "inline-flex items-center justify-center rounded-xl font-medium transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-black text-white hover:bg-gray-800",
        secondary: "bg-black text-white shadow-md hover:bg-gray-800 w-full py-3 font-semibold rounded-md transition-colors duration-200",
        outline: "border border-black text-black hover:bg-gray-200",
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
