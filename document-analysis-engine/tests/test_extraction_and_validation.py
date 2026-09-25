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


def test_structured_land_record_extraction():
    sample_text = (
        "GOVERNMENT OF UTTAR PRADESH\n"
        "REVENUE DEPARTMENT - RECORD OF RIGHTS (KHATAUNI)\n\n"
        "REVENUE JURISDICTION\n"
        "State: Uttar Pradesh\n"
        "District: Lucknow\n"
        "Tehsil: Bakshi Ka Talab\n"
        "Village: Rampur Kalan\n\n"
        "LANDHOLDER / OWNERSHIP DETAILS\n"
        "Sr. No.  Landholder Name  Father / Guardian Name  Ownership Type  Share\n"
        "1\n"
        "Rajesh Kumar\n"
        "Mahesh Kumar\n"
        "Bhumidhar\n"
        "1/2\n"
        "2\n"
        "Sunita Devi\n"
        "Ramesh Singh\n"
        "Bhumidhar\n"
        "1/2\n\n"
        "PLOT / KHASRA DETAILS\n"
        "Sr. No.  Khasra No.  Khata No.  Owner Name  Area (Hectare)  Classification  Land Use\n"
        "1\n"
        "127/2\n"
        "184\n"
        "Rajesh Kumar\n"
        "0.8420\n"
        "Agricultural\n"
        "Cultivable\n"
        "2\n"
        "128/1\n"
        "184\n"
        "Rajesh Kumar\n"
        "0.3160\n"
        "Agricultural\n"
        "Cultivable\n"
        "3\n"
        "131/3\n"
        "184\n"
        "Sunita Devi\n"
        "0.1250\n"
        "Residential\n"
        "Abadi\n\n"
        "MUTATION / REGISTRATION DETAILS\n"
        "Mutation No.: 2024/184\n"
        "Mutation Date: 18-07-2024\n"
        "Registration No.: REG-2024-07182\n"
        "Registration Date: 12-06-2024\n"
    )

    ocr = OCRResult(
        totalPages=1,
        pages=[PageOCRResult(pageNumber=1, width=800, height=1000, tokens=[], pageText=sample_text)],
        fullText=sample_text,
    )

    fields = extraction_service.extract_fields(ocr)

    # 1. Primary owner and father/guardian name
    assert fields.owner_name.value == "Rajesh Kumar"
    assert fields.father_guardian_name is not None
    assert fields.father_guardian_name.value == "Mahesh Kumar"

    # 2. Zero-hallucination: Survey Number and Plot Number must NOT duplicate Khasra
    assert fields.survey_number.value is None
    assert fields.plot_number.value is None

    # 3. Structured Landholders (2 landholders)
    assert len(fields.landholders) == 2
    assert fields.landholders[0]["name"] == "Rajesh Kumar"
    assert fields.landholders[0]["fatherGuardianName"] == "Mahesh Kumar"
    assert fields.landholders[0]["share"] == "1/2"
    assert fields.landholders[1]["name"] == "Sunita Devi"
    assert fields.landholders[1]["fatherGuardianName"] == "Ramesh Singh"
    assert fields.landholders[1]["share"] == "1/2"

    # 4. Structured Land Parcels (3 parcels)
    assert len(fields.landParcels) == 3
    assert fields.landParcels[0]["khasraNumber"] == "127/2"
    assert fields.landParcels[0]["khataNumber"] == "184"
    assert fields.landParcels[0]["area"] == 0.842
    assert fields.landParcels[1]["khasraNumber"] == "128/1"
    assert fields.landParcels[2]["khasraNumber"] == "131/3"
    assert fields.landParcels[2]["classification"] == "Residential"

    # 5. Mutations & Registrations
    assert len(fields.mutations) == 1
    assert fields.mutations[0]["mutationNo"] == "2024/184"
    assert len(fields.registrations) == 1
    assert fields.registrations[0]["registrationNo"] == "REG-2024-07182"

