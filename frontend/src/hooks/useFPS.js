import { useState, useRef, useCallback } from 'react';

/**
 * Hook for calculating and tracking frames per second (FPS).
 * Returns the current FPS value and a function to call on every frame update.
 */
export function useFPS() {
  const [fps, setFps] = useState(0);
  const frameTimes = useRef([]);

  const updateFPS = useCallback(() => {
    const now = performance.now();
    frameTimes.current.push(now);

    // Remove frame timestamps older than 1 second (1000ms)
    while (frameTimes.current.length > 0 && frameTimes.current[0] <= now - 1000) {
      frameTimes.current.shift();
    }

    setFps(frameTimes.current.length);
  }, []);

  return [fps, updateFPS];
}
