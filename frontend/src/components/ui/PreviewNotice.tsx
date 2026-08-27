import type { Tone } from "./Badge";
import { classes } from "../../lib/classes";

const noticeClasses: Record<Tone, string> = {
  neutral: "border-line bg-sidebar",
  success: "border-success/20 bg-success-soft",
  warning: "border-warning/20 bg-warning-soft",
  danger: "border-danger/20 bg-danger-soft",
  info: "border-info/20 bg-info-soft",
  brand: "border-brand/15 bg-brand-soft",
};

interface PreviewNoticeProps {
  readonly title: string;
  readonly children: string;
  readonly tone?: Tone;
}

export function PreviewNotice({
  children,
  title,
  tone = "info",
}: PreviewNoticeProps) {
  return (
    <aside
      className={classes(
        "rounded-md border px-4 py-3.5 sm:flex sm:items-baseline sm:gap-2.5",
        noticeClasses[tone],
      )}
    >
      <p className="shrink-0 text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted sm:mt-0">{children}</p>
    </aside>
  );
}
