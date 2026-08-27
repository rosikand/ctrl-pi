"""Alembic environment bound to ctrl-π settings and model metadata."""

from logging.config import fileConfig

from sqlalchemy import Connection

from alembic import context
from ctrl_pi.config import Settings
from ctrl_pi.db import models  # noqa: F401
from ctrl_pi.db.base import Base
from ctrl_pi.db.engine import create_database_engine

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def database_url() -> str:
    """Use an explicit programmatic URL or validated process configuration."""

    configured = config.get_main_option("sqlalchemy.url")
    if configured:
        return configured
    return Settings().database_url


def configure_context(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_server_default=True,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_offline() -> None:
    context.configure(
        url=database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_server_default=True,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    injected_connection = config.attributes.get("connection")
    if isinstance(injected_connection, Connection):
        configure_context(injected_connection)
        return

    engine = create_database_engine(database_url())
    try:
        with engine.connect() as connection:
            configure_context(connection)
    finally:
        engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
