from dataclasses import dataclass, field
from typing import List, Optional
import numpy as np


@dataclass
class PageData:
    page_number: int
    original_image: np.ndarray
    processed_image: Optional[np.ndarray] = None
    width: int = 0
    height: int = 0
    orientation_angle: float = 0.0
    text_density: float = 0.0
    is_poor_quality: bool = False


@dataclass
class DocumentData:
    filename: str
    mime_type: str
    file_size: int
    pages: List[PageData] = field(default_factory=list)
    page_count: int = 0
