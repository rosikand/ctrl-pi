import type { ButtonHTMLAttributes } from "react";
import { classes } from "../../lib/classes";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-brand bg-brand text-white hover:bg-brand/92 disabled:border-line-strong disabled:bg-line disabled:text-subtle",
  secondary:
    "border-line-strong bg-panel text-ink hover:border-brand/35 hover:bg-sidebar disabled:border-line disabled:bg-panel disabled:text-subtle",
  danger:
    "border-danger/30 bg-danger-soft text-danger hover:bg-danger/10 disabled:border-line disabled:bg-panel disabled:text-subtle",
  ghost:
    "border-transparent bg-transparent text-muted hover:bg-panel hover:text-ink disabled:text-subtle",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-10 px-4 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
}

export function Button({
  className,
  size = "md",
  type = "button",
  variant = "secondary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={classes(
        "inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
