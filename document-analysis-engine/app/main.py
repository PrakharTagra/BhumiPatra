import warnings
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.config.settings import settings
from app.api.routes import router
from app.utils.logger import logger

warnings.filterwarnings("ignore")

app = FastAPI(
    title="BhumiPatra Document Analysis Engine",
    description="Intelligent AI-Powered Document Preprocessing, PaddleOCR & Land Record Field Extraction",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS configuration - Allow internal microservice & Node backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(l) for l in err.get("loc", [])])
        errors.append(f"{loc}: {err.get('msg')}")
    logger.warning(f"Request validation error on {request.url.path}: {errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Validation error: " + ", ".join(errors),
            "errors": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal document analysis engine error.",
            "detail": str(exc) if settings.DEBUG else "Please check server logs.",
        },
    )


# Mount main API routes
app.include_router(router)


@app.on_event("startup")
async def startup_event():
    logger.info("==================================================================")
    logger.info(" BhumiPatra Document Analysis Engine Initialized")
    logger.info(f" Host: {settings.HOST}:{settings.PORT}")
    logger.info(f" OCR Engine: {settings.OCR_ENGINE} (Languages: {settings.OCR_LANGUAGES})")
    logger.info(f" High Confidence Threshold: {settings.HIGH_CONFIDENCE_THRESHOLD}")
    logger.info("==================================================================")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
