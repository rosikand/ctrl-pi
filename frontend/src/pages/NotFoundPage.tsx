import { Link } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";

export function NotFoundPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="That control-plane route does not exist. No state was changed."
        eyebrow="404 / Route"
        title="Page not found"
      />
      <div className="rounded-lg border border-line bg-panel p-6">
        <Link
          className="inline-flex h-9 items-center rounded-md border border-line-strong bg-panel px-3.5 text-sm font-medium text-ink transition-colors hover:bg-sidebar focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          to="/arms"
        >
          Return to Arms
        </Link>
      </div>
    </div>
  );
}
