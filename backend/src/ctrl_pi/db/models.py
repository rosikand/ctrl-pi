"""Minimal mutable control-plane records for ctrl-π V1."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    false,
    func,
    text,
    true,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from ctrl_pi.db.base import Base

JsonObject = dict[str, object]
JSON_VALUE = JSON().with_variant(JSONB(), "postgresql")


def empty_json() -> JsonObject:
    """Return a new JSON object for a mapped default."""

    return {}


class TimestampMixin:
    """Creation and application-managed update timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class UuidPrimaryKeyMixin:
    """Portable application-generated UUID primary key."""

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)


class Robot(UuidPrimaryKeyMixin, TimestampMixin, Base):
    """Configured YAM arm identity; live telemetry is never stored here."""

    __tablename__ = "robots"
    __table_args__ = (
        CheckConstraint("role IN ('leader', 'follower')", name="role"),
        UniqueConstraint("name"),
    )

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    display_name: Mapped[str] = mapped_column(String(160), nullable=False)
    role: Mapped[str] = mapped_column(String(16), nullable=False)
    driver: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        server_default=text("'mock'"),
    )
    connection_config: Mapped[JsonObject] = mapped_column(
        JSON_VALUE,
        nullable=False,
        default=empty_json,
        server_default=text("'{}'"),
    )
    enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=true(),
    )


class Recording(UuidPrimaryKeyMixin, TimestampMixin, Base):
    """Intentional demonstration capture metadata and artifact reference."""

    __tablename__ = "recordings"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'recording', 'finalizing', 'uploading', 'completed', 'failed')",
            name="status",
        ),
        CheckConstraint("episode_count >= 0", name="episode_count_nonnegative"),
        Index("ix_recordings_status", "status"),
    )

    leader_robot_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("robots.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    follower_robot_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("robots.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    task: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(24),
        nullable=False,
        server_default=text("'draft'"),
    )
    episode_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )
    session_metadata: Mapped[JsonObject] = mapped_column(
        JSON_VALUE,
        nullable=False,
        default=empty_json,
        server_default=text("'{}'"),
    )
    dataset_repo: Mapped[str | None] = mapped_column(String(255))
    error_message: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ComputeTarget(UuidPrimaryKeyMixin, TimestampMixin, Base):
    """Non-secret configuration for a local or remote compute destination."""

    __tablename__ = "compute_targets"
    __table_args__ = (UniqueConstraint("display_name"),)

    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    display_name: Mapped[str] = mapped_column(String(160), nullable=False)
    connection_config: Mapped[JsonObject] = mapped_column(
        JSON_VALUE,
        nullable=False,
        default=empty_json,
        server_default=text("'{}'"),
    )
    enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=true(),
    )


class TrainingRun(UuidPrimaryKeyMixin, TimestampMixin, Base):
    """State reported by an external training process."""

    __tablename__ = "training_runs"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'running', 'completed', 'failed', 'cancelled')",
            name="status",
        ),
        CheckConstraint("current_step >= 0", name="current_step_nonnegative"),
        CheckConstraint("total_steps IS NULL OR total_steps >= 0", name="total_steps_nonnegative"),
        Index("ix_training_runs_status", "status"),
        UniqueConstraint("external_id"),
    )

    external_id: Mapped[str] = mapped_column(String(160), nullable=False)
    name: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(
        String(24),
        nullable=False,
        server_default=text("'pending'"),
    )
    current_step: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )
    total_steps: Mapped[int | None] = mapped_column(Integer)
    dataset_repo: Mapped[str] = mapped_column(String(255), nullable=False)
    base_model: Mapped[str] = mapped_column(String(255), nullable=False)
    runtime: Mapped[str] = mapped_column(String(64), nullable=False)
    compute_target_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("compute_targets.id", ondelete="SET NULL"),
        index=True,
    )
    configuration: Mapped[JsonObject] = mapped_column(
        JSON_VALUE,
        nullable=False,
        default=empty_json,
        server_default=text("'{}'"),
    )
    summary_metrics: Mapped[JsonObject] = mapped_column(
        JSON_VALUE,
        nullable=False,
        default=empty_json,
        server_default=text("'{}'"),
    )
    output_model_repo: Mapped[str | None] = mapped_column(String(255))
    heartbeat_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class InferenceEndpoint(UuidPrimaryKeyMixin, TimestampMixin, Base):
    """Desired endpoint configuration and last observed lifecycle summary."""

    __tablename__ = "inference_endpoints"
    __table_args__ = (
        CheckConstraint(
            "status IN ('stopped', 'starting', 'ready', 'stopping', 'unreachable', 'failed')",
            name="status",
        ),
        Index("ix_inference_endpoints_status", "status"),
        UniqueConstraint("compute_target_id", "name"),
    )

    compute_target_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("compute_targets.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    runtime: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(
        String(24),
        nullable=False,
        server_default=text("'stopped'"),
    )
    endpoint_descriptor: Mapped[JsonObject] = mapped_column(
        JSON_VALUE,
        nullable=False,
        default=empty_json,
        server_default=text("'{}'"),
    )
    health_summary: Mapped[JsonObject] = mapped_column(
        JSON_VALUE,
        nullable=False,
        default=empty_json,
        server_default=text("'{}'"),
    )
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Deployment(UuidPrimaryKeyMixin, TimestampMixin, Base):
    """Desired and observed model assignment for one robot."""

    __tablename__ = "deployments"
    __table_args__ = (
        CheckConstraint("desired_state IN ('stopped', 'running')", name="desired_state"),
        CheckConstraint(
            "actual_state IN ('unknown', 'stopped', 'starting', 'running', 'stopping', 'failed')",
            name="actual_state",
        ),
        Index("ix_deployments_robot_id_is_active", "robot_id", "is_active"),
    )

    robot_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("robots.id", ondelete="RESTRICT"),
        nullable=False,
    )
    inference_endpoint_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("inference_endpoints.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    model_repo: Mapped[str] = mapped_column(String(255), nullable=False)
    model_revision: Mapped[str] = mapped_column(String(160), nullable=False)
    desired_state: Mapped[str] = mapped_column(
        String(24),
        nullable=False,
        server_default=text("'stopped'"),
    )
    actual_state: Mapped[str] = mapped_column(
        String(24),
        nullable=False,
        server_default=text("'unknown'"),
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false(),
    )


class Setting(TimestampMixin, Base):
    """Small non-secret application setting."""

    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(160), primary_key=True)
    value: Mapped[JsonObject] = mapped_column(JSON_VALUE, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)


ALL_MODELS: tuple[type[Base], ...] = (
    Robot,
    Recording,
    TrainingRun,
    ComputeTarget,
    InferenceEndpoint,
    Deployment,
    Setting,
)
