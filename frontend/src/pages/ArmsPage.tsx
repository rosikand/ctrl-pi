import { Button } from "../components/ui/Button";
import { Badge, type Tone } from "../components/ui/Badge";
import { Metric } from "../components/ui/Metric";
import { Panel } from "../components/ui/Panel";
import { PreviewNotice } from "../components/ui/PreviewNotice";
import { StatusDot } from "../components/ui/StatusDot";
import { PageHeader } from "../components/layout/PageHeader";
import { mockArms } from "../mocks/fixtures";
import type { ArmPreview, ConnectionState } from "../types/controlPlane";

const disabledControlTitle = "Available with MockYAMDriver in milestone 3";

function connectionTone(connection: ConnectionState): Tone {
  if (connection === "connected") return "success";
  if (connection === "degraded") return "warning";
  return "neutral";
}

function connectionLabel(connection: ConnectionState): string {
  if (connection === "connected") return "Connected";
  if (connection === "degraded") return "Degraded";
  return "Disconnected";
}

function formatVector(values: readonly number[], unit: string): string {
  return values.map((value) => value.toFixed(3)).join("  ") + ` ${unit}`;
}

function ArmCard({ arm }: { readonly arm: ArmPreview }) {
  const endEffector = arm.endEffector;
  const hasTelemetry = arm.joints.length > 0 && endEffector !== null;

  return (
    <article className="rounded-lg border border-line bg-panel p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <StatusDot
            label={arm.id}
            pulse={arm.connection === "connected"}
            tone={connectionTone(arm.connection)}
          />
          <p className="mt-1 truncate text-sm text-muted">{arm.displayName}</p>
        </div>
        <Badge tone={arm.role === "follower" ? "success" : "neutral"}>
          {arm.role}
        </Badge>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-y border-line py-3.5">
        <Metric
          label="loop"
          value={arm.loopHz === null ? "—" : `${arm.loopHz.toFixed(1)} Hz`}
          detail={
            arm.loopJitterMs === null ? "no stream" : `±${arm.loopJitterMs} ms`
          }
        />
        <Metric
          label="gripper"
          value={
            arm.gripperPercent === null ? "—" : `${arm.gripperPercent.toFixed(0)}%`
          }
          detail={arm.gripperPercent === null ? "no data" : "normalized"}
        />
        <Metric
          label="joints"
          value={arm.joints.length === 0 ? "—" : `${arm.joints.length}/6 ok`}
          detail={arm.canInterface}
        />
      </div>

      {hasTelemetry ? (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-medium text-muted">
              Joint position / deg
            </p>
            <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-2 sm:grid-cols-6">
              {arm.joints.map((joint) => (
                <div key={joint.name}>
                  <p className="font-mono text-xs text-muted">{joint.name}</p>
                  <p className="mt-1 font-mono text-sm text-ink">
                    {joint.positionDeg.toFixed(1)}°
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-3 rounded-md bg-sidebar px-3 py-2.5 sm:grid-cols-2">
            <Metric
              label="EEF xyz"
              value={formatVector(endEffector.positionM, "m")}
            />
            <Metric
              label="EEF rpy"
              value={formatVector(endEffector.orientationRpyDeg, "deg")}
            />
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-dashed border-line-strong px-3 py-6 text-center">
          <p className="text-xs font-medium text-muted">No live telemetry</p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <StatusDot
          label={connectionLabel(arm.connection)}
          tone={connectionTone(arm.connection)}
        />
        <Button disabled size="sm" title={disabledControlTitle}>
          Inspect
        </Button>
      </div>
    </article>
  );
}

export function ArmsPage() {
  const connectedArms = mockArms.filter(
    (arm) => arm.connection === "connected",
  ).length;

  return (
    <div className="space-y-8">
      <PageHeader
        action={
          <Button disabled title={disabledControlTitle}>
            Re-scan CAN bus
          </Button>
        }
        description="Observe connected YAM arms, current control state, and bounded manual-control surfaces."
        eyebrow="Cell / CAN bus"
        title="Arms"
      />

      <PreviewNotice title="Mock arm snapshot" tone="warning">
        Static milestone-one fixtures are shown below. Live telemetry and jog
        commands arrive with MockYAMDriver; no hardware action is sent from this
        screen.
      </PreviewNotice>

      <Panel className="grid sm:grid-cols-3 sm:divide-x sm:divide-line">
        <div className="px-5 py-4 sm:px-6 sm:py-5">
          <Metric
            label="CAN interfaces"
            value="2 configured"
            detail="can0 healthy · can1 degraded"
          />
        </div>
        <div className="border-t border-line px-5 py-4 sm:border-t-0 sm:px-6 sm:py-5">
          <Metric
            label="Connected arms"
            value={`${connectedArms} / ${mockArms.length}`}
            detail="1 heartbeat unavailable"
          />
        </div>
        <div className="border-t border-line px-5 py-4 sm:border-t-0 sm:px-6 sm:py-5">
          <Metric
            label="Telemetry"
            value="ephemeral"
            detail="newest state wins · not persisted"
          />
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        {mockArms.map((arm) => (
          <ArmCard arm={arm} key={arm.id} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.72fr)]">
        <Panel
          description="Press-and-hold semantics and real motion limits are required before this can be enabled."
          eyebrow="Manual control"
          title="Jog selected arm"
        >
          <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div>
              <label
                className="text-sm font-medium text-ink"
                htmlFor="jog-arm"
              >
                Arm
              </label>
              <select
                className="mt-2 h-10 w-full rounded-md border border-line bg-sidebar px-3.5 font-mono text-sm text-muted"
                disabled
                id="jog-arm"
                value="yam_follower_l"
                onChange={() => undefined}
              >
                <option>yam_follower_l</option>
              </select>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["X−", "Y+", "Z+", "X+", "Y−", "Z−"].map((direction) => (
                  <Button
                    disabled
                    key={direction}
                    size="sm"
                    title={disabledControlTitle}
                  >
                    {direction}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              className="w-full md:w-auto"
              disabled
              title={disabledControlTitle}
              variant="danger"
            >
              Stop motion
            </Button>
          </div>
        </Panel>

        <Panel eyebrow="Diagnostics" title="Cell health">
          <div className="divide-y divide-line px-4 sm:px-5">
            {mockArms.map((arm) => (
              <div
                className="flex items-center justify-between gap-4 py-3"
                key={arm.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm text-ink">{arm.id}</p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {arm.diagnostic}
                  </p>
                </div>
                <Badge tone={connectionTone(arm.connection)}>
                  {connectionLabel(arm.connection).toLowerCase()}
                </Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
