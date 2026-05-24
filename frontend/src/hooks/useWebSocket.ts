import { useEffect, useRef } from 'react'
import { useAlertStore } from '@/store/useAlertStore'
import type { Alert } from '@/types'

let sharedAudioCtx: any = null;

// Web Audio API sound generator for incoming WebSocket alerts
const triggerBeepNode = (freq: number, duration: number, isMuted: boolean) => {
  if (isMuted) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    
    const ctx = sharedAudioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (error) {
    // Ignore browser autoplay blocks
  }
}

export function useWebSocket(active: boolean) {
  const { addAlert, setAlerts, isAudioMuted } = useAlertStore()
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const delayRef = useRef<number>(2000) // Initial reconnect backoff delay

  useEffect(() => {
    if (!active) {
      if (socketRef.current) {
        socketRef.current.close();
      }
      return;
    }

    const connect = () => {
      console.log('🔌 Connecting to WebSocket broadcast grid...');
      const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('✅ WebSocket connection established.');
        delayRef.current = 2000; // Reset reconnect backoff delay
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('✉️ Received WebSocket push packet:', data.type);

          if (data.type === 'SYNC_ALERTS') {
            setAlerts(data.payload);
          } else if (data.type === 'ALERT_BROADCAST') {
            const alert: Alert = data.payload;
            addAlert(alert);

            // Play notification sound based on severity level
            if (alert.severity === 'critical') {
              triggerBeepNode(880, 0.45, isAudioMuted);
            } else if (alert.severity === 'warning') {
              triggerBeepNode(580, 0.25, isAudioMuted);
            } else {
              triggerBeepNode(440, 0.15, isAudioMuted);
            }
          }
        } catch (err) {
          console.error('❌ Failed to parse incoming socket data packet:', err);
        }
      };

      socket.onclose = (event) => {
        console.log(`🔌 WebSocket connection closed. Code: ${event.code}. Reconnecting...`);
        scheduleReconnect();
      };

      socket.onerror = (err) => {
        console.error('❌ WebSocket link error:', err);
        socket.close();
      };
    };

    const scheduleReconnect = () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      
      const currentDelay = delayRef.current;
      delayRef.current = Math.min(delayRef.current * 1.5, 30000);
      
      console.log(`🔌 Reconnect scheduled in ${currentDelay}ms`);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, currentDelay);
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [active, addAlert, setAlerts, isAudioMuted]);
}
