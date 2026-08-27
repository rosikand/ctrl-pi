"""Process configuration with explicit secret-safe validation."""

from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError


class Settings(BaseSettings):
    """Backend settings loaded from local environment variables."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
        populate_by_name=True,
        hide_input_in_errors=True,
    )

    environment: Literal["development", "test", "production"] = Field(
        default="development",
        validation_alias="CTRL_PI_ENV",
    )
    api_host: str = Field(default="127.0.0.1", validation_alias="CTRL_PI_API_HOST")
    api_port: int = Field(default=8000, validation_alias="CTRL_PI_API_PORT", ge=1, le=65535)
    yam_driver: str = Field(default="mock", validation_alias="CTRL_PI_YAM_DRIVER")
    database_url: str = Field(validation_alias="DATABASE_URL", repr=False)

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        """Accept ordinary PostgreSQL URLs without coupling to a hosting provider."""

        try:
            url = make_url(value)
        except ArgumentError:
            raise ValueError("DATABASE_URL must be a valid SQLAlchemy URL") from None

        if url.get_backend_name() != "postgresql" or not url.database:
            raise ValueError("DATABASE_URL must target a PostgreSQL database")

        return value
