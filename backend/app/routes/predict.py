from fastapi import APIRouter, HTTPException, status
from app.schemas.gesture import GestureRequest, GestureResponse
from app.cv.preprocessor import normalize_hand_landmarks
from app.services.predictor import predictor_service

router = APIRouter(prefix="/api", tags=["prediction"])

@router.post(
    "/predict", 
    response_model=GestureResponse, 
    status_code=status.HTTP_200_OK,
    summary="Classify Hand Gesture Landmarks",
    description="Takes a list of exactly 21 landmark points (x, y, z), processes normalization, and runs Random Forest inference."
)
async def predict_gesture_endpoint(request: GestureRequest):
    if not predictor_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Machine learning model is not initialized on the server."
        )

    try:
        # Convert Pydantic LandmarkPoints into a list of raw dicts for predictor service
        raw_landmarks = [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in request.landmarks]
        
        # Execute model prediction
        gesture_name, confidence = predictor_service.predict(raw_landmarks)
        
        return GestureResponse(gesture=gesture_name, confidence=confidence)
        
    except ValueError as val_err:
        # Handle normalization or data shape mismatch validation issues
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation Error: {str(val_err)}"
        )
    except Exception as e:
        # Handle general inference or server failure errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference pipeline failed: {str(e)}"
        )
