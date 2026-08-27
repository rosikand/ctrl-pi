"""Database engine composition."""

from sqlalchemy import Engine, create_engine
from sqlalchemy.engine import make_url


def create_database_engine(database_url: str) -> Engine:
    """Build a lazy PostgreSQL engine without connecting during composition."""

    url = make_url(database_url)
    if url.drivername == "postgresql":
        url = url.set(drivername="postgresql+psycopg")

    return create_engine(url, pool_pre_ping=True)
