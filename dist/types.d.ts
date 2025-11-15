export interface SDKConfig {
    gameId: string;
    apiKey: string;
    apiBaseUrl?: string;
    environment?: 'production' | 'sandbox';
    debug?: boolean;
    heartbeatInterval?: number;
    sessionTimeout?: number;
}
export interface UserStats {
    highScore: number;
    highScoreRank: number | null;
    totalPlays: number;
    lastPlayedAt: string | null;
}
export interface Session {
    sessionId: string;
    gameId: string;
    userId: string;
    token: string;
    startedAt: string;
    expiresAt: string;
    heartbeatInterval: number;
    user?: UserStats;
}
export interface ScoreMetadata {
    level?: number;
    duration?: number;
    achievements?: string[];
    signature?: string;
    [key: string]: any;
}
export interface ScoreResponse {
    scoreId: string;
    rank: number;
    totalPlayers: number;
    isNewHighScore: boolean;
    previousBest: number;
    currentScore: number;
}
export interface SessionEndResponse {
    sessionId: string;
    finalScore: number;
    duration: number;
    rank: number;
    personalBest: number;
    isNewRecord: boolean;
    achievements?: string[];
}
export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    avatarUrl?: string;
    score: number;
    duration?: number;
    achievedAt: string;
}
export interface LeaderboardOptions {
    period?: 'daily' | 'weekly' | 'all';
    limit?: number;
    offset?: number;
}
export interface LeaderboardResponse {
    gameId: string;
    period: string;
    updatedAt: string;
    entries: LeaderboardEntry[];
    userEntry?: {
        rank: number;
        score: number;
        percentile: number;
    };
}
export type SDKEventType = 'ready' | 'sessionStart' | 'sessionEnd' | 'sessionExpired' | 'scoreSubmitted' | 'heartbeat' | 'error';
export type EventCallback = (data?: any) => void;
export declare enum SDKErrorType {
    NETWORK_ERROR = "NETWORK_ERROR",
    AUTH_ERROR = "AUTH_ERROR",
    SESSION_EXPIRED = "SESSION_EXPIRED",
    RATE_LIMITED = "RATE_LIMITED",
    INVALID_SCORE = "INVALID_SCORE",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export declare class SDKError extends Error {
    type: SDKErrorType;
    statusCode?: number;
    details?: any;
    constructor(type: SDKErrorType, message: string, statusCode?: number, details?: any);
}
//# sourceMappingURL=types.d.ts.map