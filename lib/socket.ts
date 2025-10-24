/**
 * Socket.io client utility for WebRTC signaling
 * Production-ready with centralized configuration
 */

import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './config';

let socket: Socket | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

// BEST-IN-CLASS: Adaptive heartbeat based on network type
function getHeartbeatInterval(): number {
  // Check if Network Information API is available
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  if (!connection) {
    return 25000; // Default 25s
  }
  
  const type = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
  
  // Adapt heartbeat based on network speed
  if (type === '4g' || !type) return 25000; // 25s for fast networks
  if (type === '3g') return 30000; // 30s for medium networks
  if (type === '2g') return 40000; // 40s for slow networks
  return 45000; // 45s for very slow networks
}

export function connectSocket(sessionToken: string): Socket {
  // Reuse existing socket if it's connected OR connecting
  if (socket) {
    if (socket.connected) {
      console.log('[Socket] Reusing connected socket:', socket.id);
      return socket;
    }
    
    // Check if it's in the process of connecting
    const isConnecting = !socket.connected && !socket.disconnected;
    if (isConnecting) {
      console.log('[Socket] Reusing socket that is connecting...');
      return socket;
    }
    
    // Socket exists but is disconnected - clean it up first
    console.log('[Socket] Cleaning up disconnected socket');
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  console.log('[Socket] Creating new socket connection to:', SOCKET_URL);
  
  // BEST-IN-CLASS: Exponential backoff with jitter
  socket = io(SOCKET_URL, {
    autoConnect: true,
    auth: {
      token: sessionToken, // Send token in handshake for middleware authentication
    },
    transports: ['websocket', 'polling'], // WebSocket preferred, polling fallback
    reconnection: true,
    reconnectionAttempts: Infinity, // Keep trying indefinitely (production best practice)
    reconnectionDelay: 1000, // Start at 1s
    reconnectionDelayMax: 30000, // Cap at 30s
    randomizationFactor: 0.5, // Add jitter: delay = base * (1 + random * 0.5)
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
    // Still emit auth for backward compatibility with event handlers
    socket?.emit('auth', { sessionToken });
    
    // BEST-IN-CLASS: Start adaptive heartbeat based on network type
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    
    const startAdaptiveHeartbeat = () => {
      const interval = getHeartbeatInterval();
      console.log('[Socket] Starting adaptive heartbeat (every', interval / 1000, 's)');
      
      heartbeatInterval = setInterval(() => {
        if (socket?.connected) {
          socket.emit('heartbeat', { timestamp: Date.now() });
          console.log('[Socket] 💓 Heartbeat sent');
        }
      }, interval);
    };
    
    startAdaptiveHeartbeat();
    
    // BEST-IN-CLASS: Adjust heartbeat on network change
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      const handleNetworkChange = () => {
        console.log('[Socket] Network changed - adjusting heartbeat interval');
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
        startAdaptiveHeartbeat();
      };
      
      connection.addEventListener('change', handleNetworkChange);
      
      // Store reference for cleanup
      (socket as any)._networkChangeHandler = handleNetworkChange;
    }
  });

  socket.on('auth:success', () => {
    console.log('[Socket] ✅ Authenticated successfully');
  });

  socket.on('auth:failed', () => {
    console.error('[Socket] ❌ Authentication failed - check session token validity');
    console.error('[Socket] Session token:', sessionToken?.substring(0, 8) + '...');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    
    // Stop heartbeat
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
      console.log('[Socket] Heartbeat stopped');
    }
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    // BEST-IN-CLASS: Clean up network change listener
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection && (socket as any)._networkChangeHandler) {
      connection.removeEventListener('change', (socket as any)._networkChangeHandler);
      console.log('[Socket] Network change listener removed');
    }
    
    socket.disconnect();
    socket = null;
  }
  
  // Clean up heartbeat
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

