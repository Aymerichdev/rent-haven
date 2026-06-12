"""Storage proxy → Supabase Storage."""
import uuid
from pathlib import PurePosixPath
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from ..deps import get_current_user
from ..models import Profile
from ..storage import upload_bytes, remove_path, list_folder, public_url, BUCKET

router = APIRouter(prefix="/storage", tags=["storage"])

MAX_BYTES = 5 * 1024 * 1024


@router.post("/upload")
async def upload(
    folder: str = Form(...),
    file: UploadFile = File(...),
    user: Profile = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Solo se permiten imágenes")
    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(400, "El archivo supera los 5MB")
    ext = (file.filename or "img.jpg").split(".")[-1].lower()
    folder_clean = folder.strip("/")
    path = f"{folder_clean}/{uuid.uuid4()}.{ext}"
    url = upload_bytes(path, content, file.content_type)
    return {"url": url, "path": path, "bucket": BUCKET}


@router.delete("/object")
def delete_object(path: str, user: Profile = Depends(get_current_user)):
    remove_path(path)
    return {"ok": True}


@router.get("/list")
def list_files(folder: str, user: Profile = Depends(get_current_user)):
    return list_folder(folder)


@router.get("/public-url")
def get_public_url(path: str):
    return {"url": public_url(path)}
