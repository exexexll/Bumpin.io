/**
 * Background Queue Manager
 * Handles staying in matchmaking queue across pages
 * with idle detection and visibility monitoring
 */

import { Socket } from 'socket.io-client';

class BackgroundQueueManager {
  private socket: Socket | null = null;
  private inQueue = false;
  private lastActivity = Date.now();
  private visibilityCheckInterval: NodeJS.Timeout | null = null;
  private activityListeners: Array<{ event: string; handler: () => void }> = [];
  private tabHiddenTime: number | null = null;
  private tabHiddenTimeout: NodeJS.Timeout | null = null;
  private readonly TAB_HIDDEN_GRACE_PERIOD = 60 * 1000; // 1 minute
  
  init(socket: Socket) {
    this.socket = socket;
    this.setupVisibilityDetection();
    this.setupActivityDetection();
    console.log('[BackgroundQueue] Initialized');
  }
  
  private setupVisibilityDetection() {
    // Check if tab is visible
    const handleVisibility = () => {
      if (document.hidden && this.inQueue) {
        // Start 1-minute countdown
        this.tabHiddenTime = Date.now();
        console.log('[BackgroundQueue] Tab hidden, starting 1-minute grace period...');
        
        this.tabHiddenTimeout = setTimeout(() => {
          if (document.hidden && this.inQueue) {
            console.log('[BackgroundQueue] Tab hidden for 1 minute, leaving queue');
            this.leaveQueue();
          }
        }, this.TAB_HIDDEN_GRACE_PERIOD);
      } else if (!document.hidden) {
        // Tab visible again, cancel countdown
        if (this.tabHiddenTimeout) {
          clearTimeout(this.tabHiddenTimeout);
          this.tabHiddenTimeout = null;
          this.tabHiddenTime = null;
          console.log('[BackgroundQueue] Tab visible again, grace period cancelled');
        }
      }
    };
    
    // Check if window is focused
    const handleBlur = () => {
      if (this.inQueue) {
        // Start 1-minute countdown
        console.log('[BackgroundQueue] Window lost focus, starting 1-minute grace period...');
        
        this.tabHiddenTimeout = setTimeout(() => {
          if (this.inQueue) {
            console.log('[BackgroundQueue] Window unfocused for 1 minute, leaving queue');
            this.leaveQueue();
          }
        }, this.TAB_HIDDEN_GRACE_PERIOD);
      }
    };
    
    const handleFocus = () => {
      // Window focused again, cancel countdown
      if (this.tabHiddenTimeout) {
        clearTimeout(this.tabHiddenTimeout);
        this.tabHiddenTimeout = null;
        this.tabHiddenTime = null;
        console.log('[BackgroundQueue] Window focused again, grace period cancelled');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    this.activityListeners.push(
      { event: 'visibilitychange', handler: handleVisibility },
      { event: 'blur', handler: handleBlur },
      { event: 'focus', handler: handleFocus }
    );
  }
  
  private setupActivityDetection() {
    // Track user activity
    const activity = () => {
      this.lastActivity = Date.now();
    };
    
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, activity);
    });
    
    // Check every 30 seconds for idle users
    this.visibilityCheckInterval = setInterval(() => {
      const idle = Date.now() - this.lastActivity > 5 * 60 * 1000; // 5 minutes
      if (idle && this.inQueue) {
        console.log('[BackgroundQueue] User idle for 5 minutes, leaving queue');
        this.leaveQueue();
      }
    }, 30000);
  }
  
  async joinQueue() {
    if (!this.socket) {
      console.warn('[BackgroundQueue] No socket, cannot join queue');
      return;
    }
    
    // Check if tab is hidden or window not focused
    if (document.hidden) {
      console.log('[BackgroundQueue] Tab hidden, not joining queue');
      return;
    }
    
    // If background queue is disabled, only allow from /main
    if (!this.isBackgroundEnabled()) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/main') {
        console.log('[BackgroundQueue] Background disabled, not on /main, not joining');
        return;
      }
    }
    
    // CRITICAL: Check profile completeness before joining
    const session = typeof window !== 'undefined' ? 
      JSON.parse(localStorage.getItem('bumpin_session') || 'null') : null;
    
    if (session) {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
        const res = await fetch(`${API_BASE}/user/me`, {
          headers: { 'Authorization': `Bearer ${session.sessionToken}` },
        });
        
        if (res.ok) {
          const user = await res.json();
          
          // Check if profile is complete
          if (!user.selfieUrl || !user.videoUrl) {
            console.warn('[BackgroundQueue] Profile incomplete (no photo/video), cannot join queue');
            console.log('[BackgroundQueue] selfieUrl:', !!user.selfieUrl, 'videoUrl:', !!user.videoUrl);
            return; // Don't join queue
          }
          
          console.log('[BackgroundQueue] Profile complete, joining queue');
        } else {
          console.warn('[BackgroundQueue] Failed to check profile, not joining queue');
          return;
        }
      } catch (err) {
        console.error('[BackgroundQueue] Error checking profile:', err);
        return; // Fail safe - don't join if can't verify
      }
    }
    
    console.log('[BackgroundQueue] Joining queue');
    this.socket.emit('queue:join');
    this.inQueue = true;
    this.lastActivity = Date.now(); // Reset activity timer
  }
  
  leaveQueue() {
    if (!this.socket || !this.inQueue) return;
    
    console.log('[BackgroundQueue] Leaving queue');
    this.socket.emit('queue:leave');
    this.inQueue = false;
  }
  
  isBackgroundEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('bumpin_background_queue') === 'true';
  }
  
  isInQueue(): boolean {
    return this.inQueue;
  }
  
  cleanup() {
    console.log('[BackgroundQueue] Cleanup');
    
    // Clear intervals
    if (this.visibilityCheckInterval) {
      clearInterval(this.visibilityCheckInterval);
      this.visibilityCheckInterval = null;
    }
    
    // Clear tab hidden timeout
    if (this.tabHiddenTimeout) {
      clearTimeout(this.tabHiddenTimeout);
      this.tabHiddenTimeout = null;
    }
    
    // Leave queue
    this.leaveQueue();
    
    // Remove event listeners
    this.activityListeners.forEach(({ event, handler }) => {
      if (event === 'visibilitychange') {
        document.removeEventListener(event, handler);
      } else {
        window.removeEventListener(event, handler);
      }
    });
    this.activityListeners = [];
  }
}

// Singleton instance
export const backgroundQueue = new BackgroundQueueManager();

