import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Metric } from "../components/ui/Metric";
import { Panel } from "../components/ui/Panel";
import { mockModels } from "../mocks/fixtures";

export function TrainingModelsPage() {
  return (
    <Panel
      action={<Badge tone="neutral">2 preview repos</Badge>}
      description="Weights remain on Hugging Face Hub; ctrl-π stores only references and active assignments."
      eyebrow="Hugging Face / preview"
      title="Model repositories"
    >
      <div className="divide-y divide-line">
        {mockModels.map((model) => (
          <article
            className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(8rem,0.45fr))_auto] lg:items-center"
            key={model.repoId}
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-sm font-medium text-ink">
                {model.repoId}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone={model.runtime === "LeRobot" ? "neutral" : "brand"}>
                  {model.runtime}
                </Badge>
                <Badge tone="success">model</Badge>
              </div>
            </div>
            <Metric label="revision" value={model.revision} detail={model.updated} />
            <Metric
              label="checkpoints"
              value={model.checkpoints.toString()}
              detail="Hub revisions"
            />
            <Metric label="weights" value={model.weights} detail="artifact metadata" />
            <Button disabled size="sm" title="Hub model discovery arrives in milestone 8">
              Inspect
            </Button>
          </article>
        ))}
      </div>
    </Panel>
  );
}
