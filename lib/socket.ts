/**
 * Socket.io client utility for WebRTC signaling
 * Production-ready with centralized configuration
 */

import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './config';

let socket: Socket | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;
let isConnecting = false; // CRITICAL: Prevent race conditions

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
  // CRITICAL: Prevent race conditions - if already connecting, wait and return existing
  if (isConnecting && socket) {
    console.log('[Socket] Already connecting, waiting for existing connection...');
    return socket;
  }
  
  // Reuse existing socket if it's connected
  if (socket && socket.connected) {
    console.log('[Socket] Reusing connected socket:', socket.id);
    return socket;
  }
  
  // Socket exists but is disconnected - only clean up if truly dead
  if (socket) {
    // Check the actual state
    const socketConnected = socket.connected;
    const socketDisconnected = socket.disconnected;
    
    console.log('[Socket] Existing socket state:', { connected: socketConnected, disconnected: socketDisconnected });
    
    // If not clearly disconnected, reuse it (might be connecting)
    if (!socketDisconnected) {
      console.log('[Socket] Socket exists and not disconnected - reusing');
      return socket;
    }
    
    // Truly disconnected - clean up
    console.log('[Socket] Cleaning up truly disconnected socket');
    try {
      socket.removeAllListeners();
      socket.close();
    } catch (e) {
      console.error('[Socket] Error cleaning up socket:', e);
    }
    socket = null;
  }

  console.log('[Socket] Creating new socket connection to:', SOCKET_URL);
  isConnecting = true; // Mark as connecting
  
  // BEST-IN-CLASS: Exponential backoff with jitter
  try {
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
      // Additional resilience options
      forceNew: false, // Reuse connection if possible
      multiplex: true, // Share connection across namespaces
    });
  } catch (error) {
    console.error('[Socket] Error creating socket:', error);
    isConnecting = false;
    throw error;
  }

  socket.on('connect', () => {
    console.log('[Socket] ✅ Connected:', socket?.id);
    isConnecting = false; // Clear connecting flag
    
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
        } else {
          // Socket disconnected during heartbeat - clear interval
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
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
  
  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
    isConnecting = false; // Clear connecting flag on error
  });
  
  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`[Socket] 🔄 Reconnection attempt #${attemptNumber}`);
  });
  
  socket.on('reconnect_failed', () => {
    console.error('[Socket] ❌ Reconnection failed after all attempts');
    isConnecting = false;
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
    isConnecting = false; // Clear connecting flag
    
    // Stop heartbeat
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
      console.log('[Socket] Heartbeat stopped');
    }
    
    // Log disconnect reason for debugging
    if (reason === 'io server disconnect') {
      console.warn('[Socket] Server initiated disconnect - check server health');
    } else if (reason === 'transport close') {
      console.warn('[Socket] Transport closed - network issue or server restart');
    }
  });

  return socket;
}

export function disconnectSocket() {
  console.log('[Socket] ⚠️ disconnectSocket() called - this should only be called on app shutdown');
  
  if (socket) {
    // BEST-IN-CLASS: Clean up network change listener
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection && (socket as any)._networkChangeHandler) {
      connection.removeEventListener('change', (socket as any)._networkChangeHandler);
      console.log('[Socket] Network change listener removed');
    }
    
    // Use close() instead of disconnect() to be more graceful
    try {
      socket.removeAllListeners(); // Remove all listeners first
      socket.close(); // Gracefully close
    } catch (e) {
      console.error('[Socket] Error during disconnect:', e);
    }
    socket = null;
  }
  
  // Clean up heartbeat
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  
  // Clear flags
  isConnecting = false;
  
  console.log('[Socket] ✅ Socket fully disconnected and cleaned up');
}

export function getSocket(): Socket | null {
  return socket;
}

