"""Configuration and API composition behavior."""

from pathlib import Path

import pytest
from pydantic import ValidationError
from sqlalchemy import Engine

from ctrl_pi.config import Settings
from ctrl_pi.main import create_app


def test_settings_accept_ordinary_postgresql_urls_without_exposing_passwords() -> None:
    settings = Settings(
        database_url="postgresql+psycopg://ctrl_pi:super-secret@db.example/ctrl_pi",
        _env_file=None,
    )

    assert settings.environment == "development"
    assert "super-secret" not in repr(settings)


@pytest.mark.parametrize(
    "database_url",
    [
        "sqlite+pysqlite:///:memory:",
        "postgresql+psycopg://ctrl_pi@db.example",
        "not a database URL",
    ],
)
def test_settings_reject_non_postgresql_or_incomplete_urls(database_url: str) -> None:
    with pytest.raises(ValidationError):
        Settings(database_url=database_url, _env_file=None)


def test_validation_errors_hide_database_credentials() -> None:
    invalid_url = "sqlite://ctrl_pi:do-not-print@example.invalid/database"

    with pytest.raises(ValidationError) as error:
        Settings(database_url=invalid_url, _env_file=None)

    assert "do-not-print" not in str(error.value)


def test_api_factory_validates_and_normalizes_bare_postgresql_driver(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql://ctrl_pi:local-only@db.example/ctrl_pi",
    )

    app = create_app()
    engine: Engine = app.state.database_engine

    assert engine.url.drivername == "postgresql+psycopg"
    assert app.state.settings.database_url.startswith("postgresql://")
    engine.dispose()


def test_api_factory_fails_fast_without_database_url(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with pytest.raises(ValidationError):
        create_app()
