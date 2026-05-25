from pydantic import BaseModel, Field, conlist
from typing import List

class LandmarkPoint(BaseModel):
    x: float = Field(..., description="Normalized X coordinate [0.0, 1.0]", example=0.521)
    y: float = Field(..., description="Normalized Y coordinate [0.0, 1.0]", example=0.342)
    z: float = Field(..., description="Normalized depth Z relative to wrist", example=-0.045)

class GestureRequest(BaseModel):
    # conlist ensures that the array size is validated to be exactly 21 elements
    landmarks: List[LandmarkPoint] = Field(
        ..., 
        min_length=21, 
        max_length=21, 
        description="List of exactly 21 MediaPipe hand landmarks"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "landmarks": [
                    {"x": 0.0, "y": 0.0, "z": 0.0},  # Wrist
                    {"x": 0.08, "y": -0.08, "z": -0.02}, # Thumb joints...
                    {"x": 0.14, "y": -0.12, "z": -0.04},
                    {"x": 0.18, "y": -0.16, "z": -0.06},
                    {"x": 0.21, "y": -0.19, "z": -0.07},
                    {"x": 0.08, "y": -0.22, "z": -0.02}, # Index joints...
                    {"x": 0.09, "y": -0.32, "z": -0.04},
                    {"x": 0.095, "y": -0.40, "z": -0.05},
                    {"x": 0.10, "y": -0.46, "z": -0.06},
                    {"x": 0.02, "y": -0.23, "z": -0.02}, # Middle joints...
                    {"x": 0.02, "y": -0.34, "z": -0.04},
                    {"x": 0.02, "y": -0.43, "z": -0.05},
                    {"x": 0.02, "y": -0.50, "z": -0.06},
                    {"x": -0.04, "y": -0.22, "z": -0.02}, # Ring joints...
                    {"x": -0.05, "y": -0.32, "z": -0.04},
                    {"x": -0.055, "y": -0.40, "z": -0.05},
                    {"x": -0.06, "y": -0.46, "z": -0.06},
                    {"x": -0.09, "y": -0.20, "z": -0.02}, # Pinky joints...
                    {"x": -0.11, "y": -0.28, "z": -0.04},
                    {"x": -0.12, "y": -0.34, "z": -0.05},
                    {"x": -0.13, "y": -0.40, "z": -0.06}
                ]
            }
        }

class GestureResponse(BaseModel):
    gesture: str = Field(..., description="Predicted gesture label (e.g. Thumbs Up, Peace, Fist)", example="Thumbs Up")
    confidence: float = Field(..., description="Inference probability score [0.0, 1.0]", example=0.985)
