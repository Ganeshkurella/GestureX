import os
import cv2
import time
import csv
import mediapipe as mp
import numpy as np
from app.cv.preprocessor import normalize_hand_landmarks

# MVP Gestures configuration
GESTURES = {
    '1': 'Thumbs Up',
    '2': 'Peace',
    '3': 'Stop Palm',
    '4': 'Fist',
    '5': 'OK Sign'
}

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'data'))
CSV_PATH = os.path.join(DATA_DIR, 'gestures_dataset.csv')

def initialize_csv():
    """Initializes the dataset CSV file with header headers if it doesn't exist."""
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(CSV_PATH):
        with open(CSV_PATH, mode='w', newline='') as f:
            writer = csv.writer(f)
            # Create header: gesture_name, x0, y0, z0, ..., z20
            header = ['gesture_name']
            for i in range(21):
                header.extend([f'x{i}', f'y{i}', f'z{i}'])
            writer.writerow(header)
        print(f"Initialized CSV file at: {CSV_PATH}")

def get_sample_counts() -> dict:
    """Reads the CSV file to count how many samples have been collected for each gesture."""
    counts = {name: 0 for name in GESTURES.values()}
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
    except Exception as e:
        print(f"Error reading dataset counts: {e}")
    return counts

def save_sample(gesture_name: str, landmarks_list: list) -> bool:
    """Normalizes landmarks and appends them to the CSV dataset."""
    try:
        # Run translation and scale normalization
        normalized_coords = normalize_hand_landmarks(landmarks_list)
        
        with open(CSV_PATH, mode='a', newline='') as f:
            writer = csv.writer(f)
            row = [gesture_name] + normalized_coords
            writer.writerow(row)
        return True
    except Exception as e:
        print(f"Error saving sample: {e}")
        return False

def main():
    initialize_csv()
    
    # Initialize MediaPipe Hands
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.7,
        min_tracking_confidence=0.7
    )
    mp_draw = mp.solutions.drawing_utils
    
    # Load initial sample counts
    sample_counts = get_sample_counts()
    
    # Active state variables
    selected_key = '1'
    current_gesture = GESTURES[selected_key]
    recording = False
    last_record_time = 0
    record_delay = 0.15 # Minimum delay between continuous records (in seconds)
    
    # Start Webcam capture
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    print("\n" + "="*50)
    print("      GESTUREX STANDALONE DATASET COLLECTOR")
    print("="*50)
    print("Instructions:")
    for key, name in GESTURES.items():
        print(f"  [{key}] Select gesture: {name}")
    print("  [Space] Capture single landmark snapshot")
    print("  [R]     Toggle auto-recording (captures every 150ms)")
    print("  [Q]     Exit data collection")
    print("="*50 + "\n")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Failed to capture frame from webcam.")
            break
            
        # Flip frame horizontally to act as a mirror
        frame = cv2.flip(frame, 1)
        h, w, c = frame.shape
        
        # Process landmarks
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb_frame)
        
        hand_detected = False
        raw_landmarks = []
        
        if results.multi_hand_landmarks:
            hand_detected = True
            hand_landmarks = results.multi_hand_landmarks[0]
            
            # Draw standard skeleton connections on the display frame
            mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            
            # Parse raw landmark coordinates
            for lm in hand_landmarks.landmark:
                raw_landmarks.append({
                    'x': lm.x,
                    'y': lm.y,
                    'z': lm.z
                })
        
        # Keyboard actions
        key = cv2.waitKey(1) & 0xFF
        
        if chr(key) in GESTURES:
            selected_key = chr(key)
            current_gesture = GESTURES[selected_key]
            print(f"Selected label: {current_gesture.upper()}")
            
        elif key == ord('r') or key == ord('R'):
            recording = not recording
            print(f"Auto-recording: {'ENABLED' if recording else 'DISABLED'}")
            
        elif key == 32: # Spacebar
            if hand_detected:
                success = save_sample(current_gesture, raw_landmarks)
                if success:
                    sample_counts[current_gesture] += 1
                    print(f"Saved snapshot! Total {current_gesture}: {sample_counts[current_gesture]}")
            else:
                print("No hand detected. Cannot save snapshot.")
                
        elif key == ord('q') or key == ord('Q'):
            break

        # Handle auto-recording logic
        if recording and hand_detected:
            now = time.time()
            if now - last_record_time >= record_delay:
                success = save_sample(current_gesture, raw_landmarks)
                if success:
                    sample_counts[current_gesture] += 1
                    last_record_time = now
                    # Optional console heartbeat
                    print(f"Saved: {current_gesture} ({sample_counts[current_gesture]})")

        # Visual HUD Overlay
        # Dark visual banner for telemetry
        overlay = frame.copy()
        cv2.rectangle(overlay, (10, 10), (320, 240), (15, 10, 5), -1)
        cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)
        
        # Glow border for HUD
        cv2.rectangle(frame, (10, 10), (320, 240), (241, 252, 102), 1)  # Cyan border
        
        # Render text statistics
        cv2.putText(frame, "GESTUREX TELEMETRY HUD", (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (241, 252, 102), 1, cv2.LINE_AA)
        
        cv2.putText(frame, f"Active Label: {current_gesture.upper()}", (20, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
        
        status_color = (0, 255, 128) if hand_detected else (128, 0, 255)
        status_text = "HAND DETECTED" if hand_detected else "NO HAND IN VIEW"
        cv2.putText(frame, f"Sensor: {status_text}", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.45, status_color, 1, cv2.LINE_AA)
        
        rec_color = (128, 0, 255) if recording else (255, 255, 255)
        rec_text = "AUTO-RECORDING" if recording else "STANDBY"
        cv2.putText(frame, f"State: {rec_text}", (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.45, rec_color, 1, cv2.LINE_AA)
        
        # Show list of sample counts
        cv2.putText(frame, "SAMPLE COUNTERS:", (20, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (241, 252, 102), 1, cv2.LINE_AA)
        y_pos = 150
        for name, count in sample_counts.items():
            is_active = (name == current_gesture)
            color = (102, 252, 241) if is_active else (200, 200, 200)
            prefix = ">> " if is_active else "   "
            cv2.putText(frame, f"{prefix}{name}: {count}", (20, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1, cv2.LINE_AA)
            y_pos += 15

        # Show control help keys on bottom
        cv2.putText(frame, "[1-5]: Select Label  [Space]: Snap  [R]: Auto  [Q]: Quit", (15, h - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1, cv2.LINE_AA)

        # Show frames in OpenCV window
        cv2.imshow("GestureX - Dataset Collector", frame)

    cap.release()
    cv2.destroyAllWindows()
    hands.close()
    print(f"\nCollection finished. Dataset stored in: {CSV_PATH}")

if __name__ == "__main__":
    main()
