/**
 * Configuration options for initializing the Lyvely SDK
 */
export interface SDKConfig {
  /** Unique game identifier from Lyvely developer dashboard */
  gameId: string;

  /** Publishable API key (pk_live_* or pk_test_*) */
  apiKey: string;

  /** Base URL for the Lyvely API */
  apiBaseUrl?: string;

  /** Environment: production or sandbox */
  environment?: 'production' | 'sandbox';

  /** Enable debug logging */
  debug?: boolean;

  /** Heartbeat interval in milliseconds (default: 60000) */
  heartbeatInterval?: number;

  /** Session timeout in milliseconds (default: 300000 - 5 minutes) */
  sessionTimeout?: number;
}

/**
 * User stats for the current game
 */
export interface UserStats {
  /** User's personal best score for this game */
  highScore: number;

  /** Rank of user's high score on leaderboard */
  highScoreRank: number | null;

  /** Total number of times user has played this game */
  totalPlays: number;

  /** Timestamp of last session */
  lastPlayedAt: string | null;
}

/**
 * Session data returned when starting a new game session
 */
export interface Session {
  /** Unique session identifier */
  sessionId: string;

  /** Game ID */
  gameId: string;

  /** User ID */
  userId: string;

  /** JWT token for authenticated requests */
  token: string;

  /** Session start timestamp */
  startedAt: string;

  /** Session expiration timestamp */
  expiresAt: string;

  /** Heartbeat interval in milliseconds */
  heartbeatInterval: number;

  /** User's historical stats for this game (required) */
  user: UserStats;
}

/**
 * Score submission metadata
 */
export interface ScoreMetadata {
  /** Current game level */
  level?: number;

  /** Game duration in seconds */
  duration?: number;

  /** Achievements unlocked */
  achievements?: string[];

  /** HMAC signature for score validation */
  signature?: string;

  /** Additional custom metadata */
  [key: string]: any;
}

/**
 * Response from score submission
 */
export interface ScoreResponse {
  /** Unique score identifier */
  scoreId: string;

  /** Current rank on leaderboard */
  rank: number;

  /** Total number of players */
  totalPlayers: number;

  /** Whether this is a new high score */
  isNewHighScore: boolean;

  /** Previous best score */
  previousBest: number;

  /** Current score */
  currentScore: number;
}

/**
 * Session end response
 */
export interface SessionEndResponse {
  /** Session ID */
  sessionId: string;

  /** Final score */
  finalScore: number;

  /** Session duration in seconds */
  duration: number;

  /** Final rank */
  rank: number;

  /** Personal best score */
  personalBest: number;

  /** Whether this is a new record */
  isNewRecord: boolean;

  /** Achievements unlocked */
  achievements?: string[];
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  /** Player rank */
  rank: number;

  /** User ID */
  userId: string;

  /** Username */
  username: string;

  /** Avatar URL */
  avatarUrl?: string;

  /** Score */
  score: number;

  /** Game duration in seconds */
  duration?: number;

  /** Timestamp when score was achieved */
  achievedAt: string;
}

/**
 * Leaderboard options
 */
export interface LeaderboardOptions {
  /** Time period filter */
  period?: 'daily' | 'weekly' | 'all';

  /** Maximum number of entries to return */
  limit?: number;

  /** Offset for pagination */
  offset?: number;
}

/**
 * Leaderboard response
 */
export interface LeaderboardResponse {
  /** Game ID */
  gameId: string;

  /** Time period */
  period: string;

  /** Timestamp when leaderboard was last updated */
  updatedAt: string;

  /** Leaderboard entries */
  entries: LeaderboardEntry[];

  /** Current user's entry (if available) */
  userEntry?: {
    rank: number;
    score: number;
    percentile: number;
  };
}

/**
 * Event types
 */
export type SDKEventType =
  | 'ready'
  | 'sessionStart'
  | 'sessionEnd'
  | 'sessionExpired'
  | 'scoreSubmitted'
  | 'heartbeat'
  | 'error';

/**
 * Event callback function
 */
export type EventCallback = (data?: any) => void;

/**
 * Error types
 */
export enum SDKErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  RATE_LIMITED = 'RATE_LIMITED',
  INVALID_SCORE = 'INVALID_SCORE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * SDK Error class
 */
export class SDKError extends Error {
  public type: SDKErrorType;
  public statusCode?: number;
  public details?: any;

  constructor(type: SDKErrorType, message: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'SDKError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SDKError);
    }
  }
}
