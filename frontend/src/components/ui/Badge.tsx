import type { HTMLAttributes, PropsWithChildren } from "react";
import { classes } from "../../lib/classes";

export type Tone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "brand";

const toneClasses: Record<Tone, string> = {
  neutral: "border-line bg-sidebar text-muted",
  success: "border-success/20 bg-success-soft text-success",
  warning: "border-warning/20 bg-warning-soft text-warning",
  danger: "border-danger/20 bg-danger-soft text-danger",
  info: "border-info/20 bg-info-soft text-info",
  brand: "border-brand/15 bg-brand-soft text-brand",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly tone?: Tone;
}

export function Badge({
  children,
  className,
  tone = "neutral",
  ...props
}: PropsWithChildren<BadgeProps>) {
  return (
    <span
      className={classes(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium leading-none",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
