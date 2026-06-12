"""Wrapper around Supabase Storage (file uploads only)."""
from typing import Optional
from .config import settings

try:
    from supabase import create_client, Client
    _client: Optional["Client"] = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY) \
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY else None
except Exception:
    _client = None

BUCKET = settings.SUPABASE_BUCKET


def upload_bytes(path: str, content: bytes, content_type: str) -> str:
    if not _client:
        raise RuntimeError("Supabase storage no configurado (SUPABASE_URL/SUPABASE_SERVICE_KEY).")
    _client.storage.from_(BUCKET).upload(
        path=path, file=content, file_options={"content-type": content_type, "upsert": "false"}
    )
    return _client.storage.from_(BUCKET).get_public_url(path)


def remove_path(path: str) -> None:
    if not _client:
        return
    try:
        _client.storage.from_(BUCKET).remove([path])
    except Exception:
        pass


def list_folder(folder: str) -> list[dict]:
    if not _client:
        return []
    try:
        return _client.storage.from_(BUCKET).list(folder) or []
    except Exception:
        return []


def public_url(path: str) -> str:
    if not _client:
        return ""
    return _client.storage.from_(BUCKET).get_public_url(path)
