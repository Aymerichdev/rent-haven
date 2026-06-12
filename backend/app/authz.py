"""Per-table authorization rules — replaces RLS.

Each rule receives the SQLAlchemy query and the current user, and must return
a filtered query. `write_check` validates the incoming payload for INSERT/UPDATE.
"""
from typing import Callable, Optional
from sqlalchemy.orm import Query
from .models import (
    Profile, TenantProfile, OwnerProfile, Building, Unit, Amenity,
    AmenityBooking, Meter, RentalRequest, Contract, Payment, Message, TABLES
)

PUBLIC_READ_TABLES = {"units", "buildings", "amenities", "profiles"}


def _filter_eq(q: Query, model, field: str, value):
    return q.filter(getattr(model, field) == value)


def can_read(table: str, q: Query, user: Optional[Profile]) -> Query:
    """Return a query filtered to rows the user is allowed to read."""
    model = TABLES[table]
    if user is None:
        # Anonymous — only public-read tables, and only "safe" rows
        if table == "units":
            return q.filter(Unit.status == "available")
        if table in ("buildings", "amenities", "profiles"):
            return q
        # everything else: deny
        return q.filter(False)

    if user.role == "admin":
        return q

    # Authenticated users
    if table == "profiles":
        # Can read self always; owners can read tenants and vice-versa (names for UI).
        return q
    if table == "tenant_profiles":
        if user.role == "tenant":
            return _filter_eq(q, model, "user_id", user.id)
        # owners can read tenant profiles (needed for rental request screens)
        return q
    if table == "owner_profiles":
        if user.role == "owner":
            return _filter_eq(q, model, "user_id", user.id)
        return q
    if table == "buildings":
        if user.role == "owner":
            return _filter_eq(q, model, "owner_id", user.id)
        return q  # tenants can see all buildings
    if table == "units":
        if user.role == "owner":
            return _filter_eq(q, model, "owner_id", user.id)
        return q
    if table == "amenities":
        return q
    if table == "amenity_bookings":
        if user.role == "owner":
            return _filter_eq(q, model, "owner_id", user.id)
        return _filter_eq(q, model, "tenant_id", user.id)
    if table == "meters":
        # owner sees meters for their units; tenant sees meters of their rented unit
        from sqlalchemy import or_
        if user.role == "owner":
            return q.join(Unit, Unit.id == Meter.unit_id).filter(Unit.owner_id == user.id)
        return q.join(Unit, Unit.id == Meter.unit_id).filter(Unit.tenant_id == user.id)
    if table == "rental_requests":
        from sqlalchemy import or_
        return q.filter(or_(RentalRequest.tenant_id == user.id, RentalRequest.owner_id == user.id))
    if table == "contracts":
        from sqlalchemy import or_
        return q.filter(or_(Contract.tenant_id == user.id, Contract.owner_id == user.id))
    if table == "payments":
        from sqlalchemy import or_
        if user.role == "owner":
            return q.join(Contract, Contract.id == Payment.contract_id).filter(Contract.owner_id == user.id)
        return _filter_eq(q, model, "tenant_id", user.id)
    if table == "messages":
        from sqlalchemy import or_
        return q.filter(or_(Message.sender_id == user.id, Message.receiver_id == user.id))
    return q.filter(False)


def can_write(table: str, payload: dict, user: Profile, existing=None) -> tuple[bool, str]:
    """Validate that the user may insert/update this row. Returns (ok, reason)."""
    if user.role == "admin":
        return True, ""

    role = user.role
    pid = user.id

    if table == "profiles":
        # users can only update themselves
        target = (existing.id if existing else payload.get("id"))
        return (target == pid), "Solo puedes editar tu propio perfil"
    if table == "tenant_profiles":
        target = (existing.user_id if existing else payload.get("user_id"))
        return (role == "tenant" and target == pid), "Solo el inquilino dueño puede editar"
    if table == "owner_profiles":
        target = (existing.user_id if existing else payload.get("user_id"))
        return (role == "owner" and target == pid), "Solo el propietario dueño puede editar"
    if table in ("buildings", "units", "amenities", "meters", "contracts"):
        target = (existing.owner_id if existing and hasattr(existing, "owner_id")
                  else payload.get("owner_id"))
        # meters use unit ownership — check on insert
        if table == "meters" and not target and not existing:
            return (role == "owner"), "Solo propietarios"
        return (role == "owner" and (target == pid or target is None)), "Solo propietarios pueden modificar sus recursos"
    if table == "amenity_bookings":
        if existing:
            return (existing.tenant_id == pid or existing.owner_id == pid), "Reserva ajena"
        return (role == "tenant" and payload.get("tenant_id") == pid), "Solo el inquilino puede reservar"
    if table == "rental_requests":
        if existing:
            # owner approves/rejects; tenant can update their own
            return (existing.owner_id == pid or existing.tenant_id == pid), "Solicitud ajena"
        return (role == "tenant" and payload.get("tenant_id") == pid), "Solo inquilinos pueden solicitar"
    if table == "payments":
        if existing:
            # tenant uploads receipt; owner reviews
            from .database import SessionLocal
            with SessionLocal() as db:
                contract = db.query(Contract).filter(Contract.id == existing.contract_id).first()
            if not contract:
                return False, "Contrato no encontrado"
            return (contract.owner_id == pid or existing.tenant_id == pid), "Pago ajeno"
        # insert: only owner of the contract
        if role != "owner":
            return False, "Solo propietarios generan pagos"
        return True, ""
    if table == "messages":
        if existing:
            return (existing.sender_id == pid or existing.receiver_id == pid), "Mensaje ajeno"
        return (payload.get("sender_id") == pid), "El sender debe ser el usuario actual"
    return False, "Tabla no permitida"
