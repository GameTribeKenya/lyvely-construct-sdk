import { HttpClient } from './http-client';
import { EventEmitter } from './event-emitter';
import { SessionManager } from './session-manager';
import {
  SDKConfig,
  Session,
  ScoreMetadata,
  ScoreResponse,
  SessionEndResponse,
  LeaderboardOptions,
  LeaderboardResponse,
  SDKEventType,
  EventCallback,
  SDKError,
  SDKErrorType
} from './types';

/**
 * Lyvely Game SDK - Main class for integrating games with the Lyvely platform
 */
export class LyvelySDK {
  private config: Required<SDKConfig>;
  private httpClient: HttpClient;
  private eventEmitter: EventEmitter;
  private sessionManager: SessionManager;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Create a new Lyvely SDK instance
   */
  constructor(config: SDKConfig) {
    // Set default configuration
    this.config = {
      gameId: config.gameId,
      apiKey: config.apiKey,
      apiBaseUrl: config.apiBaseUrl || 'https://api.lyvely.com',
      environment: config.environment || 'production',
      debug: config.debug || false,
      heartbeatInterval: config.heartbeatInterval || 60000, // 60 seconds
      sessionTimeout: config.sessionTimeout || 300000 // 5 minutes
    };

    // Validate required config
    if (!this.config.gameId) {
      throw new Error('Lyvely SDK: gameId is required');
    }

    if (!this.config.apiKey) {
      throw new Error('Lyvely SDK: apiKey is required');
    }

    if (!this.config.apiKey.startsWith('pk_')) {
      console.warn('Lyvely SDK: apiKey should be a publishable key (pk_live_* or pk_test_*)');
    }

    // Initialize components
    this.eventEmitter = new EventEmitter();
    this.httpClient = new HttpClient(
      this.config.apiBaseUrl,
      this.config.apiKey,
      this.config.debug
    );
    this.sessionManager = new SessionManager(
      this.httpClient,
      this.eventEmitter,
      this.config.heartbeatInterval,
      this.config.debug
    );

    if (this.config.debug) {
      console.log('[Lyvely SDK] Initialized with config:', {
        gameId: this.config.gameId,
        environment: this.config.environment,
        apiBaseUrl: this.config.apiBaseUrl
      });
    }
  }

  /**
   * Initialize the SDK (validates connection and configuration)
   */
  public async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    try {
      // Validate API connection by fetching game info
      await this.httpClient.get(`/api/v1/games/${this.config.gameId}`);

      this.isInitialized = true;
      this.eventEmitter.emit('ready');

      if (this.config.debug) {
        console.log('[Lyvely SDK] Ready');
      }

    } catch (error) {
      const sdkError = error instanceof SDKError
        ? error
        : new SDKError(
            SDKErrorType.UNKNOWN_ERROR,
            'Failed to initialize SDK',
            undefined,
            error
          );

      this.eventEmitter.emit('error', sdkError);
      throw sdkError;
    }
  }

  /**
   * Returns a promise that resolves when the SDK is ready
   */
  public async ready(): Promise<void> {
    return this.init();
  }

  /**
   * Start a new game session
   */
  public async startSession(userId?: string, metadata?: Record<string, any>): Promise<Session> {
    await this.ensureInitialized();

    // Generate a default user ID if not provided
    const effectiveUserId = userId || this.getOrCreateAnonymousUserId();

    return this.sessionManager.startSession(effectiveUserId, {
      ...metadata,
      gameId: this.config.gameId
    });
  }

  /**
   * Submit score to the current session
   */
  public async submitScore(score: number, metadata?: ScoreMetadata): Promise<ScoreResponse> {
    await this.ensureInitialized();

    const session = this.sessionManager.getSession();
    if (!session) {
      throw new SDKError(
        SDKErrorType.VALIDATION_ERROR,
        'No active session. Call startSession() first.'
      );
    }

    try {
      const response = await this.httpClient.post<ScoreResponse>(
        `/api/v1/sessions/${session.sessionId}/score`,
        {
          score,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString()
          }
        }
      );

      this.eventEmitter.emit('scoreSubmitted', {
        score,
        rank: response.rank,
        isNewHighScore: response.isNewHighScore
      });

      if (this.config.debug) {
        console.log('[Lyvely SDK] Score submitted:', score, 'Rank:', response.rank);
      }

      return response;

    } catch (error) {
      if (error instanceof SDKError) {
        this.eventEmitter.emit('error', error);
        throw error;
      }

      const sdkError = new SDKError(
        SDKErrorType.UNKNOWN_ERROR,
        'Failed to submit score',
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
    await this.ensureInitialized();
    return this.sessionManager.endSession(finalScore, metadata);
  }

  /**
   * Get leaderboard data
   */
  public async getLeaderboard(options?: LeaderboardOptions): Promise<LeaderboardResponse> {
    await this.ensureInitialized();

    const params = new URLSearchParams();
    if (options?.period) params.append('period', options.period);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const endpoint = `/api/v1/leaderboards/${this.config.gameId}${queryString ? '?' + queryString : ''}`;

    try {
      const response = await this.httpClient.get<LeaderboardResponse>(endpoint);

      if (this.config.debug) {
        console.log('[Lyvely SDK] Leaderboard fetched:', response.entries.length, 'entries');
      }

      return response;

    } catch (error) {
      if (error instanceof SDKError) {
        this.eventEmitter.emit('error', error);
        throw error;
      }

      const sdkError = new SDKError(
        SDKErrorType.UNKNOWN_ERROR,
        'Failed to fetch leaderboard',
        undefined,
        error
      );
      this.eventEmitter.emit('error', sdkError);
      throw sdkError;
    }
  }

  /**
   * Get the current active session
   */
  public getSession(): Session | null {
    return this.sessionManager.getSession();
  }

  /**
   * Check if there's an active session
   */
  public hasActiveSession(): boolean {
    return this.sessionManager.hasActiveSession();
  }

  /**
   * Register an event listener
   */
  public on(event: SDKEventType, callback: EventCallback): void {
    this.eventEmitter.on(event, callback);
  }

  /**
   * Remove an event listener
   */
  public off(event: SDKEventType, callback: EventCallback): void {
    this.eventEmitter.off(event, callback);
  }

  /**
   * Get SDK version
   */
  public getVersion(): string {
    return '0.1.0';
  }

  /**
   * Get SDK configuration (excluding sensitive data)
   */
  public getConfig(): Partial<SDKConfig> {
    return {
      gameId: this.config.gameId,
      apiBaseUrl: this.config.apiBaseUrl,
      environment: this.config.environment,
      debug: this.config.debug
    };
  }

  /**
   * Destroy the SDK instance and clean up resources
   */
  public destroy(): void {
    this.sessionManager.destroy();
    this.eventEmitter.removeAllListeners();
    this.isInitialized = false;
    this.initPromise = null;

    if (this.config.debug) {
      console.log('[Lyvely SDK] Destroyed');
    }
  }

  /**
   * Ensure SDK is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  /**
   * Get or create an anonymous user ID
   */
  private getOrCreateAnonymousUserId(): string {
    const storageKey = `lyvely_user_${this.config.gameId}`;

    if (typeof localStorage !== 'undefined') {
      let userId = localStorage.getItem(storageKey);
      if (!userId) {
        userId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem(storageKey, userId);
      }
      return userId;
    }

    // Fallback if localStorage not available
    return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
