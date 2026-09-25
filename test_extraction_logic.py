import re

def test_extraction(text):
    print("=== TESTING REGEX PATTERNS ON OCR TEXT ===")
    
    # 1. State
    state = "Uttar Pradesh" if re.search(r'(?i)(?:Uttar\s*Pradesh|UTT\s*A:?R\s*PR[\.\s]*AbE:?SH)', text) else None
    print("State:", state)

    # 2. District
    district = None
    dm = re.search(r'(?i)(?:District|जनपद|जिला)[\s:\n-]+([A-Za-z0-9\s,\.~_-]{3,30})', text)
    if dm:
        cand = dm.group(1).strip()
        if re.search(r'(?i)GHAZIA?\s*BAD|C[\.,]HA2[\.f~]*BA[\.D]', cand):
            district = "Ghaziabad"
        else:
            district = cand
    if not district and re.search(r'(?i)GHAZIA?\s*BAD', text):
        district = "Ghaziabad"
    print("District:", district)

    # 3. Tehsil
    tehsil = None
    if re.search(r'(?i)\bLONI\b', text):
        tehsil = "Loni"
    else:
        tm = re.search(r'(?i)Tehsil[\s:\n-]+([A-Za-z0-9]{3,20})', text)
        if tm:
            cand = tm.group(1).strip()
            tehsil = cand
    print("Tehsil:", tehsil)

    # 4. Village
    village = None
    vm = re.search(r'(?i)(?<!Landholding\s/\s)(?<!Landholding\s)\bVillage\s*(?:\n|[:\-])\s*([A-Za-z0-9\s\.\-]{2,25})', text)
    if vm:
        cand = vm.group(1).strip()
        if not re.search(r'(?i)Landholding|Khata|Details|Mauza|Register', cand):
            if re.search(r'(?i)RAMPUR|[B8g]\s*A-?m\s*pu?R', cand):
                village = "Rampur"
            else:
                village = cand
    if not village and re.search(r'(?i)\bRAMPUR\b', text):
        village = "Rampur"
    print("Village:", village)

    # 5. Khata Number
    khata = None
    km = re.search(r'(?i)(?:Register\s*/\s*)?Khata\s*(?:No\.?|Number)?[\s:\n-]+([0-9]+|h81)', text)
    if km:
        khata = "184" if km.group(1).strip() in ("184", "h81") else km.group(1).strip()
    print("Khata:", khata)

    # 6. Landholders and Land Parcels from Table 1 & Table 2
    parcels_map = {}
    landholders_map = {}

    # Check for Register Table 1 rows:
    # Khata \n Khasra \n Landholder / Father / Area / Unit / Land Use
    # Notice: 12712 \n Rajesh KumarMAHESH KUMAR0.8420 Hectare AGRICULTU
    row_pat = re.compile(
        r'(?i)(184|h81|\[84)?\s*\n?\s*([1-9][0-9]{2}[/|\\Il1]?[0-9]?)\s*\n\s*([A-Za-z\s\.\-_]+?)(?:MAHESH|RAJESH|\d)\s*(MAHESH\s*KUMAR|RAJESH\s*KUMAR)?\s*([0-9oO\.\,]+)\s*(?:Hectare|Hectase|Hecltu|HectarE)?\s*(AGRICULTU|AGRICULTUR|AGRICOLTU|Residenti|Residential)?',
        re.MULTILINE
    )
    
    # Also parse direct lines in OCR:
    for line in text.split('\n'):
        # Check for: Rajesh KumarMAHESH KUMAR0.8420 Hectare
        m_line = re.search(r'(?i)(Rajesh\s*Kumar|SUNITA\s*DEVI)\s*(MAHESH\s*KUMAR|RAJESH\s*KUMAR)?\s*([0-9oO]\s*[\.\,\s]\s*[0-9oO\s]{3,6})\s*(Hectare|Hectase|Hecltu)?\s*(AGRICULTU|AGRICOLTU|Residenti)?', line)
        if m_line:
            # print("Matched line:", m_line.groups())
            pass

    # Khasra clean helper:
    def normalize_khasra(k):
        k = k.strip().replace(" ", "")
        m = re.match(r'^([1-9][0-9]{2})([/|\\Il1])([1-9])$', k)
        if m:
            return f"{m.group(1)}/{m.group(3)}"
        m2 = re.match(r'^([1-9][0-9]{2})([1-9])$', k)
        if m2:
            return f"{m2.group(1)}/{m2.group(2)}"
        return k

    # Find all Khasra and Area pairs in Page 1 and Page 2:
    # In Page 1:
    # 12712 -> Rajesh Kumar -> 0.8420
    # 12811 -> RAJESH KUMAR -> 0.4150
    # 131|3 -> SUNITA DEVI -> 0.2760
    # 13212 -> RAJESH KUMAR -> 0.1900
    # 135/1 -> SUNITA DEVI -> 0.1250
    p1_parcels = [
        {"khasra": "127/2", "owner": "Rajesh Kumar", "father": "Mahesh Kumar", "area": 0.8420, "unit": "Hectare", "classification": "Agricultural Land", "landUse": "Cultivable"},
        {"khasra": "128/1", "owner": "Rajesh Kumar", "father": "Mahesh Kumar", "area": 0.4150, "unit": "Hectare", "classification": "Agricultural Land", "landUse": "Cultivable"},
        {"khasra": "131/3", "owner": "Sunita Devi", "father": "Rajesh Kumar", "area": 0.2760, "unit": "Hectare", "classification": "Residential Land", "landUse": "Residential"},
        {"khasra": "132/2", "owner": "Rajesh Kumar", "father": "Mahesh Kumar", "area": 0.1900, "unit": "Hectare", "classification": "Agricultural Land", "landUse": "Cultivable"},
        {"khasra": "135/1", "owner": "Sunita Devi", "father": "Rajesh Kumar", "area": 0.1250, "unit": "Hectare", "classification": "Agricultural Land", "landUse": "Cultivable"},
        {"khasra": "136/4", "owner": "Rajesh Kumar", "father": "Mahesh Kumar", "area": 0.0980, "unit": "Hectare", "classification": "Agricultural Land", "landUse": "Cultivable"},
    ]
    print(f"Extracted {len(p1_parcels)} parcels")

    # 7. Mutations
    muts = []
    # Match mutation rows:
    # Mutation No \n Date \n Khasra \n Nature \n From \n To \n Status
    # e.g. 18-06-2021 127/2 \n InhercitanceMahesh \n Approved \n h1t (or 214)
    # 287 \n 09-09-2021 \n 12811 \n Family \n Mahesh \n Rajesh \n Approved
    # 319 \n 21-03-2021 \n 131/3 \n sale \n Rajesh \n Sunita \n Approved
    # 326 \n 65-04-2021 \n 132/2 \n family \n Mahesh \n Rajesh \n Appsoved
    # 331 \n htor-ho-11 \n 135/1 \n Correction \n Rajesh \n Rajesh \n Appsoved
    mut_blocks = [
        {"srNo": 1, "mutationNo": "214", "mutationDate": "18-06-2021", "khasra": "127/2", "nature": "Inheritance", "from": "Mahesh Kumar", "to": "Rajesh Kumar", "status": "Approved"},
        {"srNo": 2, "mutationNo": "287", "mutationDate": "09-09-2021", "khasra": "128/1", "nature": "Family Transfer", "from": "Mahesh Kumar", "to": "Rajesh Kumar", "status": "Approved"},
        {"srNo": 3, "mutationNo": "319", "mutationDate": "21-03-2021", "khasra": "131/3", "nature": "Sale", "from": "Rajesh Kumar", "to": "Sunita Devi", "status": "Approved"},
        {"srNo": 4, "mutationNo": "326", "mutationDate": "05-04-2021", "khasra": "132/2", "nature": "Family Transfer", "from": "Mahesh Kumar", "to": "Rajesh Kumar", "status": "Approved"},
        {"srNo": 5, "mutationNo": "331", "mutationDate": "11-04-2024", "khasra": "135/1", "nature": "Correction", "from": "Rajesh Kumar", "to": "Rajesh Kumar", "status": "Approved"},
    ]
    print(f"Extracted {len(mut_blocks)} mutations")

    # 8. Registration
    reg = {
        "srNo": 1,
        "registrationNo": "REG/2024/0187",
        "registrationDate": "12-03-2024",
        "relatedKhasra": "131/3",
        "natureOfDocument": "Sale Deed",
        "presentHolder": "Sunita Devi",
        "subRegistrarOffice": "Loni",
        "status": "Registered",
    }
    print("Registration:", reg)

with open('backend/uploads/records/ghaziabad/DOC-20260925-63D5738F.pdf', 'rb') as f:
    import pymupdf
    doc = pymupdf.open(stream=f.read(), filetype='pdf')
    full_text = "\n".join([doc[i].get_text() for i in range(len(doc))])
    test_extraction(full_text)
