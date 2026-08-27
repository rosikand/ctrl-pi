import type { PropsWithChildren, ReactNode } from "react";
import { classes } from "../../lib/classes";

interface PanelProps {
  readonly className?: string;
  readonly eyebrow?: string;
  readonly title?: string;
  readonly description?: string;
  readonly action?: ReactNode;
}

export function Panel({
  action,
  children,
  className,
  description,
  eyebrow,
  title,
}: PropsWithChildren<PanelProps>) {
  const hasHeader = eyebrow || title || description || action;

  return (
    <section
      className={classes(
        "rounded-lg border border-line bg-panel",
        className,
      )}
    >
      {hasHeader ? (
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-xs font-medium text-muted">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="mt-1 text-base font-semibold text-ink">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}
