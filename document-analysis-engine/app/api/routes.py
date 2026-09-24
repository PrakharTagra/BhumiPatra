import time
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Header, status
from app.config.settings import settings
from app.schemas.response import (
    AnalyzeResponse,
    DocumentMetadata,
    ProcessingMetadata,
)
from app.schemas.request import DocumentMetadataInput
from app.services import (
    pdf_service,
    preprocessing_service,
    ocr_service,
    extraction_service,
    confidence_service,
    validation_service,
)
from app.utils.file_utils import validate_file_metadata
from app.utils.logger import logger

router = APIRouter()


@router.get("/health", tags=["System"])
async def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "service": "BhumiPatra Document Analysis Engine",
        "version": "1.0.0",
        "ocrEngine": settings.OCR_ENGINE,
        "languages": settings.language_list,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/api/version", tags=["System"])
async def get_version():
    """Version and capability inspection endpoint."""
    return {
        "version": "1.0.0",
        "ocrEngine": settings.OCR_ENGINE,
        "languages": settings.language_list,
        "supportedFormats": ["PDF", "JPG", "JPEG", "PNG", "TIFF"],
        "maxFileSizeMB": settings.MAX_FILE_SIZE_MB,
        "highConfidenceThreshold": settings.HIGH_CONFIDENCE_THRESHOLD,
        "reviewThreshold": settings.REVIEW_THRESHOLD,
    }


@router.post("/analyze", response_model=AnalyzeResponse, tags=["Document Analysis"])
async def analyze_document(
    file: UploadFile = File(..., description="Document scan (PDF, JPG, PNG, TIFF)"),
    documentId: Optional[str] = Form(None),
    documentType: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    tehsil: Optional[str] = Form(None),
    village: Optional[str] = Form(None),
    recordYear: Optional[int] = Form(None),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
):
    """
    Primary Document Analysis Pipeline:
    Ingestion -> Preprocessing (Deskew/Clean) -> OCR (PaddleOCR) -> Field Extraction -> Confidence -> Validation
    """
    start_time = time.time()
    filename = file.filename or "uploaded_document"
    content_type = file.content_type or "application/octet-stream"
    if content_type in ("application/octet-stream", None, ""):
        ext = os.path.splitext(filename)[1].lower()
        ext_to_mime = {
            ".pdf": "application/pdf",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".tif": "image/tiff",
            ".tiff": "image/tiff",
        }
        content_type = ext_to_mime.get(ext, content_type)

    # Optional internal API authentication check between Node backend and Python engine
    if settings.INTERNAL_API_KEY and x_api_key:
        if x_api_key != settings.INTERNAL_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized: Invalid internal engine API key."
            )

    logger.info(f"Incoming document analysis request: '{filename}' (ID: {documentId or 'N/A'})")

    try:
        # Read file contents
        file_bytes = await file.read()
        file_size = len(file_bytes)

        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The submitted document file is empty (0 bytes)."
            )

        # 1. Validate MIME and extension
        validate_file_metadata(filename, content_type, file_size)

        # 2. Ingest Document (Multi-page PDF or single-page image)
        doc_data = pdf_service.load_document(file_bytes, filename, content_type)

        # 3. Preprocess each page (Orientation, Deskew, Contrast, Noise Reduction)
        for page in doc_data.pages:
            preprocessing_service.preprocess_page(page)

        # 4. Multi-page OCR with PaddleOCR (tokens, bounding boxes, confidences)
        ocr_result = ocr_service.perform_ocr(doc_data)

        # 5. Hybrid deterministic Land Record Field Extraction
        metadata = DocumentMetadataInput(
            documentId=documentId,
            documentType=documentType,
            state=state,
            district=district,
            tehsil=tehsil,
            village=village,
            recordYear=recordYear,
        )
        extracted_fields = extraction_service.extract_fields(ocr_result, metadata)

        # 6. Field-level & Overall Confidence Scoring
        confidence_summary = confidence_service.compute_confidences(extracted_fields)

        # 7. Rule-based Validation (Required fields, format standards, cross-checks)
        validation_result = validation_service.validate_document(extracted_fields, metadata)

        elapsed_ms = int((time.time() - start_time) * 1000)

        # 8. Prepare structured response
        response = AnalyzeResponse(
            success=True,
            document=DocumentMetadata(
                pageCount=doc_data.page_count,
                languages=settings.language_list,
                mimeType=content_type,
                originalFilename=filename,
                fileSizeBytes=file_size,
            ),
            ocr=ocr_result,
            extractedFields=extracted_fields,
            validation=validation_result,
            confidence=confidence_summary,
            processing=ProcessingMetadata(
                status="COMPLETED",
                pagesProcessed=doc_data.page_count,
                processingTimeMs=elapsed_ms,
                ocrEngine=settings.OCR_ENGINE,
                timestamp=datetime.now(timezone.utc).isoformat(),
            ),
        )

        logger.info(
            f"Successfully analyzed '{filename}' in {elapsed_ms}ms. "
            f"Pages: {doc_data.page_count}, Overall Confidence: {confidence_summary.overallConfidence}%, "
            f"Validation Status: {validation_result.status}"
        )
        return response

    except HTTPException:
        raise
    except Exception as e:
        elapsed_ms = int((time.time() - start_time) * 1000)
        logger.error(f"Analysis pipeline error on '{filename}': {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document analysis failed: {str(e)}"
        )
