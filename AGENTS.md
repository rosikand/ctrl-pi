# Agent contribution guide

## Source of truth

Read `SPEC.md` before changing product behavior. It is canonical. Keep work
inside the active milestone unless the user explicitly expands scope, and report
checks plus open issues after each milestone.

## Repository boundaries

- `frontend/` contains React presentation, typed API clients, and view models.
  Never put CAN, SSH, cloud-provider, Hugging Face credential, or policy-runtime
  implementations in components.
- `backend/` owns FastAPI routes, application services, SQLAlchemy models, and
  adapters behind interfaces.
- `worker/` is the small loopback-only GPU worker. Do not make it a general job
  platform.
- `docs/` records contracts and operator-facing behavior. Update the relevant
  document when a boundary changes.

Dependencies point inward: UI → API → services/interfaces → adapters. Provider
and framework adapters must not call into UI or route layers.

## V1 invariants

- There are exactly five primary tabs: Arms, Record / Teleop, Datasets,
  Training, and Inference. Compute is not a primary tab.
- LeRobot and OpenPI are peers behind independent runtime adapters.
- `MockYAMDriver` and the real `YAMDriver` implementation share one consumer
  contract; mock/real branching stays at configuration/composition boundaries.
- PostgreSQL stores small mutable control-plane records. Hugging Face stores
  datasets/models. Live telemetry, camera frames, and control commands remain
  ephemeral unless part of an intentional recording.
- ctrl-π never carries the high-frequency policy observation/action loop.
- Lambda uses a manually provisioned VM, SSH tunnels, and a worker bound to
  `127.0.0.1`. Modal talks directly to managed workloads and has no worker.
- Do not add general training orchestration, Kubernetes, Redis, queues, accounts,
  fleet abstractions, or unrelated dashboards in V1.

## Credentials and safety

Never commit or persist secrets. `HF_TOKEN`, database passwords, SSH keys,
Modal credentials, and provider keys stay in gitignored/local configuration and
must not enter browser bundles or logs. Do not introduce a `VITE_*` secret.

Real motion controls require documented limits, dead-man/stop-on-release, and
stop-on-disconnect behavior. Until those exist, keep controls explicitly mock or
disabled. Never present fake success for hardware, upload, compute, or policy
operations.

## Working practices

- Preserve unrelated user changes and avoid broad mechanical rewrites.
- Prefer small typed contracts and explicit capability checks over speculative
  generic abstractions.
- Use deterministic mocks by default; make live integrations opt-in.
- Add focused tests with behavior assertions, not snapshots of styling.
- For frontend changes run `npm run lint`, `npm test`, and `npm run build` from
  `frontend/`.
- For future backend/worker changes, add the package's documented lint, type,
  unit, and migration checks before calling a milestone complete.
