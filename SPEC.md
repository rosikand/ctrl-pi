# ctrl-π V1 specification

Status: canonical working specification  
Last updated: 2026-08-27

This document is the source of truth for V1. Where README copy, mock UI, or
implementation details disagree with it, this document wins. **MUST**, **SHOULD**,
and **MAY** are normative.

## 1. Purpose

`ctrl-π` is an open-source, self-hosted web console for the standard YAM robot
learning loop:

```text
Connect → Record / Teleop → Datasets → Training → Inference → Evaluate
```

A researcher should be able to clone the repository, configure PostgreSQL and
Hugging Face, connect an edge machine to YAM CAN hardware, connect optional GPU
compute, and perform the basic workflow without adopting a hosted ctrl-π service.
The system is a control plane: it coordinates and observes work but does not sit
in high-frequency robot-policy data paths.

## 2. V1 goals and boundaries

V1 MUST:

- run locally or on the user's YAM-connected edge machine;
- use a browser over the LAN when the backend runs on that edge machine;
- support mock development through a `MockYAMDriver`;
- preserve independent LeRobot and OpenPI runtime implementations;
- store small mutable control-plane state in PostgreSQL;
- treat Hugging Face Hub as the source of truth for datasets and models;
- support user-managed Lambda GPU machines through SSH and `ctrl-pi-worker`;
- support managed Modal inference workloads without requiring the worker;
- let external training code report run state through a small API/SDK; and
- remain sparse, understandable, and safe to operate.

V1 MUST NOT add Kubernetes, Redis, a message queue, ctrl-π user accounts,
multi-user collaboration, fleet management, automatic Lambda VM provisioning,
general training orchestration, or reimplementations of LeRobot/OpenPI network
protocols. Training runs outside ctrl-π in V1. Common training recipes may be
buttonized later.

## 3. Vocabulary

- **Arm/robot**: one configured YAM arm endpoint in V1. The initial `robots`
  table uses this practical one-row-per-arm interpretation until multi-arm robot
  composition is explicitly designed.
- **Leader/follower pair**: two arms assigned to one teleoperation session.
- **Recording**: mutable control-plane metadata for one capture session.
- **Episode**: one intentionally recorded demonstration inside a LeRobot-style
  dataset.
- **Runtime**: framework adapter that loads and supervises a native policy
  server, initially `LeRobotRuntime` or `OpenPIRuntime`.
- **Compute target**: a place where a supported workload can run, initially
  local, Lambda, or Modal as allowed by the feature.
- **Inference endpoint**: a reachable native policy server plus observed health.
- **Deployment**: the desired/active assignment of a model and endpoint to a
  robot.

## 4. Product navigation and requirements

There MUST be exactly five primary tabs, in this order. Compute is shared
configuration and MUST NOT be a primary tab.

### 4.1 Arms

Arms monitors and controls connected YAM arms. It MUST provide:

- CAN and connection status;
- leader/follower role;
- low-latency live joint state;
- end-effector position and orientation;
- gripper state;
- control-loop rate, latency/jitter, and error statistics where available;
- basic diagnostics; and
- deliberately simple manual jog/control.

Live telemetry and jog commands are ephemeral. Real-hardware manual control MUST
gain explicit motion limits, press-and-hold/dead-man behavior, stop-on-release,
and stop-on-disconnect before it is enabled.

### 4.2 Record / Teleop

Record / Teleop optimizes for the standard YAM plus LeRobot workflow rather than
being a generic robotics recorder. It MUST provide:

- leader and follower selection;
- live arm and camera state;
- start/stop teleoperation;
- start/stop episode recording;
- task and episode metadata;
- recording state, elapsed duration, and episode count; and
- finalization and upload of LeRobot-style datasets to Hugging Face Hub.

Teleoperation and recording are separate lifecycle states. A recording is not a
dataset artifact until it is intentionally finalized. Interrupted recording or
upload MUST surface a recoverable/error state rather than silently reporting
success.

### 4.3 Datasets

Datasets reads robot datasets in the configured Hugging Face namespace. It MUST
eventually provide dataset list, metadata/task, episode count, revisions, an
episode browser, camera/video, synchronized state/action values, and timeline
scrubbing.

Delivery is incremental: namespace discovery and metadata precede the rich
episode visualizer. Private assets MUST be fetched or proxied by the backend
when authentication is required. `HF_TOKEN` MUST never enter browser code.

### 4.4 Training

Training MUST contain two secondary views, **Runs** and **Models**.

Runs shows current and past run status, current step, dataset, base model,
runtime/framework, compute target, configuration, metrics/curves when present,
and output model repository. Models shows Hugging Face model repositories,
revisions, weights, and checkpoints.

LeRobot and OpenPI are first-class peers. Framework-specific behavior MUST live
behind runtime/training adapters. External LeRobot, OpenPI, or custom scripts on
local GPUs, Lambda, Modal, or other machines MAY create and update run records
through the ctrl-π run API/SDK while checkpoints go directly to Hugging Face.
V1 MUST NOT provide a general-purpose "Train" orchestrator.

### 4.5 Inference

Inference MUST provide robot/arm, model/checkpoint, runtime, compute target, and
endpoint selection plus start, stop, and load controls. It MUST display endpoint
health, latency, inference frequency, and the loaded policy.

The first-class runtimes are LeRobot and OpenPI. The first-class targets are
local, Lambda, and Modal where supported. ctrl-π starts and observes native
policy servers; after load, observations and actions flow directly between the
robot-side client and the native server.

## 5. System context

With hardware, FastAPI runs on the machine that can access YAM CAN:

```text
Browser --LAN--> ctrl-π API / YAM host --CAN--> YAM arms
```

Remote compute is separate:

```text
ctrl-π --SSH local forward--> Lambda VM --> loopback ctrl-pi-worker
ctrl-π --Modal API----------> Modal managed GPU workload
```

A Lambda training process that must call the local run API uses an SSH reverse
tunnel or another channel established by the same SSH session. The FastAPI
backend need not be public.

The inference data path is:

```text
robot-side client <---- native framework protocol ----> policy server
                          (does not cross FastAPI)
```

## 6. Architecture and contracts

The dependency direction is:

```text
React UI
   ↓ typed HTTP/WebSocket client
FastAPI routes
   ↓ application services and interfaces
PostgreSQL | Hugging Face | YAMDriver | ComputeTarget | PolicyRuntime
```

Provider, CAN, and framework implementation details MUST NOT appear in React
components or application-service orchestration.

### 6.1 YAM driver

`YAMDriver` owns discovery, connection lifecycle, snapshots/telemetry streams,
jog commands, and stop. `MockYAMDriver` implements the same contract and is the
default until real hardware is deliberately configured. Consumer code MUST NOT
branch on mock versus real drivers.

Unresolved hardware facts—joint names/count, angle units, pose frame and
quaternion ordering, CAN identifiers, hard/soft limits, and target telemetry
rate—MUST be resolved against the real YAM API before the production driver is
enabled.

### 6.2 Policy runtimes

`PolicyRuntime` describes capabilities, compatibility validation, native server
start/stop, load, and health. `LeRobotRuntime` and `OpenPIRuntime` implement it
independently; neither is wrapped through the other.

### 6.3 Compute targets

`ComputeTarget` exposes identity, capabilities, health, supported workload
lifecycle, and endpoint information without promising identical provider
features.

- `LambdaComputeTarget` connects to a manually provisioned VM through the
  user's SSH agent/config, establishes tunnels, and calls `ctrl-pi-worker`.
- `ModalComputeTarget` uses Modal's local credentials and APIs to launch/manage
  supported workloads directly. It does not install or require the worker.

Capabilities MUST be discoverable so unsupported combinations can be rejected
before launch. Modal V1 primarily supports LeRobot/OpenPI inference; later
training support fits the same abstraction.

### 6.4 Worker

`ctrl-pi-worker` is a small Python service for user-managed GPU hosts. It reports
health, GPU/VRAM/utilization, installed runtimes, running inference processes,
and starts/stops supported native inference servers. It includes a narrow future
training-execution extension point.

The worker MUST bind only to `127.0.0.1` and MUST be reached through an SSH local
port forward. It MUST NOT expose an unauthenticated public management API.

### 6.5 Hugging Face gateway

One backend gateway owns namespace discovery, metadata/revision lookup,
authenticated artifact proxying, uploads, and pagination. Large artifacts MUST
not be copied into PostgreSQL. Private video delivery design MUST preserve range
requests and avoid token leakage.

## 7. State ownership

| Owner | State | Rule |
| --- | --- | --- |
| PostgreSQL | robots/config, recording metadata, training runs, compute targets, inference endpoints, deployments, settings | Small mutable control-plane source of truth |
| Hugging Face Hub | LeRobot datasets, episode media, model repos, weights, checkpoints, configs/cards | ML/data artifact source of truth |
| Memory/live connections | joints, pose, CAN health, loop stats, live camera, jog/teleop commands, transient compute health | Reacquired on reconnect; not continuously persisted |
| Local machine | `.env`, SSH keys/agent, Modal credentials | Never stored in PostgreSQL or Hugging Face |

Intentional recording temporarily stages episode data until finalization/upload;
that staging policy, cleanup, and interrupted-upload recovery will be specified
with the recorder implementation.

## 8. Minimal PostgreSQL model

SQLAlchemy 2 and Alembic manage ordinary PostgreSQL through `DATABASE_URL`.
Supabase is a recommended host, not a product dependency.

- `robots`: arm identity, role/configuration, enabled state, driver selector and
  non-secret connection configuration.
- `recordings`: task/session metadata, lifecycle state, episode counters, and
  resulting Hugging Face dataset reference.
- `training_runs`: external ID/idempotency key, status/step, dataset/base model,
  runtime, compute target, configuration/summary metrics, and output repo.
- `compute_targets`: provider, display name, non-secret connection metadata, and
  enabled state.
- `inference_endpoints`: target/runtime association, endpoint descriptor, health
  summary, and lifecycle state.
- `deployments`: robot, endpoint, model/revision, desired/actual state, and active
  assignment.
- `settings`: small application settings such as the configured Hugging Face
  namespace.

Secrets and large artifacts MUST NOT be columns. Status values use explicit
state machines and timestamps rather than inferred booleans.

## 9. API and streaming

- Versioned REST under `/api/v1` handles resources, configuration, and lifecycle
  transitions.
- A WebSocket (or equivalently low-latency, explicitly selected stream) carries
  arm telemetry to browser clients. Slow clients MUST not create an unbounded
  backlog; newest state wins.
- Camera transport and recording-time synchronization require a later design;
  V1 MUST attach timestamps and preserve observation/action alignment.
- The training Runs API supports idempotent create/upsert, status/step updates,
  metric batches or summaries, heartbeat, and output-repository assignment.
- Authenticated Hugging Face proxy endpoints keep server credentials server-side.
- FastAPI does not proxy the high-frequency inference observation/action loop.

The run API bind address, reverse-tunnel setup, metric schema, and whether a
local write token is needed require a threat review before external exposure.
"No ctrl-π user auth" does not mean "public writable API."

## 10. Security and configuration

- Secrets live in a gitignored `.env` or their provider's standard local config.
- `HF_TOKEN`, database credentials, SSH private keys, Modal credentials, and
  future provider API keys MUST NOT be committed, logged, sent to the browser,
  or stored in PostgreSQL/Hugging Face.
- Lambda SHOULD use existing SSH agent and config behavior. Persisted target
  rows may contain host aliases and ports, never private key material.
- Browser-visible environment variables MUST contain only non-secret settings.
- The backend has no V1 account system. Operators are responsible for the LAN
  boundary, and non-loopback binding MUST be an explicit configuration choice.
- Motion commands require real-driver safety validation; mock controls MUST not
  imply that real motion safety is complete.

## 11. UX requirements

The UI uses light Tailwind styling inspired by the README image: warm neutral
surfaces, fine borders, compact labels, monospaced identifiers/measurements,
restrained green/amber/red status color, and generous whitespace. It SHOULD avoid
dense dashboards and decorative charts.

All views MUST offer legible loading, empty, error, stale/reconnecting, and
unsupported-capability states. Controls use semantic elements, visible keyboard
focus, truthful disabled states, and confirmation/dead-man interactions where
the action is risky. Mock screens MUST be labeled as mock or preview data.

## 12. Repository and test strategy

```text
frontend/                  React + TypeScript + Vite + Tailwind
backend/src/ctrl_pi/       FastAPI, services, adapters, SQLAlchemy
backend/alembic/           PostgreSQL migrations
backend/tests/             API/service/adapter tests
worker/src/ctrl_pi_worker/ loopback GPU worker
worker/tests/              worker contract tests
docs/                      focused design/operation documents
```

Frontend checks cover navigation, important states, type checking, linting, and
production builds. Backend/worker checks cover service state machines, mock
contracts, API schemas, migrations, provider capability rejection, and secret
boundaries. Real external services get explicit opt-in integration tests; mocks
remain deterministic defaults.

## 13. Milestones and exit conditions

1. **App shell + five tabs** — production-buildable responsive shell, exact
   primary navigation, Training subviews, useful typed preview states, docs.
2. **PostgreSQL schema/migrations** — seven minimal tables migrate up/down and
   API startup validates `DATABASE_URL` without provider coupling.
3. **Mock Arms + live telemetry** — `YAMDriver` contract, deterministic mock,
   low-latency stream, diagnostics, safe no-op/manual mock controls.
4. **Mock Record/Teleop** — pair selection and explicit teleop/recording state
   machines operate against mock arms.
5. **Hugging Face integration** — server-side client/config, namespace discovery,
   authenticated access, and upload boundary.
6. **Datasets + basic browser** — repository list, metadata, tasks, episodes, and
   revisions with loading/error/private states.
7. **Rich episode visualizer** — synchronized camera, state, action, and timeline
   scrubbing.
8. **Training Runs + Models** — persistent tracking, HF model discovery, and
   documented external API/SDK.
9. **Generic compute abstraction** — capability-oriented target contract and
   persistent non-secret target configuration.
10. **Lambda + worker** — SSH tunnel management and loopback worker health/GPU/
    runtime/process lifecycle.
11. **Modal provider** — direct managed inference workload lifecycle without a
    worker.
12. **Runtime adapters** — independent native LeRobot/OpenPI server adapters and
    compatibility checks.
13. **Inference UI** — endpoint/assignment lifecycle, health and measurements,
    remote policy load/stop controls.
14. **Real YAM integration** — validated driver, safety behavior, teleop and
    recording on documented hardware.
15. **Polish/tests/docs** — cross-component failure testing, accessibility,
    operator runbooks, and release readiness.

Each milestone runs relevant checks and reports completed work and open issues.
Scope SHOULD NOT move forward merely to make a screen appear functional.

## 14. Milestone 1 acceptance criteria

- The React/TypeScript/Vite/Tailwind app installs, lints, tests, and builds.
- One primary navigation exposes exactly Arms, Record / Teleop, Datasets,
  Training, and Inference, in that order, with deep links and a safe fallback.
- Training has Runs and Models as secondary navigation only.
- Every primary route has a sparse, useful, honestly labeled mock/preview state.
- The shell is usable at laptop and narrow viewport widths with semantic links,
  active state, readable contrast, and visible focus.
- Typed mock/domain data stays outside presentation components; components do
  not contain CAN, token, SSH, provider, or runtime implementation logic.
- README links the canonical spec and docs, describes status honestly, and gives
  quick-start/check commands.

## 15. Deferred decisions

The following are explicit design inputs, not permission to invent protocol
facts: real YAM/CAN conventions and safety limits; camera transport and clock
synchronization; exact LeRobot episode layout/version and local staging policy;
Hugging Face revision/video range/cache behavior; external run metric and API
security schema; compute tunnel collision/reconnect/process supervision; Modal
workload identity/cleanup; and project license choice.
