I want to build an open-source web console/UI called `ctrl-π` for developing, collecting data for, training, and running robot policies on YAM arms.

The goal is a minimal local/self-hosted control plane that a user can git clone, connect to their YAM hardware and GPU compute, and use for the basic robot-learning workflow.

The README contains an image showing the general visual inspiration. It is not an exact UI specification. Use light Tailwind styling and keep the interface sparse, simple, and engineering-oriented.

We will build the software and real YAM integration in parallel. All hardware functionality should initially work against a `MockYAMDriver`, with clean interfaces that can later be replaced by the real implementation.

## Core Interface

There should be exactly five primary tabs:

### Arms

Monitor and control connected YAM arms.

Include:

* CAN/connection status
* leader/follower role
* real-time joint state
* end-effector position/orientation
* gripper state
* control-loop statistics
* basic diagnostics
* simple manual jog/control

Live state should stream with low latency and should not be persisted continuously.

### Record / Teleop

Operate leader/follower YAM arms and collect demonstrations.

Include:

* select leader/follower arm pair
* live robot/camera state
* start/stop teleoperation
* start/stop episode recording
* task/episode metadata
* recording status, duration, and episode count
* save/upload completed demonstrations as LeRobot-style datasets to Hugging Face Hub

For V1, keep recording simple and optimize around the standard YAM + LeRobot workflow rather than designing a generic robotics recording system.

### Datasets

Browse robot datasets stored in the user's configured Hugging Face namespace.

Include:

* dataset list
* metadata/task
* episode counts
* revisions
* episode browser
* camera/video
* synchronized state/action values
* timeline scrubbing

Implement this incrementally: basic dataset discovery/metadata first, then the richer episode visualizer.

Private Hugging Face assets must be fetched or proxied through the backend when authentication is required. Never expose `HF_TOKEN` to browser code.

### Training

Show training activity and resulting policy artifacts.

Training should contain two subviews:

* Runs
* Models

Runs should show:

* current/past runs
* status/current step
* dataset
* base model
* runtime/framework
* compute target
* configuration
* metrics/curves where available
* output model repository

Models should show Hugging Face model repositories, revisions, weights, and checkpoints.

Support both first-class policy ecosystems:

* LeRobot
* OpenPI / Physical Intelligence

Do not force one through the other. Keep framework-specific logic behind runtime/training adapters.

Training itself runs outside ctrl-π in V1. Researchers should be able to run arbitrary LeRobot, OpenPI, or custom scripts on Lambda, Modal, local GPUs, or other machines.

Expose a small ctrl-π API/SDK that external training scripts can use to create/update training runs in PostgreSQL while model checkpoints are written to Hugging Face Hub.

Design this so common workflows can later become buttonized:

```text
dataset
+ base policy
+ runtime
+ training recipe
+ compute target
+ hyperparameters
        │
        ▼
      Train
        │
        ▼
remote GPU
        │
        ├── run state → ctrl-π
        └── weights   → HF Hub
```

Do not implement general buttonized training orchestration in V1.

### Inference

Configure and monitor real-time policy inference.

Include:

* select robot/arms
* select model/checkpoint
* select LeRobot or OpenPI runtime
* select compute target
* start/stop/load policy server
* local, Lambda, and Modal inference targets
* endpoint health
* latency/inference frequency
* currently loaded policy

Use each framework's native inference mechanism where practical:

```text
LeRobot model
      │
      ▼
LeRobot policy server
      │
      ▼
robot-side client
```

```text
OpenPI model
      │
      ▼
OpenPI policy server
      │
      ▼
robot-side client
```

ctrl-π is the control plane, not the high-frequency inference data plane.

Once a policy is loaded, observations/actions should flow directly between the robot-side client and policy server rather than through the ctrl-π FastAPI backend.

## Compute

GPU compute is shared by Training and Inference and is not a separate primary tab.

For V1, support two first-class remote compute providers:

* Lambda Cloud
* Modal

Keep provider-specific behavior behind a generic `ComputeTarget` abstraction.

### Lambda

Lambda represents a user-managed GPU machine.

Initial workflow:

1. User manually launches a Lambda GPU VM.
2. User connects using normal SSH credentials.
3. User installs/starts `ctrl-pi-worker`.
4. User adds the machine to ctrl-π.
5. ctrl-π communicates with it through SSH tunnels.

Do not automate Lambda VM creation in V1.

Use:

`LambdaComputeTarget`

### Modal

Modal represents managed GPU compute.

ctrl-π should integrate through a `ModalComputeTarget`.

Unlike Lambda, Modal should not require `ctrl-pi-worker`. The Modal provider adapter should directly launch/manage supported GPU workloads using Modal.

For V1, Modal should primarily support running LeRobot/OpenPI policy inference services.

Design the same interface so Modal can later execute common training recipes.

Conceptually:

```text
                   ComputeTarget
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
          Lambda                    Modal
            │                         │
     ctrl-pi-worker             managed workload
            │                         │
       ┌────┴────┐               ┌────┴────┐
       ▼         ▼               ▼         ▼
    LeRobot    OpenPI         LeRobot    OpenPI
```

Future providers may include other GPU clouds or local compute.

### ctrl-pi-worker

Ship a lightweight Python worker for user-managed GPU machines such as Lambda.

Responsibilities:

* health check
* GPU/VRAM/utilization information
* installed runtime information
* start/stop supported inference servers
* report running inference processes
* extension point for future training execution

Keep it small.

The worker should bind only to `127.0.0.1` on the remote VM and should never expose an unauthenticated management API publicly.

ctrl-π reaches it through an SSH local port forward.

If a Lambda training process needs to report status back to the local ctrl-π API, use an SSH reverse tunnel or another connection established through the existing SSH session. Do not require the local FastAPI backend to be publicly exposed.

## Deployment Topology

"Local-first" means ctrl-π is self-hosted by the user, not that all data must live on one local machine.

During mock development, the frontend and backend may run on the developer laptop.

With real YAM hardware, the FastAPI/YAM backend should run on the edge machine that has access to the YAM CAN hardware.

The browser may connect to it over the LAN.

```text
Browser
   │
  LAN
   ▼
ctrl-π backend / YAM host
   │
  CAN
   ▼
YAM Arms
```

Remote GPU communication occurs separately:

```text
ctrl-π
   │
   ├── SSH tunnel ─────► Lambda ──► ctrl-pi-worker
   │
   └── Modal API ──────► Modal GPU workload
```

## Architecture

Frontend:

* React
* TypeScript
* Vite
* Tailwind CSS

Backend:

* Python
* FastAPI
* SQLAlchemy 2
* Alembic
* PostgreSQL
* `huggingface_hub`

Additional components/interfaces:

* `ctrl-pi-worker`
* `MockYAMDriver`
* `YAMDriver`
* `LeRobotRuntime`
* `OpenPIRuntime`
* `LambdaComputeTarget`
* `ModalComputeTarget`

For V1, use a hosted Postgres instance. Supabase is the recommended default because it is fast and easy to set up, but treat it as ordinary PostgreSQL through `DATABASE_URL`.

The application itself runs locally/self-hosted. We are not hosting ctrl-π and are not adding ctrl-π user authentication in V1.

Keep clean boundaries:

```text
UI
 │
 ▼
ctrl-π API
 │
 ▼
services/interfaces
 │
 ├── PostgreSQL
 ├── Hugging Face
 ├── YAM
 └── ComputeTarget
       ├── Lambda
       └── Modal
```

Do not put YAM/CAN, cloud-provider, or policy-framework-specific implementation details directly in frontend components.

## Persistence

V1 has three categories of state.

### PostgreSQL

PostgreSQL is the source of truth for small mutable ctrl-π/control-plane state:

* robots/arms and configuration
* recording metadata
* training runs
* compute targets
* inference endpoints
* loaded/active model assignments
* application settings

Suggested minimal tables:

* `robots`
* `recordings`
* `training_runs`
* `compute_targets`
* `inference_endpoints`
* `deployments`
* `settings`

Use SQLAlchemy + Alembic.

Supabase-hosted Postgres is the recommended V1 default, but the application should depend only on standard PostgreSQL.

### Hugging Face Hub

Hugging Face Hub is the source of truth for ML/data artifacts:

* LeRobot datasets
* episode images/video
* model repositories
* weights/checkpoints
* configs
* model/dataset cards

Do not duplicate large artifacts into PostgreSQL.

### Ephemeral state

Do not continuously persist:

* current joints
* current pose
* CAN health
* loop frequency
* live camera stream
* jog/teleop commands

When a demonstration is intentionally recorded, it becomes a dataset artifact and is uploaded to Hugging Face Hub.

## Configuration and Credentials

ctrl-π runs locally/self-hosted and has no ctrl-π user-auth system in V1.

Use a gitignored `.env` for secrets such as:

```text
DATABASE_URL=postgresql://...
HF_TOKEN=hf_...
```

Modal credentials should also remain local and use Modal's normal credential/configuration mechanism.

Never commit or store secrets in PostgreSQL or Hugging Face Hub.

SSH private keys, Modal credentials, and future cloud API keys must remain local.

Prefer the user's existing SSH agent/configuration for Lambda.

The intended workflow is:

```text
git clone
    │
    ▼
configure Postgres + HF
    │
    ▼
run ctrl-π
    │
    ├── connect YAM hardware
    │
    ├── connect Lambda VM via SSH
    │
    └── connect Modal account
    │
    ▼
Record → Datasets → Training → Inference
```

Persistent ctrl-π state restores from PostgreSQL.

Datasets/models restore from Hugging Face Hub.

Live robot and compute state is reacquired when machines reconnect.

## Scope

Keep V1 deliberately minimal.

Avoid:

* Kubernetes
* Redis
* message queues
* complex auth
* multi-user collaboration
* fleet management
* elaborate dashboards
* unnecessary abstractions
* reimplementing LeRobot/OpenPI protocols

For Lambda V1:

* user manually provisions the VM
* ctrl-π connects using SSH
* `ctrl-pi-worker` manages supported workloads

For Modal V1:

* ctrl-π may launch/manage supported inference workloads through the Modal provider adapter
* no worker daemon is required

Buttonized training orchestration is future work.

Prefer boring, understandable, clean, low-latency interfaces.

Repository/package naming:

* repo: `ctrl-pi`
* Python package: `ctrl_pi`
* GPU worker: `ctrl-pi-worker`

## Documentation and Agent Workflow

Before implementation:

1. Inspect the repository and README/image inspiration.
2. Write a concise but complete `SPEC.md`.
3. Update/create `README.md`.
4. Add minimal `docs/` for architecture, development, YAM driver, recording/teleop, compute targets, and policy runtimes.
5. Add `AGENTS.md`.

`SPEC.md` is the canonical source of truth.

Implement incrementally.

Suggested milestones:

1. app shell + five tabs
2. PostgreSQL schema/migrations
3. mock Arms + live telemetry
4. mock Record/Teleop + recording lifecycle
5. Hugging Face integration
6. Datasets + basic browser
7. richer episode visualizer
8. Training Runs + Models + external training API
9. generic compute abstraction
10. Lambda SSH/tunneling + `ctrl-pi-worker`
11. Modal compute/inference provider
12. LeRobot/OpenPI runtime adapters
13. Inference UI + remote policy loading
14. real YAM driver + teleop/recording integration
15. polish/tests/docs

After each milestone, run relevant tests/build checks, report what was completed and any open issues, and do not unnecessarily expand scope.

Start by writing the specification and repository structure, then implement the first milestone.
