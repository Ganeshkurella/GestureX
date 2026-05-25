import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.services.predictor import predictor_service
from app.routes.websocket_cv import router as websocket_router
from app.routes.dataset import router as dataset_router
from app.routes.health import router as health_router
from app.routes.predict import router as predict_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ML model binaries into memory at startup
    try:
        predictor_service.load_model()
    except Exception as e:
        print(f"CRITICAL: Failed to load gesture model on startup: {e}")
        print("FastAPI will start, but predictions might be unavailable.")
    yield
    # Code to run on shutdown (cleanup)
    print("Shutting down GestureX service...")

app = FastAPI(
    title="GestureX API",
    description="Backend API for real-time hand tracking, landmark extraction, and gesture classification",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for the local React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router)
app.include_router(predict_router)
app.include_router(websocket_router)
app.include_router(dataset_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "GestureX API",
        "version": "1.0.0",
        "features": {
            "hand_tracking": "Active",
            "websockets": "/ws/stream",
            "inference": "/api/predict",
            "health": "/health"
        }
    }

if __name__ == "__main__":
    # Start the FastAPI server using Uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
