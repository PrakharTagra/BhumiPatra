import re

# Test parsing the 3 pages OCR text
with open('backend/uploads/records/ghaziabad/DOC-20260925-63D5738F.pdf', 'rb') as f:
    import pymupdf
    doc = pymupdf.open(stream=f.read(), filetype='pdf')

pages_text = [doc[i].get_text() for i in range(len(doc))]
print("Page 1 embedded text:")
print(pages_text[0][:400])
