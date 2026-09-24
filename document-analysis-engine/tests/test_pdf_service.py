import io
import pytest
import pymupdf
from PIL import Image
from fastapi import HTTPException
from app.services.pdf_service import pdf_service


def test_pdf_ingestion_single_page():
    # Create valid in-memory PDF
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((50, 100), "BhumiPatra Test Land Record Page 1", fontsize=16)
    pdf_bytes = doc.tobytes()
    doc.close()

    result = pdf_service.load_document(pdf_bytes, "test.pdf", "application/pdf")
    assert result.page_count == 1
    assert result.pages[0].page_number == 1
    assert result.pages[0].original_image is not None
    assert result.pages[0].width > 0
    assert result.pages[0].height > 0


def test_pdf_ingestion_multipage():
    doc = pymupdf.open()
    doc.new_page(width=595, height=842)
    doc.new_page(width=595, height=842)
    doc.new_page(width=595, height=842)
    pdf_bytes = doc.tobytes()
    doc.close()

    result = pdf_service.load_document(pdf_bytes, "multi_test.pdf", "application/pdf")
    assert result.page_count == 3
    assert len(result.pages) == 3
    assert result.pages[2].page_number == 3


def test_image_ingestion():
    # Create valid in-memory PNG image
    img = Image.new("RGB", (400, 300), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_bytes = buf.getvalue()

    result = pdf_service.load_document(img_bytes, "sample.png", "image/png")
    assert result.page_count == 1
    assert result.pages[0].width == 400
    assert result.pages[0].height == 300


def test_corrupt_pdf_handling():
    corrupt_bytes = b"NOT_A_VALID_PDF_HEADER"
    with pytest.raises(HTTPException) as excinfo:
        pdf_service.load_document(corrupt_bytes, "corrupt.pdf", "application/pdf")
    assert excinfo.value.status_code == 400
