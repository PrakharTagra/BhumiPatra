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
    # Ensure tokens and bounding boxes are populated from OCR
    assert len(payload["ocr"]["pages"][0]["tokens"]) > 0
    token_sample = payload["ocr"]["pages"][0]["tokens"][0]
    assert len(token_sample["bbox"]) == 4
    # Ensure missing fields remain None, not fabricated
    assert payload["extractedFields"]["mutation_number"]["value"] is None
    assert payload["extractedFields"]["registration_number"]["value"] is None


def test_analyze_image_input():
    import cv2
    import numpy as np
    img = np.ones((400, 600, 3), dtype=np.uint8) * 255
    cv2.putText(img, "Khasra Number: 55/1", (30, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
    cv2.putText(img, "Khata Number: 202", (30, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
    cv2.putText(img, "Owner Name: Ram Prasad", (30, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
    _, png_bytes = cv2.imencode(".png", img)

    response = client.post(
        "/analyze",
        files={"file": ("sample_record.png", png_bytes.tobytes(), "image/png")},
        data={"documentId": "IMG-001", "state": "Uttar Pradesh"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["document"]["pageCount"] == 1
    assert payload["extractedFields"]["khasra_number"]["value"] == "55/1"
    assert payload["extractedFields"]["khata_number"]["value"] == "202"
    assert "Ram Prasad" in str(payload["extractedFields"]["owner_name"]["value"])


def test_analyze_multipage_pdf():
    doc = pymupdf.open()
    p1 = doc.new_page(width=595, height=842)
    p1.insert_text((50, 100), "Page 1: Khata No: 184 Owner: Rajesh Kumar", fontsize=14)
    p2 = doc.new_page(width=595, height=842)
    p2.insert_text((50, 100), "Page 2: Khasra No: 127/2 Area: 0.8420 Hectare", fontsize=14)
    pdf_bytes = doc.tobytes()
    doc.close()

    response = client.post(
        "/analyze",
        files={"file": ("multipage.pdf", pdf_bytes, "application/pdf")},
        data={"documentId": "MULTI-001"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["document"]["pageCount"] == 2
    assert len(payload["ocr"]["pages"]) == 2
    assert payload["processing"]["pagesProcessed"] == 2
