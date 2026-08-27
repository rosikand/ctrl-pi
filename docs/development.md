# Development

Milestones 1 and 2 provide the typed frontend preview plus the backend package,
configuration boundary, database metadata, and initial migration. Hardware,
artifact, and compute integrations remain future work.

## Prerequisites

- Node.js `^20.19.0`, `^22.13.0`, or `>=24.0.0`
- npm 11 or a compatible npm version
- Python 3.12 or newer
- PostgreSQL for running the backend or applying migrations
- Hugging Face credentials only when its integration milestone lands

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The UI has no required secrets and starts in an explicitly labeled preview/mock
state. Its stable routes are `/arms`, `/record`, `/datasets`,
`/training/runs`, `/training/models`, and `/inference`.

Checks:

```bash
npm run lint
npm test
npm run build
```

`npm run build` includes TypeScript project checking before Vite's production
bundle. Generated `dist/`, coverage, and dependency directories are gitignored.

## Backend

Create an isolated environment and install the package with its development
tools:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
```

Run the complete backend check suite:

```bash
ruff check .
ruff format --check .
mypy
pytest
```

Tests use a disposable in-memory database for a real Alembic upgrade/check/
downgrade cycle and compile the same migration with PostgreSQL's dialect. Tests
do not connect to the configured production database.

The optional live PostgreSQL migration test reads only
`CTRL_PI_TEST_DATABASE_URL` and refuses remote hosts or database names without
the `_test` suffix. See `backend/README.md` for the command.

## Configuration

Copy the root example without committing the result:

```bash
cp .env.example .env
```

`DATABASE_URL` is a standard PostgreSQL URL. Supabase is merely a convenient
hosted default. The API factory fails before serving if the URL is missing,
malformed, or uses another database dialect. It creates the SQLAlchemy engine
lazily and does not require the database host to be reachable just to validate
configuration.

`HF_TOKEN` is loaded only by the backend when that integration lands. Never add
it, SSH keys, database credentials, or Modal credentials to frontend environment
variables. Modal uses its normal local credential profile; Lambda uses normal
SSH agent/config resolution.

## Database migrations

With `DATABASE_URL` configured, run from `backend/`:

```bash
alembic upgrade head
alembic current
alembic check
```

Create later revisions with `alembic revision --autogenerate -m "description"`,
review the generated operations, and rerun the full check suite. Never use ORM
`create_all()` as a deployment migration. `alembic downgrade base` is available
for deliberate testing of the initial migration but removes all ctrl-π tables.

## Repository map

- `frontend/src/app`: router and app composition
- `frontend/src/components`: presentation primitives and layout
- `frontend/src/pages`: route-level views
- `frontend/src/mocks`: typed milestone fixtures, never hidden production fallbacks
- `frontend/src/types`: transport-independent view/domain types
- `backend/src/ctrl_pi`: FastAPI composition, settings, and SQLAlchemy metadata
- `backend/alembic`: reviewed PostgreSQL schema migrations
- `backend/tests`: config, persistence-boundary, and migration behavior tests
- `worker`: reserved for the loopback GPU worker in milestone 10

Development continues to use `MockYAMDriver` until the real-driver milestone.
External-service integration tests remain explicit and opt-in.
