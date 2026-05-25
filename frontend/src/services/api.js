const BASE_URL = "http://127.0.0.1:8000/api/dataset";

/**
 * Fetch the current dataset sample counts for all gestures from the FastAPI backend.
 */
export async function getDatasetCounts() {
  try {
    const response = await fetch(`${BASE_URL}/counts`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.counts;
  } catch (error) {
    console.error("Error fetching dataset counts:", error);
    return {
      'Thumbs Up': 0,
      'Peace': 0,
      'Stop Palm': 0,
      'Fist': 0,
      'OK Sign': 0
    };
  }
}

/**
 * Send a recorded hand landmark sample to the FastAPI backend.
 * @param {string} gestureName - Name of the gesture (e.g., 'Thumbs Up')
 * @param {Array} landmarks - Array of 21 landmark objects with x, y, z keys
 */
export async function saveDatasetSample(gestureName, landmarks) {
  try {
    const response = await fetch(`${BASE_URL}/sample`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gesture_name: gestureName,
        landmarks: landmarks.map(lm => ({
          x: Number(lm.x),
          y: Number(lm.y),
          z: Number(lm.z)
        }))
      })
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error saving dataset sample:", error);
    throw error;
  }
}
