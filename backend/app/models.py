"""All SQLAlchemy models for the application."""
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Numeric, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
from .database import Base


def uid():
    return str(uuid.uuid4())


# ---------- Users / Profiles ----------

class Profile(Base):
    """Cuenta de usuario + role. Equivalente a auth.users + profiles antiguos."""
    __tablename__ = "profiles"
    id = Column(UUID(as_uuid=False), primary_key=True, default=uid)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="tenant")  # admin | owner | tenant
    avatar = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class TenantProfile(Base):
    __tablename__ = "tenant_profiles"
    id = Column(UUID(as_uuid=False), primary_key=True, default=uid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("profiles.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    phone = Column(String, nullable=True)
    national_id = Column(String, nullable=True)
    occupation = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    profile_photo_url = Column(String, nullable=True)
    photos = Column(ARRAY(String), nullable=True, default=list)
    employer = Column(String, nullable=True)
    work_certificate_url = Column(String, nullable=True)
    credit_auth = Column(Boolean, nullable=True, default=False)
    credit_auth_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class OwnerProfile(Base):
    __tablename__ = "owner_profiles"
    id = Column(UUID(as_uuid=False), primary_key=True, default=uid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("profiles.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    phone = Column(String, nullable=True)
    national_id = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    tax_id = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    profile_photo_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


# ---------- Real estate ----------

class Building(Base):
    __tablename__ = "buildings"
    id = Column(UUID(as_uuid=False), primary_key=True, default=uid)
    owner_id = Column(UUID(as_uuid=False), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    images = Column(ARRAY(String), nullable=True, default=list)
    amenity_ids = Column(ARRAY(String), nullable=True, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Unit(Base):
    __tablename__ = "units"
    id = Column(UUID(as_uuid=False), primary_key=True, default=uid)
    owner_id = Column(UUID(as_uuid=False), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    building_id = Column(UUID(as_uuid=False), ForeignKey("buildings.id", ondelete="SET NULL"), nullable=True, index=True)
    tenant_id = Column(UUID(as_uuid=False), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True, index=True)
    number = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False, default="")
    type = Column(String, nullable=False, default="apartment")  # apartment | house | studio
    images = Column(ARRAY(String), nullable=True, default=list)
    bedrooms = Column(Integer, nullable=False, default=1)
    bathrooms = Column(Integer, nullable=False, default=1)
    area = Column(Integer, nullable=False, default=0)
    rent = Column(Numeric(12, 2), nullable=False, default=0)
    status = Column(String, nullable=False, default="available")  # available | rented | maintenance
    featured = Column(Boolean, nullable=False, default=False)
    address_override = Column(String, nullable=True)
    city_override = Column(String, nullable=True)
    click_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Amenity(Base):
    __tablename__ = "amenities"
    id = Column(UUID(as_uuid=False), primary_key=True, default=uid)
    building_id = Column(UUID(as_uuid=False), ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    icon = Column(String, nullable=False, default="sparkles")
    bookable = Column(Boolean, nullable=False, default=False)
    description = Column(Text, nullable=True)
    photo_url = Column(String, nullable=True)
    capacity = Column(Integer, nullable=True)
    schedule = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class AmenityBooking(Base):
    __tablename__ = "amenity_bookings"
    id = Column(UUID(as_uuid=False), primary_key=True, default=uid)
    amenity_id = Column(UUID(as_uuid=False), ForeignKey("amenities.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id = Column(UUID(as_uuid=False), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(UUID(as_uuid=False), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    owner_note = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending | approved | rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Meter(Base):
    __tablename__ = "meters"
    id = Column(UUID(as_uuid=False), primary_key=True, default=uid)
    unit_id = Column(UUID(as_uuid=False), ForeignKey("units.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)  # water | electricity | gas
    reading = Column(Numeric(12, 2), nullable=False, default=0)
    date = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class RentalRequest(Base):
    __tablename__ = "rental_requests"
    id = Column(UUID(as_uuid=False), primary_key=True, default=uid)
    unit_id = Column(UUID(as_uuid=False), ForeignKey("units.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id = Column(UUID(as_uuid=False), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(UUID(as_uuid=False), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    phone = Column(String, nullable=False, default="")
    message = Column(Text, nullable=False, default="")
    status = Column(String, nullable=False, default="pending")  # pending | approved | rejected
    owner_response = Column(Text, nullable=True)
    national_id = Column(String, nullable=True)
    occupation = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    profile_photo_url = Column(String, nullable=True)
    photos = Column(ARRAY(String), nullable=True, default=list)
    employer = Column(String, nullable=True)
    work_certificate_url = Column(String, nullable=True)
    credit_auth = Column(Boolean, nullable=True, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Contract(Base):
    __tablename__ = "contracts"
    id = Column(UUID(as_uuid=False), primary_key=True, default=uid)
    unit_id = Column(UUID(as_uuid=False), ForeignKey("units.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id = Column(UUID(as_uuid=False), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True, index=True)
    owner_id = Column(UUID(as_uuid=False), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)
    monthly_rent = Column(Numeric(12, 2), nullable=False, default=0)
    deposit = Column(Numeric(12, 2), nullable=False, default=0)
    status = Column(String, nullable=False, default="active")  # active | ended
    contract_photo_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Payment(Base):
    __tablename__ = "payments"
    id = Column(UUID(as_uuid=False), primary_key=True, default=uid)
    contract_id = Column(UUID(as_uuid=False), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id = Column(UUID(as_uuid=False), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    month = Column(String, nullable=False)  # YYYY-MM
    amount = Column(Numeric(12, 2), nullable=False, default=0)
    utilities = Column(Numeric(12, 2), nullable=False, default=0)
    status = Column(String, nullable=False, default="pending")
    paid_at = Column(DateTime(timezone=True), nullable=True)
    receipt_data_url = Column(Text, nullable=True)
    receipt_name = Column(String, nullable=True)
    receipt_type = Column(String, nullable=True)
    receipt_uploaded_at = Column(DateTime(timezone=True), nullable=True)
    owner_note = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Message(Base):
    __tablename__ = "messages"
    id = Column(UUID(as_uuid=False), primary_key=True, default=uid)
    sender_id = Column(UUID(as_uuid=False), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id = Column(UUID(as_uuid=False), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    subject = Column(String, nullable=False, default="")
    body = Column(Text, nullable=False, default="")
    read = Column(Boolean, nullable=False, default=False)
    unit_id = Column(UUID(as_uuid=False), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# Mapping table-name -> model for the generic dispatcher
TABLES = {
    "profiles": Profile,
    "tenant_profiles": TenantProfile,
    "owner_profiles": OwnerProfile,
    "buildings": Building,
    "units": Unit,
    "amenities": Amenity,
    "amenity_bookings": AmenityBooking,
    "meters": Meter,
    "rental_requests": RentalRequest,
    "contracts": Contract,
    "payments": Payment,
    "messages": Message,
}
