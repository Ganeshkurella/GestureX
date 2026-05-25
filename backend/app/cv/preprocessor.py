import numpy as np
from typing import List, Dict

def normalize_hand_landmarks(landmarks: List[Dict[str, float]]) -> List[float]:
    """
    Normalizes a hand's 21 landmarks to make them translation-invariant and scale-invariant.
    
    Processing steps:
    1. Translation Invariance: Shifts all coordinates relative to the wrist (landmark 0) 
       so that the wrist is centered at origin (0, 0, 0).
    2. Scale Invariance: Computes the Euclidean distance of all points from the wrist.
       Divides all coordinates by the maximum distance found.
    3. Flattening: Converts the coordinates to a 1D flat list of 63 values [x0, y0, z0, x1, y1, z1, ...].
    
    Args:
        landmarks: A list of 21 dictionaries containing 'x', 'y', and 'z' coordinates.
                   
    Returns:
        A list of 63 normalized float values.
    """
    if len(landmarks) != 21:
        raise ValueError(f"Expected 21 landmarks, but got {len(landmarks)}.")

    # Step 1: Translation Invariance (Shift wrist to origin)
    wrist_x = landmarks[0]['x']
    wrist_y = landmarks[0]['y']
    wrist_z = landmarks[0]['z']
    
    translated_coords = []
    for lm in landmarks:
        translated_coords.append({
            'x': lm['x'] - wrist_x,
            'y': lm['y'] - wrist_y,
            'z': lm['z'] - wrist_z
        })

    # Step 2: Scale Invariance (Divide by maximum Euclidean distance from wrist)
    max_distance = 0.0
    distances = []
    
    for lm in translated_coords:
        # Distance formula: sqrt(x^2 + y^2 + z^2)
        dist = np.sqrt(lm['x']**2 + lm['y']**2 + lm['z']**2)
        distances.append(dist)
        if dist > max_distance:
            max_distance = dist

    # Prevent division by zero if hand tracking is corrupted/static
    if max_distance == 0.0:
        max_distance = 1.0

    # Step 3: Flatten into a 63-element list
    normalized_flat = []
    for lm in translated_coords:
        normalized_flat.extend([
            float(lm['x'] / max_distance),
            float(lm['y'] / max_distance),
            float(lm['z'] / max_distance)
        ])

    return normalized_flat
