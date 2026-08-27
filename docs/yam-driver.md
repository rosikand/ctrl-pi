# YAM driver boundary

The application talks to YAM hardware only through `YAMDriver`. The default
development implementation is `MockYAMDriver`; route and service code must not
know which implementation was selected.

## Contract shape

The eventual async contract covers:

- discover configured/attached arms;
- connect, disconnect, and report connection/CAN state;
- return a current telemetry snapshot;
- stream newest telemetry with bounded buffering;
- set leader/follower role where supported;
- issue a bounded jog command; and
- stop motion immediately and idempotently.

Telemetry includes a monotonic source timestamp, connection freshness, named
joint positions/velocities where available, end-effector position/orientation,
gripper state, loop rate/jitter/error counters, and diagnostic events. Transport
models should carry units and coordinate-frame metadata instead of relying on UI
assumptions.

## Mock behavior

`MockYAMDriver` should be deterministic under a seed, produce plausible smooth
telemetry at a configurable rate, support connection/fault scenarios, and make
jog commands visibly affect mock state. It must exercise the same state and
error paths as the real driver. It must never silently activate as a fallback
when a configured real driver fails.

## Safety requirements

Before real motion is enabled, confirm the YAM API and document joint count and
names, angle/velocity units, end-effector frame and quaternion convention, CAN
identifiers, hard/soft limits, supported rate, and stop semantics. Manual jog
must be press-and-hold/dead-man controlled, bounded in magnitude/duration, stop
on release or connection loss, and expose a prominent stop action.

CAN parsing, device-specific recovery, and safety enforcement belong in the real
adapter, not React components or generic services.
