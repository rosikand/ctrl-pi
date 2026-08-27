import { PageHeader } from "../components/layout/PageHeader";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Metric } from "../components/ui/Metric";
import { Panel } from "../components/ui/Panel";
import { PreviewNotice } from "../components/ui/PreviewNotice";
import { mockDatasets } from "../mocks/fixtures";

const selectedDataset = mockDatasets[0];

export function DatasetsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <Button disabled title="Hugging Face discovery arrives in milestone 5">
            Refresh namespace
          </Button>
        }
        description="Discover datasets in a configured Hugging Face namespace, then inspect synchronized demonstrations."
        eyebrow="Artifacts / Hugging Face"
        title="Datasets"
      />

      <PreviewNotice title="Server-side Hub access" tone="warning">
        These are preview records. Private datasets and media will be fetched by
        the backend so HF_TOKEN never enters the browser bundle.
      </PreviewNotice>

      <Panel
        action={<Badge tone="neutral">3 preview repos</Badge>}
        description="Basic repository discovery and metadata land before the episode visualizer."
        eyebrow="Namespace"
        title="atelier"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-sidebar/70 text-sm text-muted">
                <th className="px-5 py-3 font-semibold">Repository</th>
                <th className="px-4 py-3 font-semibold">Task</th>
                <th className="px-4 py-3 font-semibold">Episodes</th>
                <th className="px-4 py-3 font-semibold">Revision</th>
                <th className="px-5 py-3 text-right font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {mockDatasets.map((dataset, index) => (
                <tr className={index === 0 ? "bg-brand-soft/35" : ""} key={dataset.repoId}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-ink">
                        {dataset.repoId}
                      </span>
                      <Badge tone={dataset.visibility === "private" ? "neutral" : "success"}>
                        {dataset.visibility}
                      </Badge>
                    </div>
                  </td>
                  <td className="max-w-xs truncate px-4 py-4 text-sm text-muted">
                    {dataset.task}
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-ink">
                    {dataset.episodes}
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-muted">
                    {dataset.revision}
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-muted">
                    {dataset.updated}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(21rem,0.75fr)]">
        <Panel
          action={<Badge tone="brand">episode 000031</Badge>}
          description={selectedDataset.task}
          eyebrow="Episode visualizer / future"
          title={selectedDataset.repoId}
        >
          <div className="p-4 sm:p-5">
            <div className="relative aspect-video overflow-hidden rounded-md border border-line bg-[#e7ecef]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(255_255_255/0.8)_0,transparent_52%)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted">
                    Synchronized camera
                  </p>
                  <p className="mt-1 text-xs text-muted">Video proxy not implemented</p>
                </div>
              </div>
              <div className="absolute right-3 bottom-3 font-mono text-xs text-muted">
                00:06.42 / 00:18.70
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between font-mono text-xs text-muted">
                <span>0.00 s</span>
                <span>timeline preview</span>
                <span>18.70 s</span>
              </div>
              <input
                aria-label="Episode timeline preview"
                className="mt-2 w-full accent-brand disabled:opacity-70"
                disabled
                max="100"
                min="0"
                readOnly
                type="range"
                value="34"
              />
            </div>
          </div>
        </Panel>

        <Panel eyebrow="Synchronized sample" title="State / action">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 p-4 sm:p-5">
            <Metric label="timestamp" value="6.420 s" detail="source clock" />
            <Metric label="frame" value="000192" detail="30 fps" />
            <Metric label="state.j1" value="+0.216 rad" detail="preview" />
            <Metric label="action.j1" value="+0.221 rad" detail="preview" />
            <Metric label="state.grip" value="0.684" detail="normalized" />
            <Metric label="action.grip" value="0.701" detail="normalized" />
          </div>
          <div className="border-t border-line px-4 py-3.5 sm:px-5">
            <p className="text-xs leading-5 text-muted">
              Values are visual fixtures, not fetched artifact data. Rich timeline
              synchronization is milestone 7.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
