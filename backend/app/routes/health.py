import time
from fastapi import APIRouter
from app.services.predictor import predictor_service

router = APIRouter(tags=["health"])

START_TIME = time.time()

@router.get("/health")
def health_check():
    """
    Returns server status and ML model loaded indicators for checking system health.
    """
    uptime = time.time() - START_TIME
    
    return {
        "status": "healthy",
        "service": "GestureX Backend",
        "model_loaded": predictor_service.is_loaded,
        "uptime_seconds": round(uptime, 2),
        "classes": list(predictor_service.label_encoder.classes_) if predictor_service.is_loaded else []
    }
