import { NavLink, Outlet } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { PreviewNotice } from "../components/ui/PreviewNotice";
import { classes } from "../lib/classes";

const trainingViews = [
  { label: "Runs", to: "/training/runs" },
  { label: "Models", to: "/training/models" },
] as const;

export function TrainingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="Track externally executed training and the policy artifacts it produces."
        eyebrow="Activity / Artifacts"
        title="Training"
      />

      <nav
        aria-label="Training views"
        className="inline-flex rounded-lg border border-line bg-sidebar p-1"
      >
        {trainingViews.map((view) => (
          <NavLink
            className={({ isActive }) =>
              classes(
                "rounded-md px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand",
                isActive
                  ? "bg-panel text-brand shadow-sm"
                  : "text-muted hover:text-ink",
              )
            }
            key={view.label}
            to={view.to}
          >
            {view.label}
          </NavLink>
        ))}
      </nav>

      <PreviewNotice title="Tracking only in V1" tone="info">
        LeRobot, OpenPI, and custom scripts run outside ctrl-π and will report
        status through the run API. ctrl-π does not launch general training jobs.
      </PreviewNotice>

      <Outlet />
    </div>
  );
}
