"""Create the minimal V1 control-plane schema.

Revision ID: 0001_control_plane
Revises: None
"""

from collections.abc import Sequence
from datetime import datetime
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001_control_plane"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

JSON_VALUE = sa.JSON().with_variant(postgresql.JSONB(), "postgresql")


def timestamp_columns() -> tuple[sa.Column[datetime], sa.Column[datetime]]:
    return (
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )


def uuid_primary_key() -> sa.Column[UUID]:
    return sa.Column("id", sa.Uuid(), nullable=False)


def upgrade() -> None:
    op.create_table(
        "robots",
        uuid_primary_key(),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("display_name", sa.String(length=160), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("driver", sa.String(length=64), server_default=sa.text("'mock'"), nullable=False),
        sa.Column("connection_config", JSON_VALUE, server_default=sa.text("'{}'"), nullable=False),
        sa.Column("enabled", sa.Boolean(), server_default=sa.true(), nullable=False),
        *timestamp_columns(),
        sa.CheckConstraint("role IN ('leader', 'follower')", name=op.f("ck_robots_role")),
        sa.PrimaryKeyConstraint("id", name="pk_robots"),
        sa.UniqueConstraint("name", name="uq_robots_name"),
    )

    op.create_table(
        "compute_targets",
        uuid_primary_key(),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("display_name", sa.String(length=160), nullable=False),
        sa.Column("connection_config", JSON_VALUE, server_default=sa.text("'{}'"), nullable=False),
        sa.Column("enabled", sa.Boolean(), server_default=sa.true(), nullable=False),
        *timestamp_columns(),
        sa.PrimaryKeyConstraint("id", name="pk_compute_targets"),
        sa.UniqueConstraint("display_name", name="uq_compute_targets_display_name"),
    )

    op.create_table(
        "recordings",
        uuid_primary_key(),
        sa.Column("leader_robot_id", sa.Uuid(), nullable=False),
        sa.Column("follower_robot_id", sa.Uuid(), nullable=False),
        sa.Column("task", sa.Text(), nullable=False),
        sa.Column(
            "status", sa.String(length=24), server_default=sa.text("'draft'"), nullable=False
        ),
        sa.Column("episode_count", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("session_metadata", JSON_VALUE, server_default=sa.text("'{}'"), nullable=False),
        sa.Column("dataset_repo", sa.String(length=255), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        *timestamp_columns(),
        sa.CheckConstraint(
            "status IN ('draft', 'recording', 'finalizing', 'uploading', 'completed', 'failed')",
            name=op.f("ck_recordings_status"),
        ),
        sa.CheckConstraint(
            "episode_count >= 0",
            name=op.f("ck_recordings_episode_count_nonnegative"),
        ),
        sa.ForeignKeyConstraint(
            ["follower_robot_id"],
            ["robots.id"],
            name="fk_recordings_follower_robot_id_robots",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["leader_robot_id"],
            ["robots.id"],
            name="fk_recordings_leader_robot_id_robots",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_recordings"),
    )
    op.create_index("ix_recordings_follower_robot_id", "recordings", ["follower_robot_id"])
    op.create_index("ix_recordings_leader_robot_id", "recordings", ["leader_robot_id"])
    op.create_index("ix_recordings_status", "recordings", ["status"])

    op.create_table(
        "training_runs",
        uuid_primary_key(),
        sa.Column("external_id", sa.String(length=160), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=True),
        sa.Column(
            "status", sa.String(length=24), server_default=sa.text("'pending'"), nullable=False
        ),
        sa.Column("current_step", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("total_steps", sa.Integer(), nullable=True),
        sa.Column("dataset_repo", sa.String(length=255), nullable=False),
        sa.Column("base_model", sa.String(length=255), nullable=False),
        sa.Column("runtime", sa.String(length=64), nullable=False),
        sa.Column("compute_target_id", sa.Uuid(), nullable=True),
        sa.Column("configuration", JSON_VALUE, server_default=sa.text("'{}'"), nullable=False),
        sa.Column("summary_metrics", JSON_VALUE, server_default=sa.text("'{}'"), nullable=False),
        sa.Column("output_model_repo", sa.String(length=255), nullable=True),
        sa.Column("heartbeat_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        *timestamp_columns(),
        sa.CheckConstraint(
            "current_step >= 0",
            name=op.f("ck_training_runs_current_step_nonnegative"),
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'running', 'completed', 'failed', 'cancelled')",
            name=op.f("ck_training_runs_status"),
        ),
        sa.CheckConstraint(
            "total_steps IS NULL OR total_steps >= 0",
            name=op.f("ck_training_runs_total_steps_nonnegative"),
        ),
        sa.ForeignKeyConstraint(
            ["compute_target_id"],
            ["compute_targets.id"],
            name="fk_training_runs_compute_target_id_compute_targets",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_training_runs"),
        sa.UniqueConstraint("external_id", name="uq_training_runs_external_id"),
    )
    op.create_index("ix_training_runs_compute_target_id", "training_runs", ["compute_target_id"])
    op.create_index("ix_training_runs_status", "training_runs", ["status"])

    op.create_table(
        "inference_endpoints",
        uuid_primary_key(),
        sa.Column("compute_target_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("runtime", sa.String(length=64), nullable=False),
        sa.Column(
            "status", sa.String(length=24), server_default=sa.text("'stopped'"), nullable=False
        ),
        sa.Column("endpoint_descriptor", JSON_VALUE, server_default=sa.text("'{}'"), nullable=False),
        sa.Column("health_summary", JSON_VALUE, server_default=sa.text("'{}'"), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        *timestamp_columns(),
        sa.CheckConstraint(
            "status IN ('stopped', 'starting', 'ready', 'stopping', 'unreachable', 'failed')",
            name=op.f("ck_inference_endpoints_status"),
        ),
        sa.ForeignKeyConstraint(
            ["compute_target_id"],
            ["compute_targets.id"],
            name="fk_inference_endpoints_compute_target_id_compute_targets",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_inference_endpoints"),
        sa.UniqueConstraint(
            "compute_target_id",
            "name",
            name="uq_inference_endpoints_compute_target_id_name",
        ),
    )
    op.create_index(
        "ix_inference_endpoints_compute_target_id",
        "inference_endpoints",
        ["compute_target_id"],
    )
    op.create_index("ix_inference_endpoints_status", "inference_endpoints", ["status"])

    op.create_table(
        "deployments",
        uuid_primary_key(),
        sa.Column("robot_id", sa.Uuid(), nullable=False),
        sa.Column("inference_endpoint_id", sa.Uuid(), nullable=False),
        sa.Column("model_repo", sa.String(length=255), nullable=False),
        sa.Column("model_revision", sa.String(length=160), nullable=False),
        sa.Column(
            "desired_state",
            sa.String(length=24),
            server_default=sa.text("'stopped'"),
            nullable=False,
        ),
        sa.Column(
            "actual_state",
            sa.String(length=24),
            server_default=sa.text("'unknown'"),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), server_default=sa.false(), nullable=False),
        *timestamp_columns(),
        sa.CheckConstraint(
            "actual_state IN ('unknown', 'stopped', 'starting', 'running', 'stopping', 'failed')",
            name=op.f("ck_deployments_actual_state"),
        ),
        sa.CheckConstraint(
            "desired_state IN ('stopped', 'running')",
            name=op.f("ck_deployments_desired_state"),
        ),
        sa.ForeignKeyConstraint(
            ["inference_endpoint_id"],
            ["inference_endpoints.id"],
            name="fk_deployments_inference_endpoint_id_inference_endpoints",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["robot_id"],
            ["robots.id"],
            name="fk_deployments_robot_id_robots",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_deployments"),
    )
    op.create_index(
        "ix_deployments_inference_endpoint_id",
        "deployments",
        ["inference_endpoint_id"],
    )
    op.create_index(
        "ix_deployments_robot_id_is_active",
        "deployments",
        ["robot_id", "is_active"],
    )

    op.create_table(
        "settings",
        sa.Column("key", sa.String(length=160), nullable=False),
        sa.Column("value", JSON_VALUE, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        *timestamp_columns(),
        sa.PrimaryKeyConstraint("key", name="pk_settings"),
    )


def downgrade() -> None:
    op.drop_table("settings")
    op.drop_index("ix_deployments_robot_id_is_active", table_name="deployments")
    op.drop_index("ix_deployments_inference_endpoint_id", table_name="deployments")
    op.drop_table("deployments")
    op.drop_index("ix_inference_endpoints_status", table_name="inference_endpoints")
    op.drop_index("ix_inference_endpoints_compute_target_id", table_name="inference_endpoints")
    op.drop_table("inference_endpoints")
    op.drop_index("ix_training_runs_status", table_name="training_runs")
    op.drop_index("ix_training_runs_compute_target_id", table_name="training_runs")
    op.drop_table("training_runs")
    op.drop_index("ix_recordings_status", table_name="recordings")
    op.drop_index("ix_recordings_leader_robot_id", table_name="recordings")
    op.drop_index("ix_recordings_follower_robot_id", table_name="recordings")
    op.drop_table("recordings")
    op.drop_table("compute_targets")
    op.drop_table("robots")
