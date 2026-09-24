import cv2
import numpy as np
from app.models.document import PageData
from app.services.preprocessing_service import preprocessing_service


def test_preprocessing_preserves_original():
    # Create synthetic test image
    img = np.ones((500, 500, 3), dtype=np.uint8) * 200
    cv2.putText(img, "Khatauni Land Record", (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
    original_copy = img.copy()

    page = PageData(page_number=1, original_image=img, width=500, height=500)
    processed_page = preprocessing_service.preprocess_page(page)

    # Verify original image was preserved unchanged
    np.testing.assert_array_equal(processed_page.original_image, original_copy)
    # Verify processed image was generated and ready for OCR
    assert processed_page.processed_image is not None
    assert processed_page.processed_image.shape == (500, 500, 3)
    assert isinstance(processed_page.orientation_angle, float)


def test_deskew_straight_image():
    img = np.ones((300, 300, 3), dtype=np.uint8) * 255
    cv2.putText(img, "Horizontal Straight Text", (20, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)

    deskewed, angle = preprocessing_service.detect_and_correct_deskew(img)
    assert abs(angle) < 5.0
    assert deskewed.shape == img.shape
