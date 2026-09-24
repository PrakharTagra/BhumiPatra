from app.schemas.response import OCRResult, PageOCRResult, OCRToken
from app.schemas.request import DocumentMetadataInput
from app.services.extraction_service import extraction_service
from app.services.confidence_service import confidence_service
from app.services.validation_service import validation_service


def test_zero_hallucination_on_empty_text():
    # If document has empty text, ALL values must be None, confidence 0, requiresVerification True
    empty_ocr = OCRResult(
        totalPages=1,
        pages=[PageOCRResult(pageNumber=1, width=100, height=100, tokens=[], pageText="")],
        fullText="",
    )

    fields = extraction_service.extract_fields(empty_ocr)

    assert fields.owner_name.value is None
    assert fields.owner_name.confidence == 0.0
    assert fields.owner_name.requiresVerification is True

    assert fields.khasra_number.value is None
    assert fields.khasra_number.confidence == 0.0
    assert fields.khasra_number.requiresVerification is True

    assert fields.area.value is None
    assert fields.area.confidence == 0.0
    assert fields.area.requiresVerification is True

    # Check validation catches missing required fields
    val = validation_service.validate_document(fields)
    assert val.status in ("FAILED", "WARNING")
    assert any(i.type == "REQUIRED_FIELD_MISSING" for i in val.issues)


def test_deterministic_extraction_hindi():
    sample_text = (
        "उत्तर प्रदेश भू-अभिलेख\n"
        "ग्राम: कमालपुर, तहसील: बख्शी का तालाब, जनपद: लखनऊ\n"
        "खातेदार का नाम: रामेश्वर दयाल शर्मा\n"
        "खसरा संख्या: 142/2\n"
        "खाता संख्या: 88\n"
        "क्षेत्रफल: 1.450 हेक्टेयर\n"
        "भूमि श्रेणी: संक्रमणीय भूमिधर\n"
    )

    tokens = [
        OCRToken(text="ग्राम: कमालपुर", bbox=[50, 50, 200, 70], confidence=0.96, language="hi"),
        OCRToken(text="खातेदार का नाम: रामेश्वर दयाल शर्मा", bbox=[50, 100, 400, 125], confidence=0.95, language="hi"),
        OCRToken(text="खसरा संख्या: 142/2", bbox=[50, 150, 250, 175], confidence=0.97, language="hi"),
        OCRToken(text="खाता संख्या: 88", bbox=[50, 200, 200, 225], confidence=0.94, language="hi"),
        OCRToken(text="क्षेत्रफल: 1.450 हेक्टेयर", bbox=[50, 250, 300, 275], confidence=0.95, language="hi"),
    ]

    ocr = OCRResult(
        totalPages=1,
        pages=[PageOCRResult(pageNumber=1, width=800, height=1000, tokens=tokens, pageText=sample_text)],
        fullText=sample_text,
    )

    meta = DocumentMetadataInput(district="लखनऊ", tehsil="बख्शी का तालाब", village="कमालपुर", state="उत्तर प्रदेश")
    fields = extraction_service.extract_fields(ocr, meta)

    # Check extracted values
    assert fields.khasra_number.value == "142/2"
    assert fields.khasra_number.confidence >= 0.80
    assert fields.khata_number.value == "88"
    assert fields.area.value == "1.450"
    assert fields.area.unit == "Hectare"
    assert "रामेश्वर दयाल शर्मा" in str(fields.owner_name.value)

    # Check confidence
    conf = confidence_service.compute_confidences(fields)
    assert conf.overallConfidence >= 80.0

    # Check validation
    val = validation_service.validate_document(fields, meta)
    assert val.status == "PASSED"
    assert val.checks.get("required_fields_present") is True
