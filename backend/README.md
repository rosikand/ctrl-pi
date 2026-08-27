# ctrl-π backend

Milestone 2 provides the executable Python package boundary, validated FastAPI
composition, SQLAlchemy 2 metadata, and Alembic migrations for ordinary
PostgreSQL. Supabase is a recommended host, not a dependency.

The initial schema contains exactly `robots`, `recordings`, `training_runs`,
`compute_targets`, `inference_endpoints`, `deployments`, and `settings`. It stores
small mutable records and artifact references only. Live telemetry, camera
frames, commands, credentials, and model/dataset payloads do not belong here.

## Setup

Python 3.12 or newer is required.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cp ../.env.example ../.env
```

Set `DATABASE_URL` in the root `.env` to a normal PostgreSQL SQLAlchemy URL. Both
forms below are accepted; a bare PostgreSQL URL is composed with Psycopg 3 at
runtime.

```text
postgresql://user:password@host:5432/database
postgresql+psycopg://user:password@host:5432/database
```

Startup validates that the URL targets PostgreSQL, but engine composition does
not make a network connection. Credentials are excluded from settings repr and
validation error details.

## Migrations

From `backend/`, with `DATABASE_URL` configured:

```bash
alembic upgrade head
alembic check
alembic downgrade base
```

`downgrade base` removes all ctrl-π tables, so use it only against a disposable
database or when intentionally rolling back the initial schema. Normal startup
does not create tables implicitly.

## API composition

Run the currently route-free application boundary on loopback with:

```bash
uvicorn ctrl_pi.main:create_app --factory --host 127.0.0.1 --port 8000
```

Resource routes and live integrations arrive in later milestones. The factory
currently validates settings, composes a lazy SQLAlchemy engine, and disposes it
during shutdown.

## Checks

```bash
ruff check .
ruff format --check .
mypy
pytest
```

The migration tests execute upgrade, model-drift detection, and downgrade using
a disposable database, and separately compile both directions with the
PostgreSQL dialect. See [`../docs/development.md`](../docs/development.md) and
[`../SPEC.md`](../SPEC.md).

An opt-in live PostgreSQL round trip is available only for an explicitly named
loopback test database:

```bash
CTRL_PI_TEST_DATABASE_URL=postgresql+psycopg://user:password@127.0.0.1:5432/ctrl_pi_test \
  pytest -m integration tests/test_postgres_migrations.py
```

The safety guard rejects remote hosts and database names that do not end in
`_test` because the test deliberately migrates back to `base`.
