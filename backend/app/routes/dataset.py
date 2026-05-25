import os
import csv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict
from app.cv.preprocessor import normalize_hand_landmarks

router = APIRouter(prefix="/api/dataset", tags=["dataset"])

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data'))
CSV_PATH = os.path.join(DATA_DIR, 'gestures_dataset.csv')

class LandmarkPoint(BaseModel):
    x: float
    y: float
    z: float

class DatasetSample(BaseModel):
    gesture_name: str = Field(..., description="Name of the gesture (e.g. Thumbs Up, Peace)")
    landmarks: List[LandmarkPoint] = Field(..., description="Array of 21 hand landmarks")

def initialize_csv():
    """Ensures data directory and CSV dataset are created with correct header structure."""
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(CSV_PATH):
        with open(CSV_PATH, mode='w', newline='') as f:
            writer = csv.writer(f)
            # Create header: gesture_name, x0, y0, z0, ..., z20
            header = ['gesture_name']
            for i in range(21):
                header.extend([f'x{i}', f'y{i}', f'z{i}'])
            writer.writerow(header)

@router.post("/sample")
def save_sample_endpoint(sample: DatasetSample):
    """
    Normalizes hand landmarks and saves them as a new row in the dataset CSV.
    """
    try:
        initialize_csv()
        
        # Convert landmarks to list of dicts for preprocessor
        landmarks_list = [{'x': lm.x, 'y': lm.y, 'z': lm.z} for lm in sample.landmarks]
        
        if len(landmarks_list) != 21:
            raise HTTPException(status_code=400, detail="Must provide exactly 21 landmarks.")
            
        # Normalize landmarks
        normalized_coords = normalize_hand_landmarks(landmarks_list)
        
        # Save to CSV
        with open(CSV_PATH, mode='a', newline='') as f:
            writer = csv.writer(f)
            row = [sample.gesture_name] + normalized_coords
            writer.writerow(row)
            
        # Return success with current counts
        counts = get_current_counts()
        return {
            "success": True,
            "message": f"Sample saved for gesture '{sample.gesture_name}'.",
            "counts": counts
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record sample: {str(e)}")

@router.get("/counts")
def get_counts_endpoint():
    """
    Retrieves the current number of samples saved in the CSV for each gesture.
    """
    try:
        initialize_csv()
        return {
            "success": True,
            "counts": get_current_counts()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get counts: {str(e)}")

def get_current_counts() -> Dict[str, int]:
    """Helper to read counts from the dataset file."""
    counts = {
        'Thumbs Up': 0,
        'Peace': 0,
        'Stop Palm': 0,
        'Fist': 0,
        'OK Sign': 0
    }
    if not os.path.exists(CSV_PATH):
        return counts
        
    try:
        with open(CSV_PATH, mode='r') as f:
            reader = csv.reader(f)
            next(reader, None)  # Skip header
            for row in reader:
                if row:
                    gesture = row[0]
                    if gesture in counts:
                        counts[gesture] += 1
                    else:
                        counts[gesture] = 1 # Handle custom gestures
    except Exception as e:
        print(f"Error reading counts: {e}")
        
    return counts
