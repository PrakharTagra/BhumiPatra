# BhumiPatra — Document Analysis Engine
### AI-Powered Document Preprocessing, PaddleOCR & Cadastral Land Record Extraction Engine

The **Document Analysis Engine** is an independent, microservice for **BhumiPatra**. It performs document ingestion, multi-page rendering, computer vision preprocessing, multi-lingual OCR (Hindi & English), deterministic land record extraction, confidence scoring, and rule-based validation.

---

## 🏛️ Architecture & Pipeline Flow

```text
Incoming Document (PDF / Scan / Image)
            │
            ▼
    [ PDF / Image Service ]
    • Multi-page extraction via PyMuPDF (200 DPI)
    • Ingestion of PDF, JPG, JPEG, PNG, TIFF
            │
            ▼
    [ Preprocessing Service ]
    • Orientation detection & Deskew (OpenCV)
    • Contrast Enhancement (CLAHE) & Denoising
    • Adaptive binarization while preserving original image
            │
            ▼
    [ OCR Service (PaddleOCR) ]
    • Multilingual text extraction (Devanagari Hindi + English Latin)
    • Token-level bounding box coordinates [x1, y1, x2, y2]
    • Word & line confidence calculation
            │
            ▼
    [ Extraction Service ]
    • Deterministic pattern & regex matching (Khasra, Khata, Area, Dates)
    • Keyword & contextual entity parsing (Owner, Village, Tehsil, District, Classification)
    • Strict Zero-Hallucination: returns value=None, confidence=0 if not found in OCR
            │
            ▼
    [ Confidence & Validation Services ]
    • Field-level & weighted composite confidence (0-100%)
    • Required fields, format standards, cross-jurisdiction checks
    • Generates evidence-backed issues for human verification
            │
            ▼
      Structured JSON
(To BhumiPatra Node.js Backend API)
```

---

## 🚀 Quick Start

### 1. Requirements
- Python 3.11+ (Python 3.13 supported)
- pip

### 2. Installation
```bash
cd document-analysis-engine
pip install -r requirements.txt
cp .env.example .env
```

### 3. Start Engine Server (Port 8000)
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation available at `http://localhost:8000/docs`.

---

## 📡 API Endpoints

### 1. Health Check
`GET /health`
```json
{
  "status": "healthy",
  "service": "BhumiPatra Document Analysis Engine",
  "version": "1.0.0",
  "ocrEngine": "PaddleOCR",
  "languages": ["hi", "en"]
}
```

### 2. Version & Capabilities
`GET /api/version`

### 3. Analyze Document
`POST /analyze` (Multipart Form Data)
- **Form Fields**:
  - `file`: Scanned document file (PDF, JPG, PNG, TIFF)
  - `documentId`: System Document identifier (optional)
  - `documentType`: e.g. `KHATAUNI`, `KHASRA`, `JAMABANDI` (optional)
  - `state`: e.g. `Uttar Pradesh` (optional)
  - `district`: e.g. `Lucknow` (optional)
  - `tehsil`: e.g. `Bakshi Ka Talab` (optional)
  - `village`: e.g. `Kamalpur` (optional)
  - `recordYear`: e.g. `2023` (optional)

#### Response Contract:
```json
{
  "success": true,
  "document": {
    "pageCount": 1,
    "languages": ["hi", "en"],
    "mimeType": "application/pdf",
    "originalFilename": "Khatauni_Kamalpur.pdf",
    "fileSizeBytes": 1048576
  },
  "ocr": {
    "totalPages": 1,
    "languages": ["hi", "en"],
    "pages": [
      {
        "pageNumber": 1,
        "width": 1654,
        "height": 2339,
        "tokens": [
          {
            "text": "खसरा संख्या 142/2",
            "bbox": [100, 120, 450, 160],
            "confidence": 0.96,
            "language": "hi"
          }
        ],
        "pageText": "खसरा संख्या 142/2 ..."
      }
    ],
    "fullText": "..."
  },
  "extractedFields": {
    "owner_name": {
      "value": "Rameshwar Dayal Sharma",
      "confidence": 0.95,
      "requiresVerification": false,
      "bbox": [100, 200, 500, 240],
      "page": 1,
      "evidence": "खातेदार का नाम: रमेशवर दयाल शर्मा"
    },
    "khasra_number": {
      "value": "142/2",
      "confidence": 0.98,
      "requiresVerification": false,
      "bbox": [100, 120, 450, 160],
      "page": 1,
      "evidence": "खसरा संख्या 142/2"
    },
    "area": {
      "value": "1.450",
      "unit": "Hectare",
      "confidence": 0.96,
      "requiresVerification": false
    }
  },
  "validation": {
    "status": "PASSED",
    "score": 100.0,
    "issues": [],
    "checks": {
      "required_fields_present": true,
      "area_format_valid": true,
      "khasra_format_valid": true
    }
  },
  "confidence": {
    "overallConfidence": 95.8,
    "fieldConfidences": {
      "owner_name": 95.0,
      "khasra_number": 98.0,
      "area": 96.0
    },
    "requiresHumanVerification": false,
    "reasons": []
  },
  "processing": {
    "status": "COMPLETED",
    "pagesProcessed": 1,
    "processingTimeMs": 1420,
    "ocrEngine": "PaddleOCR",
    "timestamp": "2026-09-24T17:10:00Z"
  }
}
```

---

## 🧪 Automated Testing

Execute the test suite:
```bash
pytest tests/ -v
```
