import logging
import sys
from app.config.settings import settings

logger = logging.getLogger("bhumipatra.engine")

if not logger.handlers:
    logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [Engine] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    logger.addHandler(handler)
