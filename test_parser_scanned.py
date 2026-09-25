import re

def clean_khasra_ocr(val):
    val = val.strip()
    # Normalize common OCR misreads for slash: '|', '\', 'I', 'l', '1' between digits
    # e.g. 12712 -> 127/2, 12811 -> 128/1, 131|3 -> 131/3, 13212 -> 132/2
    m = re.match(r'^([1-9][0-9]{1,3})[/|\\Il1]([1-9][0-9]?)$', val)
    if m:
        return f"{m.group(1)}/{m.group(2)}"
    m2 = re.match(r'^([1-9][0-9]{1,3})/([1-9][0-9]?)$', val)
    if m2:
        return f"{m2.group(1)}/{m2.group(2)}"
    return val

print("Testing clean_khasra_ocr:")
for raw in ["12712", "12811", "131|3", "13212", "135/1", "136|4", "127/2"]:
    print(f"{raw} -> {clean_khasra_ocr(raw)}")
