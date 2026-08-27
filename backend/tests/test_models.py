"""Persistence ownership and minimal-schema assertions."""

from ctrl_pi.db.base import Base
from ctrl_pi.db.models import ALL_MODELS

CONTROL_PLANE_TABLES = {
    "robots",
    "recordings",
    "training_runs",
    "compute_targets",
    "inference_endpoints",
    "deployments",
    "settings",
}


def test_metadata_contains_exactly_the_seven_v1_control_plane_tables() -> None:
    assert {model.__tablename__ for model in ALL_MODELS} == CONTROL_PLANE_TABLES
    assert set(Base.metadata.tables) == CONTROL_PLANE_TABLES


def test_schema_has_no_secret_or_high_frequency_telemetry_columns() -> None:
    forbidden_column_terms = {
        "action",
        "camera",
        "credential",
        "frame",
        "joint",
        "password",
        "private_key",
        "secret",
        "token",
    }

    for table in Base.metadata.sorted_tables:
        for column in table.columns:
            assert not any(term in column.name for term in forbidden_column_terms), (
                f"{table.name}.{column.name} violates a persistence boundary"
            )


def test_artifact_tables_store_references_instead_of_binary_payloads() -> None:
    recordings = Base.metadata.tables["recordings"]
    training_runs = Base.metadata.tables["training_runs"]
    deployments = Base.metadata.tables["deployments"]

    assert "dataset_repo" in recordings.columns
    assert "output_model_repo" in training_runs.columns
    assert {"model_repo", "model_revision"} <= set(deployments.columns.keys())
    assert all(
        column.type.python_type is not bytes
        for table in Base.metadata.tables.values()
        for column in table.columns
    )
