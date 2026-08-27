# ctrl-pi-worker

This directory is the boundary for the lightweight Python GPU worker package
`ctrl_pi_worker`. The worker arrives with the Lambda milestone and will bind to
`127.0.0.1` only, behind an SSH local port forward.

It is intentionally not executable in milestone 1. Modal integrations do not
use this worker. See [`../docs/compute-targets.md`](../docs/compute-targets.md).
