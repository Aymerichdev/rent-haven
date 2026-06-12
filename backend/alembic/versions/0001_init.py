"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-06-12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "profiles",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("email", sa.String, nullable=False, unique=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("role", sa.String, nullable=False, server_default="tenant"),
        sa.Column("avatar", sa.String, nullable=True),
        sa.Column("password_hash", sa.String, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_profiles_email", "profiles", ["email"])

    def created_updated():
        return [
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        ]

    op.create_table(
        "tenant_profiles",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=False), sa.ForeignKey("profiles.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("phone", sa.String, nullable=True),
        sa.Column("national_id", sa.String, nullable=True),
        sa.Column("occupation", sa.String, nullable=True),
        sa.Column("bio", sa.Text, nullable=True),
        sa.Column("recommendations", sa.Text, nullable=True),
        sa.Column("profile_photo_url", sa.String, nullable=True),
        sa.Column("photos", ARRAY(sa.String), nullable=True),
        sa.Column("employer", sa.String, nullable=True),
        sa.Column("work_certificate_url", sa.String, nullable=True),
        sa.Column("credit_auth", sa.Boolean, nullable=True),
        *created_updated(),
    )

    op.create_table(
        "owner_profiles",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=False), sa.ForeignKey("profiles.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("phone", sa.String, nullable=True),
        sa.Column("national_id", sa.String, nullable=True),
        sa.Column("company", sa.String, nullable=True),
        sa.Column("bio", sa.Text, nullable=True),
        sa.Column("photo_url", sa.String, nullable=True),
        *created_updated(),
    )

    op.create_table(
        "buildings",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("owner_id", UUID(as_uuid=False), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("address", sa.String, nullable=False),
        sa.Column("city", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("images", ARRAY(sa.String), nullable=True),
        sa.Column("amenity_ids", ARRAY(sa.String), nullable=True),
        *created_updated(),
    )

    op.create_table(
        "units",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("owner_id", UUID(as_uuid=False), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("building_id", UUID(as_uuid=False), sa.ForeignKey("buildings.id", ondelete="SET NULL"), nullable=True),
        sa.Column("tenant_id", UUID(as_uuid=False), sa.ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True),
        sa.Column("number", sa.String, nullable=False),
        sa.Column("title", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=False, server_default=""),
        sa.Column("type", sa.String, nullable=False, server_default="apartment"),
        sa.Column("images", ARRAY(sa.String), nullable=True),
        sa.Column("bedrooms", sa.Integer, nullable=False, server_default="1"),
        sa.Column("bathrooms", sa.Integer, nullable=False, server_default="1"),
        sa.Column("area", sa.Integer, nullable=False, server_default="0"),
        sa.Column("rent", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("status", sa.String, nullable=False, server_default="available"),
        sa.Column("featured", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("address_override", sa.String, nullable=True),
        sa.Column("city_override", sa.String, nullable=True),
        *created_updated(),
    )

    op.create_table(
        "amenities",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("building_id", UUID(as_uuid=False), sa.ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("icon", sa.String, nullable=False, server_default="sparkles"),
        sa.Column("bookable", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("photo_url", sa.String, nullable=True),
        sa.Column("capacity", sa.Integer, nullable=True),
        sa.Column("schedule", sa.JSON, nullable=True),
        *created_updated(),
    )

    op.create_table(
        "amenity_bookings",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("amenity_id", UUID(as_uuid=False), sa.ForeignKey("amenities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tenant_id", UUID(as_uuid=False), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("owner_id", UUID(as_uuid=False), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("date", sa.String, nullable=False),
        sa.Column("start_time", sa.String, nullable=False),
        sa.Column("end_time", sa.String, nullable=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("owner_note", sa.Text, nullable=True),
        sa.Column("status", sa.String, nullable=False, server_default="pending"),
        *created_updated(),
    )

    op.create_table(
        "meters",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("unit_id", UUID(as_uuid=False), sa.ForeignKey("units.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String, nullable=False),
        sa.Column("reading", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("date", sa.String, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "rental_requests",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("unit_id", UUID(as_uuid=False), sa.ForeignKey("units.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tenant_id", UUID(as_uuid=False), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("owner_id", UUID(as_uuid=False), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("phone", sa.String, nullable=False, server_default=""),
        sa.Column("message", sa.Text, nullable=False, server_default=""),
        sa.Column("status", sa.String, nullable=False, server_default="pending"),
        sa.Column("owner_response", sa.Text, nullable=True),
        sa.Column("national_id", sa.String, nullable=True),
        sa.Column("occupation", sa.String, nullable=True),
        sa.Column("bio", sa.Text, nullable=True),
        sa.Column("recommendations", sa.Text, nullable=True),
        sa.Column("profile_photo_url", sa.String, nullable=True),
        sa.Column("photos", ARRAY(sa.String), nullable=True),
        sa.Column("employer", sa.String, nullable=True),
        sa.Column("work_certificate_url", sa.String, nullable=True),
        sa.Column("credit_auth", sa.Boolean, nullable=True),
        *created_updated(),
    )

    op.create_table(
        "contracts",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("unit_id", UUID(as_uuid=False), sa.ForeignKey("units.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tenant_id", UUID(as_uuid=False), sa.ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True),
        sa.Column("owner_id", UUID(as_uuid=False), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("start_date", sa.String, nullable=False),
        sa.Column("end_date", sa.String, nullable=False),
        sa.Column("monthly_rent", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("deposit", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("status", sa.String, nullable=False, server_default="active"),
        sa.Column("contract_photo_url", sa.String, nullable=True),
        *created_updated(),
    )

    op.create_table(
        "payments",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("contract_id", UUID(as_uuid=False), sa.ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tenant_id", UUID(as_uuid=False), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("month", sa.String, nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("utilities", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("status", sa.String, nullable=False, server_default="pending"),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("receipt_data_url", sa.Text, nullable=True),
        sa.Column("receipt_name", sa.String, nullable=True),
        sa.Column("receipt_type", sa.String, nullable=True),
        sa.Column("receipt_uploaded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("owner_note", sa.Text, nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        *created_updated(),
    )

    op.create_table(
        "messages",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("sender_id", UUID(as_uuid=False), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("receiver_id", UUID(as_uuid=False), sa.ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subject", sa.String, nullable=False, server_default=""),
        sa.Column("body", sa.Text, nullable=False, server_default=""),
        sa.Column("read", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("unit_id", UUID(as_uuid=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    for t in [
        "messages", "payments", "contracts", "rental_requests", "meters",
        "amenity_bookings", "amenities", "units", "buildings",
        "owner_profiles", "tenant_profiles", "profiles",
    ]:
        op.drop_table(t)
