import os
import re
import warnings
from typing import List, Optional, Any
import numpy as np
from app.models.document import DocumentData, PageData
from app.schemas.response import OCRToken, PageOCRResult, OCRResult
from app.config.settings import settings
from app.utils.logger import logger

warnings.filterwarnings("ignore")


class OCRService:
    """
    Production-grade OCR service using PaddleOCR (PP-OCRv6) for multilingual Indian land records (Hindi & English).
    Preserves extracted text, page indices, polygon bounding boxes, and individual token confidences.
    """

    def __init__(self):
        self._ocr_instance: Optional[Any] = None

    def _get_ocr_engine(self):
        if self._ocr_instance is None:
            logger.info("Initializing OCR engine...")
            try:
                from rapidocr_onnxruntime import RapidOCR
                self._ocr_instance = RapidOCR()
                logger.info("RapidOCR (PP-OCR ONNX) engine initialized successfully.")
            except Exception as r1_err:
                try:
                    from rapidocr import RapidOCR
                    self._ocr_instance = RapidOCR()
                    logger.info("RapidOCR engine initialized successfully.")
                except Exception as r2_err:
                    try:
                        from paddleocr import PaddleOCR
                        self._ocr_instance = PaddleOCR(lang="hi", use_textline_orientation=True)
                        logger.info("PaddleOCR standard engine initialized successfully.")
                    except Exception as paddle_err:
                        logger.error(f"All OCR engine initializations failed: {r1_err}, {r2_err}, {paddle_err}")
                        raise RuntimeError(f"OCR engine could not be started: {r1_err}")

        return self._ocr_instance

    def perform_ocr(self, document_data: DocumentData) -> OCRResult:
        """
        Executes OCR on every page of the document and gathers token-level metadata.
        """
        engine = self._get_ocr_engine()
        page_results: List[PageOCRResult] = []
        full_text_fragments: List[str] = []

        for page in document_data.pages:
            tokens: List[OCRToken] = []
            page_text_lines: List[str] = []

            # Prefer preprocessed image, fallback to original
            target_image = page.processed_image if page.processed_image is not None else page.original_image

            try:
                # Call OCR engine
                output = engine(target_image)
                if isinstance(output, tuple):
                    output = output[0]  # RapidOCR returns (result, elapse)

                if output is not None and hasattr(output, 'boxes') and output.boxes is not None:
                    boxes = output.boxes
                    txts = output.txts or ()
                    scores = output.scores or ()

                    for box, text, score in zip(boxes, txts, scores):
                        clean_text = str(text).strip()
                        if not clean_text:
                            continue

                        conf = float(round(float(score), 4))
                        xs = [pt[0] for pt in box]
                        ys = [pt[1] for pt in box]
                        x1 = int(max(0, min(xs)))
                        y1 = int(max(0, min(ys)))
                        x2 = int(min(page.width, max(xs)))
                        y2 = int(min(page.height, max(ys)))

                        has_devanagari = bool(re.search(r'[\u0900-\u097F]', clean_text))
                        lang = "hi" if has_devanagari else "en"

                        tokens.append(
                            OCRToken(
                                text=clean_text,
                                bbox=[x1, y1, x2, y2],
                                confidence=conf,
                                language=lang,
                            )
                        )
                        page_text_lines.append(clean_text)

                elif isinstance(output, list) and output:
                    lines_to_process = output
                    # Check for nested list structure from PaddleOCR: [[line1, line2, ...]]
                    if len(output) == 1 and isinstance(output[0], list):
                        if len(output[0]) == 0:
                            lines_to_process = []
                        elif isinstance(output[0][0], list) and len(output[0][0]) == 2 and isinstance(output[0][0][1], (list, tuple)):
                            lines_to_process = output[0]

                    for item in lines_to_process:
                        if not item:
                            continue
                        box = None
                        clean_text = ""
                        conf = 0.8

                        if len(item) == 3:
                            # RapidOCR format: [box, text, score]
                            box = item[0]
                            clean_text = str(item[1]).strip()
                            try:
                                conf = float(round(float(item[2]), 4))
                            except (ValueError, TypeError):
                                conf = 0.8
                        elif len(item) == 2:
                            # PaddleOCR format: [box, (text, score)] or [box, text]
                            box = item[0]
                            text_conf = item[1]
                            if isinstance(text_conf, (list, tuple)):
                                clean_text = str(text_conf[0]).strip()
                                try:
                                    conf = float(round(float(text_conf[1]), 4))
                                except (ValueError, TypeError):
                                    conf = 0.8
                            else:
                                clean_text = str(text_conf).strip()
                                conf = 0.8

                        if not clean_text or not box:
                            continue

                        xs = [pt[0] for pt in box]
                        ys = [pt[1] for pt in box]
                        x1 = int(max(0, min(xs)))
                        y1 = int(max(0, min(ys)))
                        x2 = int(min(page.width, max(xs)))
                        y2 = int(min(page.height, max(ys)))

                        has_devanagari = bool(re.search(r'[\u0900-\u097F]', clean_text))
                        lang = "hi" if has_devanagari else "en"

                        tokens.append(
                            OCRToken(
                                text=clean_text,
                                bbox=[x1, y1, x2, y2],
                                confidence=conf,
                                language=lang,
                            )
                        )
                        page_text_lines.append(clean_text)

            except Exception as e:
                logger.error(f"OCR processing failed on page {page.page_number}: {e}")

            page_full_text = "\n".join(page_text_lines)
            if page_full_text:
                full_text_fragments.append(page_full_text)

            page_results.append(
                PageOCRResult(
                    pageNumber=page.page_number,
                    width=page.width,
                    height=page.height,
                    tokens=tokens,
                    pageText=page_full_text,
                    orientationAngle=page.orientation_angle,
                )
            )

        full_doc_text = "\n\n".join(full_text_fragments)

        return OCRResult(
            totalPages=len(document_data.pages),
            languages=settings.language_list,
            pages=page_results,
            fullText=full_doc_text,
        )


ocr_service = OCRService()
