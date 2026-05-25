import cv2
import mediapipe as mp
import numpy as np

class HandTracker:
    def __init__(self, static_image_mode=False, max_num_hands=2, min_detection_confidence=0.5, min_tracking_confidence=0.5):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=static_image_mode,
            max_num_hands=max_num_hands,
            model_complexity=1,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
        self.mp_draw = mp.solutions.drawing_utils

    def process_frame(self, frame: np.ndarray):
        """
        Process a single BGR image frame and extract hand landmarks.
        Returns a list of detected hands with landmarks and handedness.
        """
        # Convert BGR (OpenCV format) to RGB (MediaPipe format)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        detected_hands = []
        if results.multi_hand_landmarks:
            for idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
                # Extract handedness classification (Left vs Right)
                # Note: MediaPipe assumes camera feed, so it might be mirrored.
                handedness_info = results.multi_handedness[idx].classification[0]
                label = handedness_info.label  # "Left" or "Right"
                score = handedness_info.score
                
                landmarks = []
                for lm in hand_landmarks.landmark:
                    landmarks.append({
                        "x": float(lm.x),
                        "y": float(lm.y),
                        "z": float(lm.z)
                    })
                
                detected_hands.append({
                    "label": label,
                    "confidence": float(score),
                    "landmarks": landmarks
                })
        
        return detected_hands

    def close(self):
        self.hands.close()
