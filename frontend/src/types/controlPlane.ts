export type ArmRole = "leader" | "follower";
export type ConnectionState = "connected" | "degraded" | "disconnected";
export type RunStatus = "running" | "completed" | "failed";
export type EndpointStatus = "ready" | "stopped" | "unreachable";
export type RuntimeName = "LeRobot" | "OpenPI";

export interface JointPreview {
  readonly name: string;
  readonly positionDeg: number;
}

export interface EndEffectorPreview {
  readonly positionM: readonly [number, number, number];
  readonly orientationRpyDeg: readonly [number, number, number];
}

export interface ArmPreview {
  readonly id: string;
  readonly displayName: string;
  readonly canInterface: string;
  readonly role: ArmRole;
  readonly connection: ConnectionState;
  readonly loopHz: number | null;
  readonly loopJitterMs: number | null;
  readonly gripperPercent: number | null;
  readonly joints: readonly JointPreview[];
  readonly endEffector: EndEffectorPreview | null;
  readonly diagnostic: string;
}

export interface RecordingPreview {
  readonly leaderArmId: string;
  readonly followerArmId: string;
  readonly task: string;
  readonly datasetRepo: string;
  readonly teleopState: "idle" | "active";
  readonly recordingState: "idle" | "recording";
  readonly durationSeconds: number;
  readonly episodeCount: number;
}

export interface DatasetPreview {
  readonly repoId: string;
  readonly task: string;
  readonly episodes: number;
  readonly revision: string;
  readonly visibility: "public" | "private";
  readonly updated: string;
}

export interface TrainingRunPreview {
  readonly id: string;
  readonly name: string;
  readonly status: RunStatus;
  readonly step: number;
  readonly totalSteps: number;
  readonly dataset: string;
  readonly baseModel: string;
  readonly runtime: RuntimeName;
  readonly computeTarget: string;
  readonly outputRepo: string | null;
  readonly loss: number | null;
}

export interface ModelPreview {
  readonly repoId: string;
  readonly runtime: RuntimeName;
  readonly revision: string;
  readonly checkpoints: number;
  readonly weights: string;
  readonly updated: string;
}

export interface InferenceEndpointPreview {
  readonly id: string;
  readonly name: string;
  readonly target: string;
  readonly runtime: RuntimeName;
  readonly status: EndpointStatus;
  readonly latencyMs: number | null;
  readonly frequencyHz: number | null;
  readonly loadedPolicy: string | null;
}
