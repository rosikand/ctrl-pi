"""Opt-in migration validation against disposable PostgreSQL."""

import os

import pytest
from alembic import command
from sqlalchemy import create_engine, inspect
from sqlalchemy.engine import make_url

from tests.test_migrations import alembic_config
from tests.test_models import CONTROL_PLANE_TABLES


@pytest.mark.integration
def test_postgresql_upgrade_check_and_downgrade() -> None:
    database_url = os.getenv("CTRL_PI_TEST_DATABASE_URL")
    if database_url is None:
        pytest.skip("CTRL_PI_TEST_DATABASE_URL is not configured")

    parsed_url = make_url(database_url)
    assert parsed_url.host in {"127.0.0.1", "localhost"}
    assert parsed_url.database is not None and parsed_url.database.endswith("_test")

    engine = create_engine(parsed_url)
    try:
        with engine.connect() as connection:
            config = alembic_config(connection=connection)
            command.upgrade(config, "head")
            try:
                assert set(inspect(connection).get_table_names()) == CONTROL_PLANE_TABLES | {
                    "alembic_version"
                }
                command.check(config)
            finally:
                command.downgrade(config, "base")

            assert set(inspect(connection).get_table_names()) <= {"alembic_version"}
    finally:
        engine.dispose()
