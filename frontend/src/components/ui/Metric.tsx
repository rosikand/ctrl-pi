import type { ReactNode } from "react";

interface MetricProps {
  readonly label: string;
  readonly value: ReactNode;
  readonly detail?: string;
}

export function Metric({ detail, label, value }: MetricProps) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted">
        {label}
      </p>
      <p className="mt-1.5 truncate font-mono text-sm font-medium text-ink">
        {value}
      </p>
      {detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}
    </div>
  );
}
