from typing import Optional
from pydantic import BaseModel, Field


class DocumentMetadataInput(BaseModel):
    documentId: Optional[str] = Field(None, description="System document ID (e.g. DOC-2026-...)")
    documentType: Optional[str] = Field(None, description="KHATAUNI, KHASRA, JAMABANDI, MUTATION, SALE_DEED")
    state: Optional[str] = Field(None, description="State (e.g. Uttar Pradesh, Maharashtra)")
    district: Optional[str] = Field(None, description="District name")
    tehsil: Optional[str] = Field(None, description="Tehsil / Taluka name")
    village: Optional[str] = Field(None, description="Village / Mauza name")
    recordYear: Optional[int] = Field(None, description="Settlement / Record year")
