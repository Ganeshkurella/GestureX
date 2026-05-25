import axios from 'axios';

// Dynamically determine the API base URL based on origin hostname
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  
  // Vercel deployment: proxy via the same-origin route /_/backend/api
  if (hostname.endsWith('.vercel.app') || window.location.pathname.startsWith('/_/')) {
    return `${window.location.protocol}//${window.location.host}/_/backend/api`;
  }
  
  // Local / LAN development
  return `${window.location.protocol}//${hostname}:8000/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Create configured Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5s timeout
});

/**
 * Fetch the current dataset sample counts for all gestures from the FastAPI backend.
 */
export async function getDatasetCounts() {
  try {
    const response = await apiClient.get('/dataset/counts');
    return response.data.counts;
  } catch (error) {
    console.error("Axios: Error fetching dataset counts:", error);
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
 * Send a recorded hand landmark sample to the FastAPI backend dataset CSV.
 */
export async function saveDatasetSample(gestureName, landmarks) {
  try {
    const response = await apiClient.post('/dataset/sample', {
      gesture_name: gestureName,
      landmarks: landmarks.map(lm => ({
        x: Number(lm.x),
        y: Number(lm.y),
        z: Number(lm.z)
      }))
    });
    return response.data;
  } catch (error) {
    console.error("Axios: Error saving dataset sample:", error);
    throw error;
  }
}

/**
 * Send hand landmarks coordinates to the REST API for model prediction inference.
 * @param {Array} landmarks - Array of 21 landmark objects with x, y, z keys.
 * @returns {Promise<Object>} - Contains prediction class string and confidence probability.
 */
export async function predictGesture(landmarks) {
  try {
    const response = await apiClient.post('/predict', {
      landmarks: landmarks.map(lm => ({
        x: Number(lm.x),
        y: Number(lm.y),
        z: Number(lm.z)
      }))
    });
    return response.data; // { gesture: string, confidence: float }
  } catch (error) {
    console.error("Axios: Error predicting gesture:", error);
    throw error;
  }
}
