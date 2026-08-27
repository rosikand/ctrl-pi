# Architecture

`ctrl-π` is a self-hosted control plane with an edge-oriented backend. The
browser renders state and requests lifecycle transitions. FastAPI coordinates
services. Hardware, artifact, framework, and provider details live in adapters.

```text
Browser
   │ typed REST + telemetry stream over LAN
   ▼
FastAPI on the YAM-connected edge host
   │
   ├── application services ──► PostgreSQL
   ├── Hugging Face gateway ─► Hub datasets/models
   ├── YAMDriver ─────────► CAN / YAM arms
   └── ComputeTarget
          ├── Lambda ── SSH tunnel ──► loopback ctrl-pi-worker
          └── Modal ─── Modal API ───► managed workload
```

## Control plane versus data plane

ctrl-π may start, stop, load, and health-check native policy servers. It does
not proxy the real-time inference loop:

```text
ctrl-π API --control--> LeRobot/OpenPI policy server

robot-side client ===== observations/actions ===== policy server
                  direct native framework path
```

Likewise, arm telemetry is streamed to interested browser clients and dropped
when stale rather than appended to PostgreSQL. Intentional demonstration capture
is a distinct recording pipeline.

## Dependency boundaries

Frontend components consume typed view models and an API client. FastAPI routes
validate transport data then call application services. Services depend on
interfaces such as `YAMDriver`, `ComputeTarget`, `PolicyRuntime`, repositories,
and a Hugging Face gateway. Composition/configuration selects concrete adapters.

This prevents CAN, Paramiko/SSH, Modal, and framework SDK choices from spreading
through the codebase. It also makes `MockYAMDriver` a drop-in implementation for
development and tests.

## State and ownership

| Category | Source of truth | Reconnect behavior |
| --- | --- | --- |
| Arm/configuration, recordings, runs, targets, endpoints, deployments, settings | PostgreSQL | Restore records; validate live associations |
| Demonstrations, media, model weights/checkpoints/configs/cards | Hugging Face Hub | Rediscover revisions/artifacts |
| Arm pose/joints/CAN/loop stats, live video, commands, GPU/endpoint health | Connected process/memory | Reacquire; mark stale while disconnected |
| Credentials | Local `.env`, SSH agent/config, Modal config | Read locally; never copy to DB/Hub/browser |

## PostgreSQL boundary

The initial Alembic revision owns exactly seven tables: `robots`, `recordings`,
`training_runs`, `compute_targets`, `inference_endpoints`, `deployments`, and
`settings`. UUIDs identify mutable resources, explicit check constraints guard
lifecycle states, and foreign keys preserve control-plane associations.

JSONB columns are limited to small configuration or summary objects. They are
not an escape hatch for credentials, telemetry streams, camera frames,
recordings, or model weights. Hugging Face fields contain repository/revision
references; the artifacts themselves stay on the Hub.

FastAPI composition validates `DATABASE_URL` as ordinary PostgreSQL and builds a
lazy Psycopg 3 engine. Database availability and schema revision are operational
checks; startup never calls `create_all()` or silently mutates the schema.

## Trust boundaries and failure behavior

The backend has no ctrl-π account system in V1. Loopback is the safe default;
operators deliberately expose the edge API on a trusted LAN when needed. Private
Hub requests terminate in the backend. A worker listens on `127.0.0.1` only and
is reached by SSH local forwarding.

Connections can fail independently. The UI distinguishes unavailable, stale,
reconnecting, unsupported, and failed states. Reconnection refreshes live truth
instead of replaying stale PostgreSQL health. Lifecycle operations need
idempotency so a tunnel or browser retry does not launch duplicate work.
