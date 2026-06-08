import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn.js";
import React, { type ButtonHTMLAttributes } from "react";

const buttonStyles = cva(
  "liquid-button font-medium transition disabled:opacity-40 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "!bg-[--accent] !border-transparent !text-white hover:brightness-110 shadow-[0_8px_24px_rgba(0,0,0,0.30)]",
        secondary: "liquid-button",
        outline:
          "!bg-transparent border border-white/20 text-white/80 hover:!bg-white/5 hover:!border-white/30",
        ghost:
          "!bg-transparent !border-transparent text-white/60 hover:!bg-white/5 hover:!text-white shadow-none",
        danger:
          "!bg-[rgba(239,68,68,0.15)] !border-[rgba(239,68,68,0.30)] !text-[#fca5a5] hover:!bg-[rgba(239,68,68,0.25)]",
      },
      size: {
        sm:  "!px-3 !py-1.5 text-xs !gap-1.5 !rounded",
        md:  "!px-4 !py-2 text-sm",
        lg:  "!px-5 !py-2.5 text-base",
        xl:  "!px-6 !py-3 text-base",
        icon:"!p-2 !w-8 !h-8",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
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
