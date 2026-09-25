from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class OCRToken(BaseModel):
    text: str
    bbox: List[int] = Field(description="Bounding box [x1, y1, x2, y2]")
    confidence: float = Field(ge=0.0, le=1.0)
    language: Optional[str] = None


class PageOCRResult(BaseModel):
    pageNumber: int
    width: int
    height: int
    tokens: List[OCRToken] = []
    pageText: str
    orientationAngle: float = 0.0


class OCRResult(BaseModel):
    totalPages: int
    languages: List[str] = ["hi", "en"]
    pages: List[PageOCRResult] = []
    fullText: str


class FieldExtractionResult(BaseModel):
    value: Any = None
    confidence: float = 0.0
    requiresVerification: bool = True
    bbox: Optional[List[int]] = None
    page: Optional[int] = None
    evidence: Optional[str] = None
    unit: Optional[str] = None


class ExtractedFields(BaseModel):
    owner_name: FieldExtractionResult
    co_owners: FieldExtractionResult
    khasra_number: FieldExtractionResult
    khata_number: FieldExtractionResult
    survey_number: FieldExtractionResult
    plot_number: FieldExtractionResult
    area: FieldExtractionResult
    area_unit: FieldExtractionResult
    village: FieldExtractionResult
    tehsil: FieldExtractionResult
    district: FieldExtractionResult
    state: FieldExtractionResult
    land_classification: FieldExtractionResult
    ownership_type: FieldExtractionResult
    mutation_number: FieldExtractionResult
    mutation_date: FieldExtractionResult
    registration_number: FieldExtractionResult
    registration_date: FieldExtractionResult
    father_guardian_name: Optional[FieldExtractionResult] = None
    landholders: List[Dict[str, Any]] = []
    landParcels: List[Dict[str, Any]] = []
    mutations: List[Dict[str, Any]] = []
    registrations: List[Dict[str, Any]] = []


class ValidationIssue(BaseModel):
    field: str
    type: str
    message: str
    severity: str = "WARNING"  # ERROR, WARNING, INFO


class ValidationResult(BaseModel):
    status: str = "PASSED"  # PASSED, WARNING, FAILED
    score: float = 100.0
    issues: List[ValidationIssue] = []
    checks: Dict[str, bool] = {}


class ConfidenceSummary(BaseModel):
    overallConfidence: float
    fieldConfidences: Dict[str, float] = {}
    requiresHumanVerification: bool = False
    reasons: List[str] = []


class ProcessingMetadata(BaseModel):
    status: str = "COMPLETED"
    pagesProcessed: int = 1
    processingTimeMs: int = 0
    ocrEngine: str = "PaddleOCR"
    timestamp: str


class DocumentMetadata(BaseModel):
    pageCount: int
    languages: List[str]
    mimeType: Optional[str] = None
    originalFilename: Optional[str] = None
    fileSizeBytes: Optional[int] = None


class AnalyzeResponse(BaseModel):
    success: bool = True
    document: DocumentMetadata
    ocr: OCRResult
    extractedFields: ExtractedFields
    validation: ValidationResult
    confidence: ConfidenceSummary
    processing: ProcessingMetadata
    landholders: List[Dict[str, Any]] = []
    landParcels: List[Dict[str, Any]] = []
    mutations: List[Dict[str, Any]] = []
    registrations: List[Dict[str, Any]] = []
