import numpy as np
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.predictor import predictor_service

# Optional imports for heavy computer vision libraries (e.g. on serverless Vercel)
try:
    import cv2
    from app.cv.hand_tracker import HandTracker
    CV_ENABLED = True
except ImportError:
    CV_ENABLED = False

router = APIRouter()

# Instantiate the HandTracker
# Keep it persistent per connection or global
# A global or per-socket instance is fine. Let's create a per-connection tracker to isolate state.

@router.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    if not CV_ENABLED:
        await websocket.send_json({
            "success": False,
            "error": "Server-side Computer Vision is disabled in this cloud environment (missing opencv-python or mediapipe). Please switch to Client (WASM) mode."
        })
        await websocket.close()
        return
        
    # Initialize hand tracker for this session
    tracker = HandTracker(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    try:
        while True:
            # Receive binary frame (JPEG) from client
            data = await websocket.receive_bytes()
            
            if not data:
                continue
                
            # Decode the JPEG binary image using numpy and OpenCV
            nparr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                await websocket.send_json({
                    "success": False,
                    "error": "Failed to decode frame"
                })
                continue
                
            # Process frame using HandTracker
            detected_hands = tracker.process_frame(frame)
            
            # Predict gesture if a hand is detected and the model is ready
            gesture_name = "None"
            confidence = 0.0
            
            if len(detected_hands) > 0 and predictor_service.is_loaded:
                try:
                    # Perform inference on the first detected hand
                    gesture_name, confidence = predictor_service.predict(detected_hands[0]['landmarks'])
                except Exception as pred_err:
                    print(f"WebSocket prediction error: {pred_err}")
            
            # Send hand coordinates and prediction class back in a single frame payload
            response = {
                "success": True,
                "detected": len(detected_hands) > 0,
                "hands": detected_hands,
                "gesture": gesture_name,
                "confidence": confidence
            }
            
            await websocket.send_text(json.dumps(response))
            
    except WebSocketDisconnect:
        print("Client disconnected from WebSocket stream")
    except Exception as e:
        print(f"Error in WebSocket handler: {str(e)}")
        try:
            await websocket.send_json({
                "success": False,
                "error": str(e)
            })
        except:
            pass
    finally:
        if CV_ENABLED and 'tracker' in locals():
            tracker.close()
