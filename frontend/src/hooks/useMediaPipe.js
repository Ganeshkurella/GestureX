import { useEffect, useState, useRef } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

let globalHandLandmarker = null;
let globalLoadingPromise = null;

/**
 * React hook to initialize and run the MediaPipe Hand Landmarker.
 * Reuses a single model instance globally to prevent memory leaks and redundant loading.
 */
export function useMediaPipe() {
  const [isLoading, setIsLoading] = useState(!globalHandLandmarker);
  const [error, setError] = useState(null);
  const landmarkerRef = useRef(globalHandLandmarker);

  useEffect(() => {
    if (landmarkerRef.current) {
      setIsLoading(false);
      return;
    }

    if (globalLoadingPromise) {
      globalLoadingPromise
        .then((landmarker) => {
          landmarkerRef.current = landmarker;
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err);
          setIsLoading(false);
        });
      return;
    }

    const initMediaPipe = async () => {
      try {
        let wasmFileset = null;
        try {
          // Primary CDN
          wasmFileset = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
          );
        } catch (cdnErr) {
          console.warn("Primary jsDelivr CDN failed, attempting unpkg fallback...", cdnErr);
          // Fallback CDN
          wasmFileset = await FilesetResolver.forVisionTasks(
            "https://unpkg.com/@mediapipe/tasks-vision@0.10.8/wasm"
          );
        }

        const modelUrl = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
        let landmarker = null;

        try {
          // Attempt loading with GPU acceleration
          landmarker = await HandLandmarker.createFromOptions(wasmFileset, {
            baseOptions: {
              modelAssetPath: modelUrl,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minHandTrackingConfidence: 0.5,
          });
          console.log("MediaPipe HandLandmarker loaded successfully with GPU acceleration.");
        } catch (gpuErr) {
          console.warn("MediaPipe GPU initialization failed. Falling back to CPU...", gpuErr);
          // Fallback to CPU execution (useful in sandboxes, VMs, or legacy hardware)
          landmarker = await HandLandmarker.createFromOptions(wasmFileset, {
            baseOptions: {
              modelAssetPath: modelUrl,
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minHandTrackingConfidence: 0.5,
          });
          console.log("MediaPipe HandLandmarker loaded successfully with CPU mode.");
        }

        globalHandLandmarker = landmarker;
        landmarkerRef.current = landmarker;
        setIsLoading(false);
        return landmarker;
      } catch (err) {
        console.error("Failed to initialize MediaPipe Hand Landmarker:", err);
        setError(err);
        setIsLoading(false);
        throw err;
      }
    };

    globalLoadingPromise = initMediaPipe();
  }, []);

  const detectHands = (videoElement) => {
    if (!landmarkerRef.current || !videoElement || videoElement.readyState < 2) {
      return null;
    }

    try {
      const timestamp = performance.now();
      const results = landmarkerRef.current.detectForVideo(videoElement, timestamp);
      return results;
    } catch (err) {
      console.error("MediaPipe detection error:", err);
      return null;
    }
  };

  return { isLoading, error, detectHands };
}
