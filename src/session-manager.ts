import { HttpClient } from './http-client';
import { EventEmitter } from './event-emitter';
import {
  Session,
  SessionEndResponse,
  SDKError,
  SDKErrorType
} from './types';

/**
 * Manages game session lifecycle and heartbeats
 */
export class SessionManager {
  private httpClient: HttpClient;
  private eventEmitter: EventEmitter;
  private session: Session | null = null;
  private heartbeatInterval: number;
  private heartbeatTimer: number | null = null;
  private debug: boolean;

  constructor(
    httpClient: HttpClient,
    eventEmitter: EventEmitter,
    heartbeatInterval: number,
    debug: boolean
  ) {
    this.httpClient = httpClient;
    this.eventEmitter = eventEmitter;
    this.heartbeatInterval = heartbeatInterval;
    this.debug = debug;

    // Handle page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pauseHeartbeat();
        } else {
          this.resumeHeartbeat();
        }
      });
    }
  }

  /**
   * Start a new game session
   */
  public async startSession(userId: string, metadata?: Record<string, any>): Promise<Session> {
    try {
      if (this.session) {
        if (this.debug) {
          console.warn('[Lyvely SDK] Session already active, ending previous session');
        }
        await this.endSession();
      }

      const response = await this.httpClient.post<Session>('/api/v1/sessions', {
        userId,
        metadata: {
          ...metadata,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          timestamp: new Date().toISOString()
        }
      });

      this.session = response;
      this.httpClient.setToken(response.token);

      // Start heartbeat
      this.startHeartbeat();

      this.eventEmitter.emit('sessionStart', {
        sessionId: response.sessionId,
        userId: response.userId
      });

      if (this.debug) {
        console.log('[Lyvely SDK] Session started:', response.sessionId);
      }

      return response;

    } catch (error) {
      if (error instanceof SDKError) {
        this.eventEmitter.emit('error', error);
        throw error;
      }

      const sdkError = new SDKError(
        SDKErrorType.UNKNOWN_ERROR,
        'Failed to start session',
        undefined,
        error
      );
      this.eventEmitter.emit('error', sdkError);
      throw sdkError;
    }
  }

  /**
   * End the current game session
   */
  public async endSession(finalScore?: number, metadata?: Record<string, any>): Promise<SessionEndResponse | null> {
    if (!this.session) {
      if (this.debug) {
        console.warn('[Lyvely SDK] No active session to end');
      }
      return null;
    }

    try {
      this.stopHeartbeat();

      const response = await this.httpClient.post<SessionEndResponse>(
        `/api/v1/sessions/${this.session.sessionId}/end`,
        {
          finalScore,
          completed: true,
          ...metadata
        }
      );

      this.eventEmitter.emit('sessionEnd', response);

      if (this.debug) {
        console.log('[Lyvely SDK] Session ended:', this.session.sessionId);
      }

      this.cleanup();

      return response;

    } catch (error) {
      this.cleanup();

      if (error instanceof SDKError) {
        this.eventEmitter.emit('error', error);
        throw error;
      }

      const sdkError = new SDKError(
        SDKErrorType.UNKNOWN_ERROR,
        'Failed to end session',
        undefined,
        error
      );
      this.eventEmitter.emit('error', sdkError);
      throw sdkError;
    }
  }

  /**
   * Get the current session
   */
  public getSession(): Session | null {
    return this.session;
  }

  /**
   * Check if there's an active session
   */
  public hasActiveSession(): boolean {
    return this.session !== null;
  }

  /**
   * Start sending heartbeats
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = window.setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatInterval);

    if (this.debug) {
      console.log(`[Lyvely SDK] Heartbeat started (${this.heartbeatInterval}ms interval)`);
    }
  }

  /**
   * Stop sending heartbeats
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;

      if (this.debug) {
        console.log('[Lyvely SDK] Heartbeat stopped');
      }
    }
  }

  /**
   * Pause heartbeat (when tab is hidden)
   */
  private pauseHeartbeat(): void {
    if (this.heartbeatTimer && this.debug) {
      console.log('[Lyvely SDK] Heartbeat paused (tab hidden)');
    }
  }

  /**
   * Resume heartbeat (when tab is visible again)
   */
  private resumeHeartbeat(): void {
    if (this.session && this.debug) {
      console.log('[Lyvely SDK] Heartbeat resumed (tab visible)');
      this.sendHeartbeat(); // Send immediately on resume
    }
  }

  /**
   * Send a heartbeat to keep session alive
   */
  private async sendHeartbeat(): Promise<void> {
    if (!this.session) {
      this.stopHeartbeat();
      return;
    }

    try {
      await this.httpClient.post(
        `/api/v1/sessions/${this.session.sessionId}/heartbeat`,
        {
          timestamp: new Date().toISOString()
        }
      );

      this.eventEmitter.emit('heartbeat', {
        sessionId: this.session.sessionId
      });

      if (this.debug) {
        console.log('[Lyvely SDK] Heartbeat sent');
      }

    } catch (error) {
      if (error instanceof SDKError && error.type === SDKErrorType.SESSION_EXPIRED) {
        if (this.debug) {
          console.error('[Lyvely SDK] Session expired');
        }

        this.stopHeartbeat();
        this.eventEmitter.emit('sessionExpired', {
          sessionId: this.session.sessionId
        });
        this.cleanup();
      } else {
        if (this.debug) {
          console.error('[Lyvely SDK] Heartbeat failed:', error);
        }
        // Continue heartbeats even if one fails
      }
    }
  }

  /**
   * Clean up session state
   */
  private cleanup(): void {
    this.session = null;
    this.httpClient.clearToken();
  }

  /**
   * Destroy the session manager
   */
  public destroy(): void {
    this.stopHeartbeat();
    this.cleanup();
  }
}
