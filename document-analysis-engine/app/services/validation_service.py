import re
from typing import List, Dict, Optional
from datetime import datetime
from app.schemas.response import (
    ExtractedFields,
    ValidationResult,
    ValidationIssue,
)
from app.schemas.request import DocumentMetadataInput
from app.utils.logger import logger


class ValidationService:
    """
    Deterministic rule-based validation engine for Indian land records.
    Verifies required fields, regex format specifications, cross-jurisdiction coherence,
    and flags discrepancies for Verification Officers.
    """

    REQUIRED_FIELDS = ["owner_name", "khasra_number", "district", "state"]

    def validate_document(
        self, fields: ExtractedFields, metadata: Optional[DocumentMetadataInput] = None
    ) -> ValidationResult:
        issues: List[ValidationIssue] = []
        checks: Dict[str, bool] = {}

        # 1. Required Fields Check
        required_pass = True
        for req in self.REQUIRED_FIELDS:
            field_obj = getattr(fields, req, None)
            if not field_obj or field_obj.value is None or str(field_obj.value).strip() == "":
                required_pass = False
                issues.append(
                    ValidationIssue(
                        field=req,
                        type="REQUIRED_FIELD_MISSING",
                        message=f"Mandatory land attribute '{req.replace('_', ' ').title()}' could not be identified.",
                        severity="ERROR",
                    )
                )
        checks["required_fields_present"] = required_pass

        # 2. Format Validation - Area
        area_obj = fields.area
        area_format_pass = True
        if area_obj and area_obj.value is not None:
            try:
                area_num = float(str(area_obj.value).strip())
                if area_num <= 0:
                    area_format_pass = False
                    issues.append(
                        ValidationIssue(
                            field="area",
                            type="INVALID_NUMERIC_RANGE",
                            message="Land parcel area must be greater than zero.",
                            severity="ERROR",
                        )
                    )
                elif area_num > 10000.0:
                    issues.append(
                        ValidationIssue(
                            field="area",
                            type="ANOMALOUS_PARCEL_SIZE",
                            message=f"Parcel area ({area_num} {area_obj.unit or 'units'}) appears exceptionally large. Verify physical boundaries.",
                            severity="WARNING",
                        )
                    )
            except ValueError:
                area_format_pass = False
                issues.append(
                    ValidationIssue(
                        field="area",
                        type="INVALID_FORMAT",
                        message=f"Area value '{area_obj.value}' could not be parsed as a decimal number.",
                        severity="ERROR",
                    )
                )
        checks["area_format_valid"] = area_format_pass

        # 3. Format Validation - Khasra Number
        khasra_obj = fields.khasra_number
        khasra_pass = True
        if khasra_obj and khasra_obj.value:
            # Valid Khasra should be alphanumeric, optionally containing slashes e.g. 124, 124/1, 45/2ka
            khasra_str = str(khasra_obj.value).strip()
            if not re.match(r'^[0-9]+(/[0-9]+)?[\w\u0900-\u097F]*$', khasra_str):
                khasra_pass = False
                issues.append(
                    ValidationIssue(
                        field="khasra_number",
                        type="NON_STANDARD_FORMAT",
                        message=f"Khasra identifier '{khasra_str}' diverges from standard cadastral pattern.",
                        severity="WARNING",
                    )
                )
        checks["khasra_format_valid"] = khasra_pass

        # 4. Format Validation - Dates
        date_fields = [("mutation_date", fields.mutation_date), ("registration_date", fields.registration_date)]
        date_format_pass = True
        for d_name, d_obj in date_fields:
            if d_obj and d_obj.value:
                d_str = str(d_obj.value).strip()
                valid_date = False
                for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d.%m.%Y"):
                    try:
                        parsed = datetime.strptime(d_str, fmt)
                        if 1800 <= parsed.year <= datetime.now().year:
                            valid_date = True
                            break
                    except ValueError:
                        continue
                if not valid_date:
                    date_format_pass = False
                    issues.append(
                        ValidationIssue(
                            field=d_name,
                            type="INVALID_DATE_FORMAT",
                            message=f"Date '{d_str}' is invalid or out of chronological range.",
                            severity="WARNING",
                        )
                    )
        checks["dates_valid"] = date_format_pass

        # 5. Cross-Field Consistency Check (Extracted vs Metadata)
        cross_field_pass = True
        if metadata:
            comparisons = [
                ("district", fields.district.value, metadata.district),
                ("tehsil", fields.tehsil.value, metadata.tehsil),
                ("village", fields.village.value, metadata.village),
                ("state", fields.state.value, metadata.state),
            ]
            for field_name, extracted_val, meta_val in comparisons:
                if extracted_val and meta_val:
                    e_clean = str(extracted_val).strip().lower()
                    m_clean = str(meta_val).strip().lower()
                    if e_clean not in m_clean and m_clean not in e_clean:
                        cross_field_pass = False
                        issues.append(
                            ValidationIssue(
                                field=field_name,
                                type="CROSS_FIELD_MISMATCH",
                                message=f"Extracted {field_name} '{extracted_val}' does not match submission metadata '{meta_val}'.",
                                severity="WARNING",
                            )
                        )
        checks["metadata_consistency"] = cross_field_pass

        # 6. Low Confidence Field Flags
        for name in ("owner_name", "khasra_number", "area"):
            fld = getattr(fields, name, None)
            if fld and fld.value and fld.confidence < 0.80:
                issues.append(
                    ValidationIssue(
                        field=name,
                        type="LOW_CONFIDENCE",
                        message=f"{name.replace('_', ' ').title()} extracted with borderline confidence ({int(fld.confidence*100)}%). Manual verification required.",
                        severity="WARNING",
                    )
                )

        # 7. Compute Overall Status & Score
        has_errors = any(i.severity == "ERROR" for i in issues)
        has_warnings = any(i.severity == "WARNING" for i in issues)

        if has_errors:
            status = "FAILED" if not required_pass else "WARNING"
            score = max(30.0, 100.0 - (len([i for i in issues if i.severity == 'ERROR']) * 25.0) - (len([i for i in issues if i.severity == 'WARNING']) * 10.0))
        elif has_warnings:
            status = "WARNING"
            score = max(60.0, 100.0 - (len(issues) * 8.0))
        else:
            status = "PASSED"
            score = 100.0

        return ValidationResult(
            status=status,
            score=round(score, 1),
            issues=issues,
            checks=checks,
        )


validation_service = ValidationService()
