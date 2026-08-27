import { PageHeader } from "../components/layout/PageHeader";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Metric } from "../components/ui/Metric";
import { Panel } from "../components/ui/Panel";
import { PreviewNotice } from "../components/ui/PreviewNotice";
import { StatusDot } from "../components/ui/StatusDot";
import { mockRecording } from "../mocks/fixtures";

const fieldClasses =
  "mt-2 h-10 w-full rounded-md border border-line bg-sidebar px-3.5 text-sm text-muted disabled:opacity-100";
const disabledTitle = "Recording lifecycle arrives in milestone 4";

export function RecordPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="Pair leader and follower YAM arms, run teleoperation, and capture LeRobot-style demonstrations."
        eyebrow="Capture / LeRobot"
        title="Record / Teleop"
      />

      <PreviewNotice title="Interface preview" tone="info">
        Pairing, camera, teleoperation, recording, finalization, and Hub upload
        controls are intentionally disabled until their mock service lifecycle is
        implemented.
      </PreviewNotice>

      <div className="grid gap-4 xl:grid-cols-[minmax(22rem,0.72fr)_minmax(0,1.28fr)]">
        <div className="space-y-4">
          <Panel
            description="One leader drives one follower for the initial YAM workflow."
            eyebrow="Setup"
            title="Arm pair"
          >
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <label className="text-sm font-medium text-ink">
                Leader arm
                <select
                  className={fieldClasses}
                  disabled
                  value={mockRecording.leaderArmId}
                  onChange={() => undefined}
                >
                  <option value="yam_leader_l">yam_leader_l</option>
                </select>
              </label>
              <label className="text-sm font-medium text-ink">
                Follower arm
                <select
                  className={fieldClasses}
                  disabled
                  value={mockRecording.followerArmId}
                  onChange={() => undefined}
                >
                  <option value="yam_follower_l">yam_follower_l</option>
                </select>
              </label>
              <label className="text-sm font-medium text-ink sm:col-span-2">
                Task
                <input
                  className={fieldClasses}
                  disabled
                  value={mockRecording.task}
                  readOnly
                />
              </label>
              <label className="text-sm font-medium text-ink sm:col-span-2">
                Dataset repository
                <input
                  className={`${fieldClasses} font-mono`}
                  disabled
                  value={mockRecording.datasetRepo}
                  readOnly
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3.5 sm:px-5">
              <Button disabled title={disabledTitle} variant="primary">
                Start teleoperation
              </Button>
              <Button disabled title={disabledTitle}>
                Record episode
              </Button>
            </div>
          </Panel>

          <Panel eyebrow="Session" title="Recording status">
            <div className="grid grid-cols-3 gap-4 p-4 sm:p-5">
              <Metric label="status" value="Idle" detail="not recording" />
              <Metric label="duration" value="00:00.0" detail="current episode" />
              <Metric
                label="episodes"
                value={mockRecording.episodeCount.toString()}
                detail="staged dataset"
              />
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-3.5 sm:px-5">
              <StatusDot label="Local staging ready" tone="success" />
              <Badge tone="neutral">not uploaded</Badge>
            </div>
          </Panel>
        </div>

        <Panel
          action={<Badge tone="neutral">preview</Badge>}
          description="Camera and arm state will share source timestamps during capture."
          eyebrow="Live state"
          title="Operator view"
        >
          <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
            {["Overhead camera", "Wrist camera"].map((camera, index) => (
              <div
                className="relative aspect-[4/3] overflow-hidden rounded-md border border-line bg-[#e8edf0]"
                key={camera}
              >
                <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_49.5%,rgb(255_255_255/0.38)_50%,transparent_50.5%),linear-gradient(to_bottom,transparent_49.5%,rgb(255_255_255/0.38)_50%,transparent_50.5%)] bg-[size:48px_48px]" />
                <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                  <Badge>{camera}</Badge>
                  <Badge tone="success">cam_{index}</Badge>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-md border border-line-strong bg-panel/90 px-3 py-2 text-center shadow-sm backdrop-blur-sm">
                    <p className="text-sm font-medium text-ink">Camera preview</p>
                    <p className="mt-1 text-xs text-muted">Stream not connected</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid gap-3 border-t border-line p-4 sm:grid-cols-3 sm:p-5">
            <Metric label="leader loop" value="499.8 Hz" detail="mock snapshot" />
            <Metric label="follower loop" value="500.0 Hz" detail="mock snapshot" />
            <Metric label="clock offset" value="—" detail="not measured" />
          </div>
        </Panel>
      </div>
    </div>
  );
}
