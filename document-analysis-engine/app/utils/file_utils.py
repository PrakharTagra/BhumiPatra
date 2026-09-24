import os
import uuid
from typing import Set
from fastapi import HTTPException
from app.config.settings import settings
from app.utils.logger import logger

ALLOWED_EXTENSIONS: Set[str] = {".pdf", ".jpg", ".jpeg", ".png", ".tiff", ".tif"}
ALLOWED_MIME_TYPES: Set[str] = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/tiff",
    "image/x-tiff",
}


def validate_file_metadata(filename: str, content_type: str, file_size: int):
    """
    Validate file extension, mime type, and size limits safely.
    """
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported formats: PDF, JPG, JPEG, PNG, TIFF."
        )

    if content_type and content_type.lower() not in ALLOWED_MIME_TYPES:
        if not content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid MIME type '{content_type}'. Must be PDF or image."
            )

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
        )


def create_temp_file(suffix: str = "") -> str:
    """Creates a temporary file path under the designated temp folder."""
    filename = f"bp_{uuid.uuid4().hex}{suffix}"
    return os.path.join(settings.TEMP_DIR, filename)


def cleanup_file(filepath: str):
    """Safely cleans up temporary file from disk."""
    if filepath and os.path.exists(filepath):
        try:
            os.remove(filepath)
        except Exception as e:
            logger.warning(f"Could not remove temp file '{filepath}': {e}")
