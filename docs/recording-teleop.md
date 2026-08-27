# Recording and teleoperation

V1 targets a conventional two-arm YAM/LeRobot workflow: choose one leader and
one follower, establish teleoperation, then intentionally capture episodes for
one task/dataset.

## Independent lifecycles

```text
Teleop: idle → starting → active → stopping → idle
                         └──► failed

Record: idle → preparing → recording → finalizing → completed
                              └──► failed/recoverable
```

Recording can begin only with a valid pair, active teleoperation (unless a later
recipe explicitly says otherwise), required task metadata, and ready camera/
state streams. Stopping teleoperation while recording first performs a safe
recording stop/finalize transition.

## Episode data

Each observation/action sample needs source timestamps and enough clock metadata
to align cameras, leader state/actions, and follower observations. Current pose,
video, and commands remain ephemeral outside a recording. During capture they
are staged locally until the episode is finalized into the selected LeRobot
layout.

The exact LeRobot version/schema, camera codecs, timestamp reconciliation,
partial-file cleanup, disk-pressure behavior, and recovery of interrupted
captures are milestone design inputs. Do not invent a generic recording format.

## Hugging Face publication

Completed demonstrations are uploaded through the backend to the configured Hub
namespace. UI metadata includes task, dataset repository, optional episode note,
duration, count, and upload state. An upload failure preserves recoverable local
state and reports the actual error. Server-side code owns `HF_TOKEN`; the browser
receives only safe repository metadata and progress.
