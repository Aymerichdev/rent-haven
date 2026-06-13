"""fix profile columns: owner_profiles rename + add columns, tenant_profiles add credit_auth_date

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-12
"""
import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── tenant_profiles ──────────────────────────────────────────────────────
    # Add credit_auth_date (the frontend sends this field; it was missing from
    # the initial schema and the SQLAlchemy model).
    op.add_column(
        "tenant_profiles",
        sa.Column("credit_auth_date", sa.DateTime(timezone=True), nullable=True),
    )

    # ── owner_profiles ───────────────────────────────────────────────────────
    # The frontend uses company_name / tax_id / profile_photo_url but the
    # initial schema created company / photo_url and had no tax_id column.

    # 1. Rename company → company_name
    op.alter_column("owner_profiles", "company", new_column_name="company_name")

    # 2. Rename photo_url → profile_photo_url
    op.alter_column("owner_profiles", "photo_url", new_column_name="profile_photo_url")

    # 3. Add tax_id
    op.add_column(
        "owner_profiles",
        sa.Column("tax_id", sa.String, nullable=True),
    )


def downgrade() -> None:
    # owner_profiles
    op.drop_column("owner_profiles", "tax_id")
    op.alter_column("owner_profiles", "profile_photo_url", new_column_name="photo_url")
    op.alter_column("owner_profiles", "company_name", new_column_name="company")

    # tenant_profiles
    op.drop_column("tenant_profiles", "credit_auth_date")
