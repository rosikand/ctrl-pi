# Compute targets

Compute is a shared backend capability used by Training and Inference. It is not
a primary UI tab. `ComputeTarget` exposes identity, health, capabilities, and
supported workload lifecycle without pretending all providers work alike.

## V1 capability matrix

| Target | Provisioning | Worker | Inference | Training |
| --- | --- | --- | --- | --- |
| Local | User-managed | No remote worker | Adapter-dependent | External scripts report runs |
| Lambda | User manually launches VM | `ctrl-pi-worker` over SSH tunnel | LeRobot/OpenPI via worker | External scripts; status via reverse tunnel |
| Modal | Managed through Modal adapter | None | Primary V1 workload | Future common recipes; arbitrary V1 scripts remain external |

Unsupported target/runtime/workload combinations must be rejected through
capability checks, not discovered halfway through launch.

## LambdaComputeTarget

The operator provisions a Lambda GPU VM, configures normal SSH access, installs
and starts `ctrl-pi-worker`, then adds the SSH host/alias to ctrl-π. The adapter
uses the user's SSH agent and config where possible, opens a local port forward
to the worker's loopback port, checks health/capabilities, and supervises tunnel
reconnection.

If remote training code needs the local run API, the same SSH session may create
a narrowly scoped reverse tunnel. FastAPI does not have to be publicly exposed.
Private key contents are never stored in PostgreSQL.

## ModalComputeTarget

The adapter uses Modal's normal local credentials and API to launch, inspect,
and stop supported managed workloads. Modal does not run `ctrl-pi-worker`. V1
focuses on native LeRobot/OpenPI policy inference services; the interface keeps
room for curated training recipes later.

## Worker constraints

`ctrl-pi-worker` reports health, GPU/VRAM/utilization, installed runtimes, and
running inference processes, and starts/stops supported servers. It binds only
to `127.0.0.1`. Tunnel port allocation, collision handling, heartbeat expiry,
process supervision, endpoint cleanup, and capability versioning must be tested
when the worker milestone lands.
