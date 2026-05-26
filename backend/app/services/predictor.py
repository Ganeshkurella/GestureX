import os
import joblib
import numpy as np
import logging
from typing import List, Dict, Tuple, Optional
from app.cv.preprocessor import normalize_hand_landmarks

# Setup structured logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("predictor_service")

# Paths to serialized joblib assets relative to this module
def get_asset_path(filename: str) -> str:
    # Candidate 1: project root / backend / data (standard local execution)
    path1 = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend', 'data', filename))
    # Candidate 2: project root / data (old local location)
    path2 = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', filename))
    # Candidate 3: backend root / data (for Vercel deployment where backend is root)
    path3 = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', filename))
    # Candidate 4: relative to current working directory
    path4 = os.path.abspath(os.path.join(os.getcwd(), 'data', filename))
    path5 = os.path.abspath(os.path.join(os.getcwd(), 'backend', 'data', filename))
    
    for p in [path1, path2, path3, path4, path5]:
        if os.path.exists(p):
            return p
    # Fallback to Candidate 1 if none exist
    return path1

MODEL_PATH = get_asset_path('model.joblib')
ENCODER_PATH = get_asset_path('label_encoder.joblib')

class GesturePredictorService:
    def __init__(self):
        self.model = None
        self.label_encoder = None
        self.is_loaded = False

    def load_model(self):
        """Loads model and encoder binaries into memory. Done on server startup."""
        if self.is_loaded:
            return
            
        if not os.path.exists(MODEL_PATH) or not os.path.exists(ENCODER_PATH):
            raise FileNotFoundError(
                f"Trained model files not found at:\n"
                f"  - {MODEL_PATH}\n"
                f"  - {ENCODER_PATH}\n"
                f"Please run 'python train.py' first to train and save the model."
            )

        logger.info(f"Loading gesture recognition model from: {MODEL_PATH}")
        self.model = joblib.load(MODEL_PATH)
        self.label_encoder = joblib.load(ENCODER_PATH)
        self.is_loaded = True
        logger.info("Gesture predictor service successfully initialized.")

    def predict(self, raw_landmarks: List[Dict[str, float]]) -> Tuple[str, float]:
        """
        Runs inference on 21 raw landmark points.
        
        Args:
            raw_landmarks: List of 21 dictionaries with keys 'x', 'y', 'z'
            
        Returns:
            Tuple of (gesture_name_string, confidence_probability_float)
        """
        if not self.is_loaded:
            raise RuntimeError("Model is not loaded. Call load_model() first.")

        # 1. Normalize landmarks (translation and scale invariance)
        normalized_features = normalize_hand_landmarks(raw_landmarks)

        # 2. Reshape to 2D array (1 sample, 63 features) for scikit-learn
        features_array = np.array(normalized_features).reshape(1, -1)

        # 3. Perform prediction
        pred_class_idx = self.model.predict(features_array)[0]
        
        # 4. Extract probability confidence
        probabilities = self.model.predict_proba(features_array)[0]
        confidence = float(probabilities[pred_class_idx])

        # 5. Decode label to string
        gesture_name = self.label_encoder.inverse_transform([pred_class_idx])[0]

        return gesture_name, confidence

# Singleton service instance
predictor_service = GesturePredictorService()
