"""PostgREST-compatible generic dispatcher.

Supports the subset used by the frontend:
- GET    /rest/{table}?col=eq.value&col=in.(a,b)&or=(a.eq.x,b.eq.y)&order=col.desc&limit=10
         Header `Accept: application/vnd.pgrst.object+json` → single object (404 if 0)
- POST   /rest/{table}   body=row OR [row,...]
         Header `Prefer: resolution=merge-duplicates[,return=representation]` → upsert
- PATCH  /rest/{table}?col=eq.value   body=partial
- DELETE /rest/{table}?col=eq.value
"""
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy import or_, and_, inspect as sa_inspect
from sqlalchemy.orm import Session
from ..database import get_db
from ..deps import get_optional_user, get_current_user
from ..models import TABLES, Profile
from ..authz import can_read, can_write

router = APIRouter(prefix="/rest", tags=["data"])


def _model(table: str):
    if table not in TABLES:
        raise HTTPException(404, f"Tabla desconocida: {table}")
    return TABLES[table]


def _row_to_dict(row) -> dict:
    if row is None:
        return None
    return {c.key: getattr(row, c.key) for c in sa_inspect(row).mapper.column_attrs}


def _parse_op(model, expr: str):
    """Parse 'eq.value' / 'in.(a,b)' / 'neq.x' / 'is.null' / 'gt.10' style."""
    if "." not in expr:
        return None
    op, _, val = expr.partition(".")
    op = op.lower()
    if op == "eq":
        return val
    return ("__op__", op, val)


def _apply_filter(q, model, column: str, expr: str):
    col = getattr(model, column, None)
    if col is None:
        raise HTTPException(400, f"Columna desconocida {column}")
    op, _, val = expr.partition(".")
    op = op.lower()
    if op == "eq":
        return q.filter(col == val)
    if op == "neq":
        return q.filter(col != val)
    if op == "gt":
        return q.filter(col > val)
    if op == "gte":
        return q.filter(col >= val)
    if op == "lt":
        return q.filter(col < val)
    if op == "lte":
        return q.filter(col <= val)
    if op == "like":
        return q.filter(col.like(val))
    if op == "ilike":
        return q.filter(col.ilike(val))
    if op == "is":
        if val.lower() == "null":
            return q.filter(col.is_(None))
        if val.lower() == "true":
            return q.filter(col.is_(True))
        if val.lower() == "false":
            return q.filter(col.is_(False))
        return q.filter(col == val)
    if op == "in":
        inner = val.strip().lstrip("(").rstrip(")")
        items = [x.strip().strip('"') for x in inner.split(",") if x.strip()]
        return q.filter(col.in_(items))
    raise HTTPException(400, f"Operador no soportado: {op}")


def _apply_or(q, model, expr: str):
    """or=(a.eq.x,b.eq.y) → OR clauses."""
    inner = expr.strip().lstrip("(").rstrip(")")
    parts: list[str] = []
    depth = 0
    cur = ""
    for ch in inner:
        if ch == "(":
            depth += 1
            cur += ch
        elif ch == ")":
            depth -= 1
            cur += ch
        elif ch == "," and depth == 0:
            parts.append(cur)
            cur = ""
        else:
            cur += ch
    if cur:
        parts.append(cur)

    clauses = []
    for p in parts:
        col_name, _, rest = p.partition(".")
        col = getattr(model, col_name, None)
        if col is None:
            continue
        op, _, val = rest.partition(".")
        if op == "eq":
            clauses.append(col == val)
        elif op == "neq":
            clauses.append(col != val)
        elif op == "is" and val.lower() == "null":
            clauses.append(col.is_(None))
    if clauses:
        return q.filter(or_(*clauses))
    return q


def _apply_order(q, model, expr: str):
    """order=col.desc / col.asc(.nullslast)"""
    parts = expr.split(",")
    for p in parts:
        col_name, _, rest = p.partition(".")
        col = getattr(model, col_name, None)
        if col is None:
            continue
        if "desc" in rest:
            q = q.order_by(col.desc())
        else:
            q = q.order_by(col.asc())
    return q


@router.get("/{table}")
def list_rows(
    table: str,
    request: Request,
    db: Session = Depends(get_db),
    user: Optional[Profile] = Depends(get_optional_user),
    accept: str = Header(default=""),
):
    model = _model(table)
    q = db.query(model)
    q = can_read(table, q, user)

    for key, value in request.query_params.multi_items():
        if key in ("select", "limit", "offset", "order", "or"):
            continue
        q = _apply_filter(q, model, key, value)

    or_param = request.query_params.get("or")
    if or_param:
        q = _apply_or(q, model, or_param)

    order_param = request.query_params.get("order")
    if order_param:
        q = _apply_order(q, model, order_param)

    limit = request.query_params.get("limit")
    if limit:
        try:
            q = q.limit(int(limit))
        except ValueError:
            pass
    offset = request.query_params.get("offset")
    if offset:
        try:
            q = q.offset(int(offset))
        except ValueError:
            pass

    rows = [_row_to_dict(r) for r in q.all()]

    if "application/vnd.pgrst.object+json" in (accept or ""):
        if not rows:
            raise HTTPException(406, "Cero filas")
        if len(rows) > 1:
            raise HTTPException(406, "Múltiples filas")
        return rows[0]
    return rows


@router.post("/{table}")
def insert_rows(
    table: str,
    payload: Any,
    request: Request,
    db: Session = Depends(get_db),
    user: Profile = Depends(get_current_user),
    prefer: str = Header(default=""),
):
    model = _model(table)
    rows = payload if isinstance(payload, list) else [payload]
    upsert = "resolution=merge-duplicates" in (prefer or "")

    saved = []
    for r in rows:
        if not isinstance(r, dict):
            raise HTTPException(400, "Cuerpo debe ser objeto o lista de objetos")

        if upsert:
            # Find conflict by primary key or unique columns commonly used as conflict targets.
            existing = None
            if "id" in r and r["id"]:
                existing = db.query(model).filter(model.id == r["id"]).first()
            if not existing and "user_id" in r and hasattr(model, "user_id"):
                existing = db.query(model).filter(model.user_id == r["user_id"]).first()
            if existing:
                ok, msg = can_write(table, r, user, existing=existing)
                if not ok:
                    raise HTTPException(403, msg)
                for k, v in r.items():
                    if hasattr(existing, k):
                        setattr(existing, k, v)
                db.commit()
                db.refresh(existing)
                saved.append(_row_to_dict(existing))
                continue

        ok, msg = can_write(table, r, user)
        if not ok:
            raise HTTPException(403, msg)
        obj = model(**{k: v for k, v in r.items() if hasattr(model, k)})
        db.add(obj)
        db.commit()
        db.refresh(obj)
        saved.append(_row_to_dict(obj))

    return saved if isinstance(payload, list) else saved[0]


@router.patch("/{table}")
def update_rows(
    table: str,
    payload: dict,
    request: Request,
    db: Session = Depends(get_db),
    user: Profile = Depends(get_current_user),
):
    model = _model(table)
    q = db.query(model)
    has_filter = False
    for key, value in request.query_params.multi_items():
        if key in ("select", "limit", "order"):
            continue
        q = _apply_filter(q, model, key, value)
        has_filter = True
    if not has_filter:
        raise HTTPException(400, "PATCH requiere al menos un filtro")
    # also restrict to rows the user can read (so they can't update someone else's by guessing id)
    q = can_read(table, q, user)

    updated = []
    for existing in q.all():
        ok, msg = can_write(table, payload, user, existing=existing)
        if not ok:
            raise HTTPException(403, msg)
        for k, v in payload.items():
            if hasattr(existing, k):
                setattr(existing, k, v)
        updated.append(existing)
    db.commit()
    return [_row_to_dict(r) for r in updated]


@router.delete("/{table}")
def delete_rows(
    table: str,
    request: Request,
    db: Session = Depends(get_db),
    user: Profile = Depends(get_current_user),
):
    model = _model(table)
    q = db.query(model)
    has_filter = False
    for key, value in request.query_params.multi_items():
        q = _apply_filter(q, model, key, value)
        has_filter = True
    if not has_filter:
        raise HTTPException(400, "DELETE requiere al menos un filtro")
    q = can_read(table, q, user)
    rows = q.all()
    for existing in rows:
        ok, msg = can_write(table, {}, user, existing=existing)
        if not ok:
            raise HTTPException(403, msg)
        db.delete(existing)
    db.commit()
    return {"deleted": len(rows)}
