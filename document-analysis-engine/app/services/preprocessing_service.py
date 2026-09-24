import cv2
import numpy as np
from app.models.document import PageData
from app.utils.logger import logger


class PreprocessingService:
    """
    Intelligent image preprocessing for scanned land records.
    Adapts deskew, denoising, contrast enhancement, and binarization based on document characteristics.
    Preserves original image unchanged.
    """

    def preprocess_page(self, page_data: PageData) -> PageData:
        original = page_data.original_image
        h, w = original.shape[:2]

        # 1. Orientation & Deskew Detection
        deskewed, angle = self.detect_and_correct_deskew(original)
        page_data.orientation_angle = angle

        # 2. Convert to Grayscale
        if len(deskewed.shape) == 3:
            gray = cv2.cvtColor(deskewed, cv2.COLOR_BGR2GRAY)
        else:
            gray = deskewed.copy()

        # 3. Assess image characteristics
        mean_val = np.mean(gray)
        std_val = np.std(gray)
        page_data.is_poor_quality = bool(std_val < 35 or mean_val < 40 or mean_val > 245)

        # 4. Adaptive Contrast Enhancement & Denoising
        # Apply CLAHE if contrast is subdued or document is faded/yellowed
        if std_val < 55:
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)
        else:
            enhanced = gray

        # Denoise gently so fine Hindi Matras (shirorikha, nuktas, halant) are not eroded
        denoised = cv2.bilateralFilter(enhanced, d=5, sigmaColor=50, sigmaSpace=50)

        # 5. Selective Binarization / Adaptive Thresholding for OCR
        # For OCR engines like PaddleOCR, clean high-contrast grayscale performs better than harsh binary
        # We produce a normalized 3-channel BGR image that PaddleOCR accepts
        normalized_gray = cv2.normalize(denoised, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)
        ocr_ready = cv2.cvtColor(normalized_gray, cv2.COLOR_GRAY2BGR)

        # 6. Estimate text density
        edges = cv2.Canny(normalized_gray, 50, 150)
        page_data.text_density = float(np.sum(edges > 0) / (h * w))

        # Store processed image, keeping original untouched
        page_data.processed_image = ocr_ready
        return page_data

    def detect_and_correct_deskew(self, image: np.ndarray) -> tuple[np.ndarray, float]:
        """
        Detect skew angle using minAreaRect on thresholded text contours.
        Corrects skew if between -45 and 45 degrees.
        """
        try:
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()

            # Invert colors so text is foreground
            thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

            # Find all non-zero pixel coordinates
            coords = np.column_stack(np.where(thresh > 0))
            if len(coords) < 100:
                return image, 0.0

            angle = cv2.minAreaRect(coords)[-1]

            # Normalize angle to [-45, 45] range
            if angle < -45:
                angle = -(90 + angle)
            elif angle > 45:
                angle = 90 - angle

            # Only rotate if skew is non-trivial (> 0.5 degrees) and physically realistic
            if abs(angle) > 0.5 and abs(angle) < 45.0:
                h, w = image.shape[:2]
                center = (w // 2, h // 2)
                matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
                rotated = cv2.warpAffine(
                    image, matrix, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
                )
                return rotated, float(round(angle, 2))

            return image, 0.0
        except Exception as e:
            logger.warning(f"Deskew detection encountered exception: {e}. Continuing with original.")
            return image, 0.0


preprocessing_service = PreprocessingService()
