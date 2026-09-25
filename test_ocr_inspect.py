import sys
sys.path.insert(0, 'document-analysis-engine')
from app.services import pdf_service, preprocessing_service, ocr_service
import re

with open('backend/uploads/records/ghaziabad/DOC-20260925-63D5738F.pdf', 'rb') as f:
    pdf_bytes = f.read()

doc_data = pdf_service.load_document(pdf_bytes, 'DOC-20260925-63D5738F.pdf', 'application/pdf')
for p in doc_data.pages:
    preprocessing_service.preprocess_page(p)

ocr_res = ocr_service.perform_ocr(doc_data)
full_text = ocr_res.fullText

print("Length of full_text:", len(full_text))

# Let's inspect Page 1, Page 2, Page 3 texts
p1 = ocr_res.pages[0].pageText
p2 = ocr_res.pages[1].pageText
p3 = ocr_res.pages[2].pageText

print("\n--- PAGE 1 OCR ---")
print(p1[:300])

print("\n--- PAGE 2 OCR ---")
print(p2[:300])

print("\n--- PAGE 3 OCR ---")
print(p3[:300])
