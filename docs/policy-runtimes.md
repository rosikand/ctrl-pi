# Policy runtimes

LeRobot and OpenPI are equal, first-class policy ecosystems. ctrl-π uses each
framework's native inference mechanism where practical and does not force one
through the other.

```text
LeRobot model → LeRobotRuntime → native LeRobot policy server
OpenPI model  → OpenPIRuntime  → native OpenPI policy server
```

## Shared contract

A `PolicyRuntime` reports its name/version/capabilities, validates a Hub model
and revision, describes required resources, starts/stops its native server,
loads or reports the active policy, and returns normalized endpoint health such
as readiness, latency, inference frequency, and framework diagnostics.

The shared contract standardizes control-plane lifecycle data only. Framework
configuration and observation/action protocols remain in the concrete adapter.
Neither runtime invokes the other.

## Placement

The same runtime concept may be hosted locally, invoked by the Lambda worker, or
packaged as a Modal managed workload. `ComputeTarget` decides placement and
provider lifecycle; `PolicyRuntime` owns framework compatibility and server
behavior. Their capability intersection determines whether a requested
deployment is valid.

Once loaded, the robot-side client connects directly to the native policy server:

```text
ctrl-π -------- start/load/health --------> policy server
robot client ==== observations/actions =====> policy server
```

Model repository, revision, checkpoint/config, runtime version, and expected
robot observation/action schema must be validated before activation. ctrl-π
should expose native diagnostics without translating the high-frequency data
plane or hiding compatibility failures.
