import { Badge, type Tone } from "../components/ui/Badge";
import { Metric } from "../components/ui/Metric";
import { Panel } from "../components/ui/Panel";
import { mockTrainingRuns } from "../mocks/fixtures";
import type { RunStatus } from "../types/controlPlane";

function runTone(status: RunStatus): Tone {
  if (status === "running") return "info";
  if (status === "completed") return "success";
  return "danger";
}

export function TrainingRunsPage() {
  const activeRun = mockTrainingRuns[0];
  const progress = Math.round((activeRun.step / activeRun.totalSteps) * 100);

  return (
    <div className="space-y-4">
      <Panel
        action={<Badge tone="info">running</Badge>}
        description="Latest state reported by an external LeRobot process."
        eyebrow="Active run / preview"
        title={activeRun.name}
      >
        <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
          <Metric
            label="step"
            value={`${activeRun.step.toLocaleString()} / ${activeRun.totalSteps.toLocaleString()}`}
            detail={`${progress}% complete`}
          />
          <Metric
            label="runtime"
            value={activeRun.runtime}
            detail={activeRun.computeTarget}
          />
          <Metric
            label="loss"
            value={activeRun.loss?.toFixed(4) ?? "—"}
            detail="latest reported"
          />
          <Metric
            label="output"
            value={activeRun.outputRepo ?? "—"}
            detail="Hugging Face model repo"
          />
        </div>
        <div className="px-4 pb-5 sm:px-5">
          <div className="h-1.5 overflow-hidden rounded-full bg-line">
            <div
              aria-hidden="true"
              className="h-full rounded-full bg-info"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Panel>

      <Panel
        action={<Badge tone="neutral">3 preview runs</Badge>}
        eyebrow="Run history"
        title="External training activity"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-sidebar/70 text-sm text-muted">
                <th className="px-5 py-3 font-semibold">Run</th>
                <th className="px-4 py-3 font-semibold">Status / step</th>
                <th className="px-4 py-3 font-semibold">Dataset</th>
                <th className="px-4 py-3 font-semibold">Base model</th>
                <th className="px-4 py-3 font-semibold">Runtime</th>
                <th className="px-5 py-3 text-right font-semibold">Compute</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {mockTrainingRuns.map((run) => (
                <tr key={run.id}>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-ink">{run.name}</p>
                    <p className="mt-1 font-mono text-sm text-muted">{run.id}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone={runTone(run.status)}>{run.status}</Badge>
                    <p className="mt-1.5 font-mono text-sm text-muted">
                      {run.step.toLocaleString()} / {run.totalSteps.toLocaleString()}
                    </p>
                  </td>
                  <td className="max-w-52 truncate px-4 py-4 font-mono text-sm text-muted">
                    {run.dataset}
                  </td>
                  <td className="max-w-56 truncate px-4 py-4 font-mono text-sm text-muted">
                    {run.baseModel}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone={run.runtime === "LeRobot" ? "neutral" : "brand"}>
                      {run.runtime}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-muted">
                    {run.computeTarget}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
