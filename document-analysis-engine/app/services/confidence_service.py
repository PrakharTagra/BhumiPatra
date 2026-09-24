from typing import Dict, List, Tuple
from app.schemas.response import ExtractedFields, ConfidenceSummary
from app.config.settings import settings


class ConfidenceService:
    """
    Evaluates field-level and document-level confidence metrics derived strictly
    from OCR character confidence and extraction structural match certainty.
    """

    CRITICAL_FIELD_WEIGHTS = {
        "owner_name": 0.25,
        "khasra_number": 0.25,
        "area": 0.20,
        "district": 0.15,
        "village": 0.15,
    }

    def compute_confidences(self, fields: ExtractedFields) -> ConfidenceSummary:
        field_dict = fields.model_dump()
        confidences: Dict[str, float] = {}
        reasons: List[str] = []
        requires_verification = False

        high_thresh = settings.HIGH_CONFIDENCE_THRESHOLD
        review_thresh = settings.REVIEW_THRESHOLD

        # Gather each individual field confidence
        for name, data in field_dict.items():
            conf = float(data.get("confidence", 0.0))
            val = data.get("value")

            confidences[name] = round(conf * 100, 1)

            # Check critical fields
            if name in self.CRITICAL_FIELD_WEIGHTS:
                if val is None or conf == 0:
                    requires_verification = True
                    reasons.append(f"Missing critical field '{name.replace('_', ' ').title()}'")
                elif conf < high_thresh:
                    requires_verification = True
                    reasons.append(
                        f"Low confidence ({int(conf*100)}%) on '{name.replace('_', ' ').title()}'"
                    )

        # Weighted aggregate confidence calculation
        weighted_sum = 0.0
        total_weight = sum(self.CRITICAL_FIELD_WEIGHTS.values())

        for fld, weight in self.CRITICAL_FIELD_WEIGHTS.items():
            f_conf = fields.__getattribute__(fld).confidence
            weighted_sum += f_conf * weight

        overall_percentage = round((weighted_sum / total_weight) * 100, 1)

        if overall_percentage < (high_thresh * 100):
            requires_verification = True
            if not reasons:
                reasons.append(f"Overall composite confidence ({overall_percentage}%) is below {int(high_thresh*100)}% threshold")

        return ConfidenceSummary(
            overallConfidence=overall_percentage,
            fieldConfidences=confidences,
            requiresHumanVerification=requires_verification,
            reasons=reasons,
        )


confidence_service = ConfidenceService()
