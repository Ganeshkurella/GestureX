import os
import csv
import numpy as np
from app.cv.preprocessor import normalize_hand_landmarks

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data'))
CSV_PATH = os.path.join(DATA_DIR, 'gestures_dataset.csv')

def get_base_hand_structure() -> list:
    """Returns base landmark positions (approximate hand topology before flexing)."""
    # 21 landmarks
    coords = [None] * 21
    # 0: Wrist
    coords[0] = {'x': 0.0, 'y': 0.0, 'z': 0.0}
    # Thumb: 1-4
    coords[1] = {'x': 0.08, 'y': -0.08, 'z': -0.02}
    coords[2] = {'x': 0.14, 'y': -0.12, 'z': -0.04}
    coords[3] = {'x': 0.18, 'y': -0.16, 'z': -0.06}
    coords[4] = {'x': 0.21, 'y': -0.19, 'z': -0.07}
    # Index: 5-8
    coords[5] = {'x': 0.08, 'y': -0.22, 'z': -0.02}
    coords[6] = {'x': 0.09, 'y': -0.32, 'z': -0.04}
    coords[7] = {'x': 0.095, 'y': -0.40, 'z': -0.05}
    coords[8] = {'x': 0.10, 'y': -0.46, 'z': -0.06}
    # Middle: 9-12
    coords[9] = {'x': 0.02, 'y': -0.23, 'z': -0.02}
    coords[10] = {'x': 0.02, 'y': -0.34, 'z': -0.04}
    coords[11] = {'x': 0.02, 'y': -0.43, 'z': -0.05}
    coords[12] = {'x': 0.02, 'y': -0.50, 'z': -0.06}
    # Ring: 13-16
    coords[13] = {'x': -0.04, 'y': -0.22, 'z': -0.02}
    coords[14] = {'x': -0.05, 'y': -0.32, 'z': -0.04}
    coords[15] = {'x': -0.055, 'y': -0.40, 'z': -0.05}
    coords[16] = {'x': -0.06, 'y': -0.46, 'z': -0.06}
    # Pinky: 17-20
    coords[17] = {'x': -0.09, 'y': -0.20, 'z': -0.02}
    coords[18] = {'x': -0.11, 'y': -0.28, 'z': -0.04}
    coords[19] = {'x': -0.12, 'y': -0.34, 'z': -0.05}
    coords[20] = {'x': -0.13, 'y': -0.40, 'z': -0.06}
    
    return coords

def make_fist(hand: list) -> list:
    """Curl all fingers close to the palm."""
    flexed = [dict(lm) for lm in hand]
    # Thumb curled inward
    flexed[2] = {'x': 0.06, 'y': -0.10, 'z': -0.03}
    flexed[3] = {'x': 0.04, 'y': -0.11, 'z': -0.04}
    flexed[4] = {'x': 0.02, 'y': -0.12, 'z': -0.05}
    # Index curled
    flexed[6] = {'x': 0.07, 'y': -0.17, 'z': -0.04}
    flexed[7] = {'x': 0.05, 'y': -0.16, 'z': -0.05}
    flexed[8] = {'x': 0.04, 'y': -0.18, 'z': -0.06}
    # Middle curled
    flexed[10] = {'x': 0.01, 'y': -0.17, 'z': -0.04}
    flexed[11] = {'x': 0.00, 'y': -0.16, 'z': -0.05}
    flexed[12] = {'x': -0.01, 'y': -0.18, 'z': -0.06}
    # Ring curled
    flexed[14] = {'x': -0.03, 'y': -0.17, 'z': -0.04}
    flexed[15] = {'x': -0.02, 'y': -0.16, 'z': -0.05}
    flexed[16] = {'x': -0.01, 'y': -0.18, 'z': -0.06}
    # Pinky curled
    flexed[18] = {'x': -0.06, 'y': -0.16, 'z': -0.04}
    flexed[19] = {'x': -0.05, 'y': -0.15, 'z': -0.05}
    flexed[20] = {'x': -0.04, 'y': -0.17, 'z': -0.06}
    return flexed

def make_stop_palm(hand: list) -> list:
    """All fingers extended straight and separated."""
    # Base structure is already an extended open hand
    return [dict(lm) for lm in hand]

def make_thumbs_up(hand: list) -> list:
    """Thumb extended outward, all other fingers curled tightly into fist."""
    flexed = make_fist(hand)
    # Restore thumb to fully extended position (pointing up/sideways)
    flexed[1] = {'x': 0.12, 'y': -0.08, 'z': -0.02}
    flexed[2] = {'x': 0.22, 'y': -0.14, 'z': -0.04}
    flexed[3] = {'x': 0.28, 'y': -0.18, 'z': -0.05}
    flexed[4] = {'x': 0.32, 'y': -0.22, 'z': -0.06}
    return flexed

def make_peace(hand: list) -> list:
    """Index and Middle extended, Thumb, Ring, and Pinky curled."""
    flexed = make_fist(hand)
    # Restore index to extended
    flexed[6] = {'x': 0.09, 'y': -0.32, 'z': -0.04}
    flexed[7] = {'x': 0.095, 'y': -0.40, 'z': -0.05}
    flexed[8] = {'x': 0.10, 'y': -0.46, 'z': -0.06}
    # Restore middle to extended
    flexed[10] = {'x': 0.02, 'y': -0.34, 'z': -0.04}
    flexed[11] = {'x': 0.02, 'y': -0.43, 'z': -0.05}
    flexed[12] = {'x': 0.02, 'y': -0.50, 'z': -0.06}
    return flexed

def make_ok_sign(hand: list) -> list:
    """Index tip and Thumb tip touch. Middle, Ring, Pinky extended."""
    flexed = [dict(lm) for lm in hand]
    # Thumb curled to meet index
    flexed[2] = {'x': 0.09, 'y': -0.12, 'z': -0.03}
    flexed[3] = {'x': 0.08, 'y': -0.16, 'z': -0.04}
    flexed[4] = {'x': 0.06, 'y': -0.19, 'z': -0.05} # Thumb Tip
    # Index curled to meet thumb
    flexed[6] = {'x': 0.07, 'y': -0.22, 'z': -0.03}
    flexed[7] = {'x': 0.065, 'y': -0.20, 'z': -0.04}
    flexed[8] = {'x': 0.06, 'y': -0.19, 'z': -0.05} # Index Tip (matching Thumb Tip)
    
    # Middle, Ring, Pinky remain fully extended (from default hand)
    return flexed

def generate_noise(hand: list, noise_level: float = 0.025) -> list:
    """Adds small Gaussian noise to simulate real camera/MediaPipe tracking jitter."""
    noisy_hand = []
    for lm in hand:
        noisy_hand.append({
            'x': lm['x'] + np.random.normal(0, noise_level),
            'y': lm['y'] + np.random.normal(0, noise_level),
            'z': lm['z'] + np.random.normal(0, noise_level)
        })
    return noisy_hand

def seed_dataset(samples_per_gesture: int = 200):
    """Generates and saves the synthetic dataset to CSV."""
    os.makedirs(DATA_DIR, exist_ok=True)
    
    base_hand = get_base_hand_structure()
    
    gesture_funcs = {
        'Thumbs Up': make_thumbs_up,
        'Peace': make_peace,
        'Stop Palm': make_stop_palm,
        'Fist': make_fist,
        'OK Sign': make_ok_sign
    }
    
    rows = []
    
    for name, func in gesture_funcs.items():
        gesture_base = func(base_hand)
        for _ in range(samples_per_gesture):
            # Apply coordinate noise to simulate live webcam frames
            noisy_hand = generate_noise(gesture_base, noise_level=0.015)
            # Run translation & scale normalization (critical for training compatibility!)
            normalized = normalize_hand_landmarks(noisy_hand)
            rows.append([name] + normalized)
            
    with open(CSV_PATH, mode='w', newline='') as f:
        writer = csv.writer(f)
        # Write headers
        headers = ['gesture_name']
        for i in range(21):
            headers.extend([f'x{i}', f'y{i}', f'z{i}'])
        writer.writerow(headers)
        writer.writerows(rows)
        
    print(f"Successfully generated synthetic dataset with {len(rows)} samples!")
    print(f"Dataset path: {CSV_PATH}")

if __name__ == "__main__":
    seed_dataset()
