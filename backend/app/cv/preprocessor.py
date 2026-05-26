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

    # Extract 210 pairwise distances (fully rotation and translation invariant)
    distances = []
    max_dist = 0.0
    
    for i in range(21):
        for j in range(i + 1, 21):
            dx = landmarks[i]['x'] - landmarks[j]['x']
            dy = landmarks[i]['y'] - landmarks[j]['y']
            dz = landmarks[i]['z'] - landmarks[j]['z']
            dist = np.sqrt(dx*dx + dy*dy + dz*dz)
            distances.append(dist)
            if dist > max_dist:
                max_dist = dist
                
    if max_dist == 0.0:
        max_dist = 1.0
        
    return [float(d / max_dist) for d in distances]
