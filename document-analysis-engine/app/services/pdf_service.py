import io
import os
import pymupdf
import numpy as np
from PIL import Image
import cv2
from fastapi import HTTPException
from app.models.document import DocumentData, PageData
from app.utils.logger import logger


class PDFService:
    """
    Handles multi-page PDF rendering and image ingestion safely.
    Converts incoming PDF and image documents into standardized PageData structures.
    """

    def load_document(self, file_bytes: bytes, filename: str, mime_type: str) -> DocumentData:
        ext = os.path.splitext(filename)[1].lower()
        doc_data = DocumentData(
            filename=filename,
            mime_type=mime_type,
            file_size=len(file_bytes),
        )

        try:
            if ext == ".pdf" or mime_type == "application/pdf":
                doc_data.pages = self._extract_pages_from_pdf(file_bytes)
            else:
                doc_data.pages = [self._extract_page_from_image(file_bytes)]

            doc_data.page_count = len(doc_data.pages)
            if doc_data.page_count == 0:
                raise HTTPException(status_code=400, detail="Document has no readable pages.")

            logger.info(f"Loaded '{filename}' ({mime_type}) - {doc_data.page_count} page(s) ready for processing.")
            return doc_data

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to ingest document '{filename}': {str(e)}")
            raise HTTPException(status_code=400, detail=f"Corrupt or unreadable document: {str(e)}")

    def _extract_pages_from_pdf(self, pdf_bytes: bytes) -> list[PageData]:
        pages = []
        try:
            pdf_doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
            if pdf_doc.is_encrypted:
                raise HTTPException(status_code=400, detail="Encrypted/password-protected PDFs are not supported.")

            total_pages = len(pdf_doc)
            if total_pages == 0:
                raise HTTPException(status_code=400, detail="The uploaded PDF document contains 0 pages.")

            # Render at 200 DPI for high-accuracy OCR without excessive memory usage
            zoom = 200 / 72.0
            matrix = pymupdf.Matrix(zoom, zoom)

            for page_idx in range(total_pages):
                page = pdf_doc[page_idx]
                pix = page.get_pixmap(matrix=matrix, alpha=False)

                # Convert to numpy RGB array
                img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, pix.n))
                
                # Convert RGB to BGR for OpenCV compatibility
                if pix.n == 3:
                    bgr_img = cv2.cvtColor(img_data, cv2.COLOR_RGB2BGR)
                elif pix.n == 1:
                    bgr_img = cv2.cvtColor(img_data, cv2.COLOR_GRAY2BGR)
                else:
                    bgr_img = img_data

                pages.append(
                    PageData(
                        page_number=page_idx + 1,
                        original_image=bgr_img,
                        width=pix.width,
                        height=pix.height,
                    )
                )

            pdf_doc.close()
            return pages

        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=400, detail=f"Error parsing PDF document: {str(e)}")

    def _extract_page_from_image(self, img_bytes: bytes) -> PageData:
        try:
            pil_img = Image.open(io.BytesIO(img_bytes))
            # Convert palette/RGBA/grayscale to RGB
            if pil_img.mode != "RGB":
                pil_img = pil_img.convert("RGB")

            rgb_np = np.array(pil_img)
            bgr_img = cv2.cvtColor(rgb_np, cv2.COLOR_RGB2BGR)

            h, w = bgr_img.shape[:2]
            return PageData(
                page_number=1,
                original_image=bgr_img,
                width=w,
                height=h,
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error parsing image file: {str(e)}")


pdf_service = PDFService()
