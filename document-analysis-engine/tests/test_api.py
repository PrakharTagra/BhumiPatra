import io
import pymupdf
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ocrEngine" in data


def test_version_endpoint():
    response = client.get("/api/version")
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == "1.0.0"
    assert "supportedFormats" in data


def test_analyze_empty_file_rejected():
    response = client.post(
        "/analyze",
        files={"file": ("empty.pdf", b"", "application/pdf")},
    )
    assert response.status_code == 400


def test_analyze_unsupported_format_rejected():
    response = client.post(
        "/analyze",
        files={"file": ("malicious.exe", b"fake binary", "application/x-msdownload")},
    )
    assert response.status_code == 400


def test_analyze_real_pdf_document():
    # Build a real PDF with sample land record text
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    sample_text = (
        "GOVERNMENT OF UTTAR PRADESH - REVENUE DEPARTMENT\n"
        "KHATAUNI (RECORD OF RIGHTS)\n"
        "Village: Kamalpur, Tehsil: Bakshi Ka Talab, District: Lucknow, State: Uttar Pradesh\n"
        "Owner Name: Rameshwar Dayal Sharma\n"
        "Khasra No: 142/2\n"
        "Khata No: 88\n"
        "Area: 1.45 Hectare\n"
        "Classification: Agricultural Land\n"
    )
    page.insert_text((50, 80), sample_text, fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()

    response = client.post(
        "/analyze",
        files={"file": ("land_record_sample.pdf", pdf_bytes, "application/pdf")},
        data={
            "documentId": "DOC-TEST-001",
            "documentType": "KHATAUNI",
            "state": "Uttar Pradesh",
            "district": "Lucknow",
            "tehsil": "Bakshi Ka Talab",
            "village": "Kamalpur",
            "recordYear": "2023",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["document"]["pageCount"] == 1
    assert "ocr" in payload
    assert "extractedFields" in payload
    assert "validation" in payload
    assert "confidence" in payload
    assert "processing" in payload
    assert payload["processing"]["status"] == "COMPLETED"
