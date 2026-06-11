import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn.js";
import React, { type ButtonHTMLAttributes } from "react";

const buttonStyles = cva(
  "liquid-button font-medium transition disabled:opacity-40 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "!bg-[color:var(--sx-accent)] !border-transparent !text-[color:var(--sx-accent-contrast)] hover:brightness-110",
        secondary: "liquid-button",
        outline:
          "!bg-transparent border border-[color:var(--sx-line)] text-[color:var(--sx-text-muted)] hover:!bg-[color:var(--sx-surface-hover)] hover:!border-[color:var(--sx-line-strong)] hover:text-[color:var(--sx-text)]",
        ghost:
          "!bg-transparent !border-transparent text-[color:var(--sx-text-subtle)] hover:!bg-[color:var(--sx-surface-hover)] hover:!text-[color:var(--sx-text)] shadow-none",
        danger:
          "!bg-[color:color-mix(in_srgb,var(--sx-danger)_14%,transparent)] !border-transparent !text-[color:var(--sx-danger)] hover:!bg-[color:color-mix(in_srgb,var(--sx-danger)_22%,transparent)]",
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
