import { PageHeader } from "../components/layout/PageHeader";
import { Badge, type Tone } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Metric } from "../components/ui/Metric";
import { Panel } from "../components/ui/Panel";
import { PreviewNotice } from "../components/ui/PreviewNotice";
import { StatusDot } from "../components/ui/StatusDot";
import { mockEndpoints } from "../mocks/fixtures";
import type { EndpointStatus } from "../types/controlPlane";

const fieldClasses =
  "mt-2 h-10 w-full rounded-md border border-line bg-sidebar px-3.5 text-sm text-muted disabled:opacity-100";
const disabledTitle = "Inference lifecycle arrives after compute and runtime adapters";

function endpointTone(status: EndpointStatus): Tone {
  if (status === "ready") return "success";
  if (status === "unreachable") return "danger";
  return "neutral";
}

export function InferencePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <Button disabled title={disabledTitle} variant="primary">
            Load policy server
          </Button>
        }
        description="Configure native policy servers and observe deployment health without entering the real-time data path."
        eyebrow="Policy serving / Control plane"
        title="Inference"
      />

      <PreviewNotice title="No policy is launched from this preview" tone="info">
        LeRobot and OpenPI remain native peer runtimes. Lambda uses the loopback
        worker over SSH; Modal manages workloads directly without a worker.
      </PreviewNotice>

      <div className="grid gap-4 xl:grid-cols-[minmax(22rem,0.72fr)_minmax(0,1.28fr)]">
        <Panel
          description="Capabilities will reject unsupported runtime/target combinations before launch."
          eyebrow="Desired deployment"
          title="Policy assignment"
        >
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <label className="text-sm font-medium text-ink">
              Robot / arm
              <select className={fieldClasses} disabled value="yam_follower_l" onChange={() => undefined}>
                <option>yam_follower_l</option>
              </select>
            </label>
            <label className="text-sm font-medium text-ink">
              Runtime
              <select className={fieldClasses} disabled value="LeRobot" onChange={() => undefined}>
                <option>LeRobot</option>
                <option>OpenPI</option>
              </select>
            </label>
            <label className="text-sm font-medium text-ink sm:col-span-2">
              Model / checkpoint
              <input
                className={`${fieldClasses} font-mono`}
                disabled
                readOnly
                value="atelier/yam-cube-place-act@step-18000"
              />
            </label>
            <label className="text-sm font-medium text-ink sm:col-span-2">
              Compute target
              <select className={fieldClasses} disabled value="lambda-a10-01" onChange={() => undefined}>
                <option>lambda-a10-01 · Lambda</option>
                <option>modal-a100 · Modal</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3.5 sm:px-5">
            <Button disabled title={disabledTitle} variant="primary">
              Start and load
            </Button>
            <Button disabled title={disabledTitle} variant="danger">
              Stop endpoint
            </Button>
          </div>
        </Panel>

        <Panel
          action={<Badge tone="brand">direct path</Badge>}
          description="FastAPI coordinates lifecycle only; observations and actions bypass ctrl-π."
          eyebrow="Data plane"
          title="Native policy connection"
        >
          <div className="p-4 sm:p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <div className="rounded-lg border border-line bg-sidebar p-4 text-center">
                <p className="text-xs font-medium text-muted">
                  Edge
                </p>
                <p className="mt-2 text-sm font-medium text-ink">Robot-side client</p>
                <p className="mt-1.5 font-mono text-xs text-muted">yam_follower_l</p>
              </div>
              <div className="flex items-center justify-center gap-2 px-2 text-xs font-medium text-success md:flex-col">
                <span className="h-px w-8 bg-success md:h-8 md:w-px" />
                <span>obs / action</span>
                <span className="h-px w-8 bg-success md:h-8 md:w-px" />
              </div>
              <div className="rounded-lg border border-line bg-sidebar p-4 text-center">
                <p className="text-xs font-medium text-muted">
                  Lambda
                </p>
                <p className="mt-2 text-sm font-medium text-ink">LeRobot policy server</p>
                <p className="mt-1.5 font-mono text-xs text-muted">native protocol</p>
              </div>
            </div>
            <p className="mt-4 text-center text-xs leading-5 text-muted">
              ctrl-π → start / stop / load / health only
            </p>
          </div>
        </Panel>
      </div>

      <Panel
        action={<Badge tone="neutral">2 preview endpoints</Badge>}
        eyebrow="Endpoints"
        title="Policy servers"
      >
        <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-line">
          {mockEndpoints.map((endpoint) => (
            <article className="border-b border-line p-4 last:border-b-0 sm:p-5 lg:border-b-0" key={endpoint.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <StatusDot
                    label={endpoint.name}
                    pulse={endpoint.status === "ready"}
                    tone={endpointTone(endpoint.status)}
                  />
                  <p className="mt-1.5 font-mono text-xs text-muted">{endpoint.id}</p>
                </div>
                <Badge tone={endpoint.runtime === "LeRobot" ? "neutral" : "brand"}>
                  {endpoint.runtime}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 border-y border-line py-3.5">
                <Metric label="target" value={endpoint.target} />
                <Metric
                  label="latency"
                  value={endpoint.latencyMs === null ? "—" : `${endpoint.latencyMs} ms`}
                />
                <Metric
                  label="frequency"
                  value={endpoint.frequencyHz === null ? "—" : `${endpoint.frequencyHz} Hz`}
                />
              </div>
              <div className="mt-3">
                <Metric
                  label="loaded policy"
                  value={endpoint.loadedPolicy ?? "none"}
                  detail={endpoint.status}
                />
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
