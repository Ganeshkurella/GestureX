import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.websocket_cv import router as websocket_router

app = FastAPI(
    title="GestureX API",
    description="Backend API for real-time hand tracking and landmark extraction",
    version="1.0.0"
)

# Enable CORS for the local React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the CV WebSocket router
app.include_router(websocket_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "GestureX API",
        "version": "1.0.0",
        "features": {
            "hand_tracking": "Active",
            "websockets": "/ws/stream"
        }
    }

if __name__ == "__main__":
    # Start the FastAPI server using Uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
