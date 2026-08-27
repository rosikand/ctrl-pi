"""Alembic migration round-trip and PostgreSQL compilation checks."""

from io import StringIO
from pathlib import Path

from alembic.config import Config
from sqlalchemy import Connection, create_engine, inspect

from alembic import command
from ctrl_pi.db.base import Base
from ctrl_pi.db.models import ALL_MODELS  # noqa: F401
from tests.test_models import CONTROL_PLANE_TABLES

BACKEND_ROOT = Path(__file__).resolve().parents[1]


def alembic_config(
    *,
    connection: Connection | None = None,
    output_buffer: StringIO | None = None,
) -> Config:
    config = Config(str(BACKEND_ROOT / "alembic.ini"), output_buffer=output_buffer)
    if connection is not None:
        config.attributes["connection"] = connection
    return config


def test_initial_migration_upgrades_matches_models_and_downgrades() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    try:
        with engine.connect() as connection:
            config = alembic_config(connection=connection)
            command.upgrade(config, "head")

            database_tables = set(inspect(connection).get_table_names())
            assert database_tables == CONTROL_PLANE_TABLES | {"alembic_version"}

            for table_name in CONTROL_PLANE_TABLES:
                migrated_columns = {
                    column["name"] for column in inspect(connection).get_columns(table_name)
                }
                assert migrated_columns == set(Base.metadata.tables[table_name].columns.keys())

            command.check(config)
            command.downgrade(config, "base")

            remaining_tables = set(inspect(connection).get_table_names())
            assert remaining_tables <= {"alembic_version"}
    finally:
        engine.dispose()


def test_initial_migration_compiles_for_postgresql_in_both_directions() -> None:
    upgrade_output = StringIO()
    upgrade_config = alembic_config(output_buffer=upgrade_output)
    upgrade_config.set_main_option(
        "sqlalchemy.url",
        "postgresql+psycopg://ctrl_pi:local-only@db.example/ctrl_pi",
    )
    command.upgrade(upgrade_config, "head", sql=True)

    upgrade_sql = upgrade_output.getvalue()
    for table_name in CONTROL_PLANE_TABLES:
        assert f"CREATE TABLE {table_name}" in upgrade_sql
    assert "BYTEA" not in upgrade_sql
    assert "JSONB" in upgrade_sql

    downgrade_output = StringIO()
    downgrade_config = alembic_config(output_buffer=downgrade_output)
    downgrade_config.set_main_option(
        "sqlalchemy.url",
        "postgresql+psycopg://ctrl_pi:local-only@db.example/ctrl_pi",
    )
    command.downgrade(downgrade_config, "0001_control_plane:base", sql=True)

    downgrade_sql = downgrade_output.getvalue()
    for table_name in CONTROL_PLANE_TABLES:
        assert f"DROP TABLE {table_name}" in downgrade_sql
