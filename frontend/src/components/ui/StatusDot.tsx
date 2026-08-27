import type { Tone } from "./Badge";
import { classes } from "../../lib/classes";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-subtle",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  brand: "bg-brand",
};

interface StatusDotProps {
  readonly label: string;
  readonly tone?: Tone;
  readonly pulse?: boolean;
}

export function StatusDot({
  label,
  pulse = false,
  tone = "neutral",
}: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-2.5 text-sm text-muted">
      <span className="relative flex size-2" aria-hidden="true">
        {pulse ? (
          <span
            className={classes(
              "absolute inline-flex size-full animate-ping rounded-full opacity-25 motion-reduce:animate-none",
              toneClasses[tone],
            )}
          />
        ) : null}
        <span
          className={classes(
            "relative inline-flex size-2 rounded-full",
            toneClasses[tone],
          )}
        />
      </span>
      <span>{label}</span>
    </span>
  );
}
