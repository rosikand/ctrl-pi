import type { ReactNode } from "react";

interface PageHeaderProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
}

export function PageHeader({
  action,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-medium text-muted">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-[2rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
