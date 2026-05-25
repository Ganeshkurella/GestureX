/**
 * Service to handle WebSocket connection with FastAPI backend for server-side hand tracking.
 */
export class TrackingWebSocketService {
  constructor(url) {
    const getWSBaseUrl = () => {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      if (hostname.endsWith('.vercel.app')) {
        return `${protocol}//${window.location.host}/_/backend/ws/stream`;
      }
      return `${protocol}//${hostname}:8000/ws/stream`;
    };

    this.url = url || getWSBaseUrl();
    this.ws = null;
    this.onMessageCallback = null;
    this.onStatusChangeCallback = null;
    this.reconnectTimeout = null;
    this.shouldReconnect = true;
  }

  connect(onMessage, onStatusChange) {
    this.onMessageCallback = onMessage;
    this.onStatusChangeCallback = onStatusChange;
    this.shouldReconnect = true;

    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log("WebSocket connected to:", this.url);
        if (this.onStatusChangeCallback) {
          this.onStatusChangeCallback("connected");
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.onMessageCallback) {
            this.onMessageCallback(data);
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (this.onStatusChangeCallback) {
          this.onStatusChangeCallback("error");
        }
      };

      this.ws.onclose = () => {
        console.log("WebSocket closed");
        if (this.onStatusChangeCallback) {
          this.onStatusChangeCallback("disconnected");
        }
        
        // Attempt reconnection after 3 seconds if not explicitly disconnected
        if (this.shouldReconnect) {
          this.reconnectTimeout = setTimeout(() => {
            console.log("Reconnecting WebSocket...");
            this.connect(this.onMessageCallback, this.onStatusChangeCallback);
          }, 3000);
        }
      };
    } catch (e) {
      console.error("Failed to establish WebSocket connection:", e);
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback("error");
      }
    }
  }

  sendFrame(blob) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(blob);
      return true;
    }
    return false;
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
