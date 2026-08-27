"""FastAPI application composition for the ctrl-π control plane."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from ctrl_pi import __version__
from ctrl_pi.config import Settings
from ctrl_pi.db.engine import create_database_engine


def create_app(settings: Settings | None = None) -> FastAPI:
    """Create the API after validating configuration and composing its DB engine."""

    runtime_settings = settings or Settings()
    engine = create_database_engine(runtime_settings.database_url)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        yield
        engine.dispose()

    app = FastAPI(
        title="ctrl-π API",
        version=__version__,
        lifespan=lifespan,
    )
    app.state.settings = runtime_settings
    app.state.database_engine = engine
    return app
