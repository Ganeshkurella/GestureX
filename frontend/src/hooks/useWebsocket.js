import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Reusable hook to handle real-time WebSockets connection to FastAPI backend.
 * Provides connection state, automatic reconnection with exponential backoff,
 * frame throughput stats, and round-trip latency calculations.
 */
export function useWebsocket(url = "ws://127.0.0.1:8000/ws/stream") {
  const [status, setStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected' | 'error'
  const [latency, setLatency] = useState(0);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);
  const sentTimesRef = useRef([]);

  const onMessageRef = useRef(null);
  const onStatusChangeRef = useRef(null);

  // Reconnection configurations
  const maxReconnectDelay = 10000; // 10 seconds max delay
  const baseReconnectDelay = 1000; // start at 1 second

  const connect = useCallback((onMessage, onStatusChange) => {
    // Save callbacks to refs to avoid effect re-triggers
    onMessageRef.current = onMessage;
    onStatusChangeRef.current = onStatusChange;
    shouldReconnectRef.current = true;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus('connecting');
    if (onStatusChange) onStatusChange('connecting');

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected to:", url);
        setStatus('connected');
        if (onStatusChangeRef.current) onStatusChangeRef.current('connected');
        reconnectAttemptsRef.current = 0; // reset attempts
      };

      wsRef.current.onmessage = (event) => {
        // Calculate latency
        if (sentTimesRef.current.length > 0) {
          const sendTime = sentTimesRef.current.shift();
          const rtt = Math.round(performance.now() - sendTime);
          setLatency(rtt);
        }

        try {
          const data = JSON.parse(event.data);
          if (onMessageRef.current) {
            onMessageRef.current(data, latency);
          }
        } catch (err) {
          console.error("Error parsing socket JSON payload:", err);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStatus('error');
        if (onStatusChangeRef.current) onStatusChangeRef.current('error');
      };

      wsRef.current.onclose = (event) => {
        console.log(`WebSocket closed: Code ${event.code}, Clean: ${event.wasClean}`);
        setStatus('disconnected');
        if (onStatusChangeRef.current) onStatusChangeRef.current('disconnected');

        // Automatic reconnection logic
        if (shouldReconnectRef.current) {
          const delay = Math.min(
            baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
            maxReconnectDelay
          );
          console.log(`Scheduling reconnect attempt ${reconnectAttemptsRef.current + 1} in ${delay}ms`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect(onMessageRef.current, onStatusChangeRef.current);
          }, delay);
        }
      };
    } catch (e) {
      console.error("Failed to establish WebSocket connection:", e);
      setStatus('error');
      if (onStatusChange) onStatusChange('error');
    }
  }, [url]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, "Component unmounted");
      wsRef.current = null;
    }
    setStatus('disconnected');
    sentTimesRef.current = [];
  }, []);

  const sendFrame = useCallback((blob) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      sentTimesRef.current.push(performance.now());
      // Prevent memory leaks in case frames are dropped/not returned
      if (sentTimesRef.current.length > 100) {
        sentTimesRef.current.shift();
      }
      wsRef.current.send(blob);
      return true;
    }
    return false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Hook cleanup");
      }
    };
  }, []);

  return { status, latency, connect, disconnect, sendFrame };
}
