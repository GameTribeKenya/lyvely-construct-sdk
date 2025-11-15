import { SDKConfig, Session, ScoreMetadata, ScoreResponse, SessionEndResponse, LeaderboardOptions, LeaderboardResponse, SDKEventType, EventCallback } from './types';
export declare class LyvelySDK {
    private config;
    private httpClient;
    private eventEmitter;
    private sessionManager;
    private isInitialized;
    private initPromise;
    constructor(config: SDKConfig);
    init(): Promise<void>;
    private _init;
    ready(): Promise<void>;
    startSession(userId?: string, metadata?: Record<string, any>): Promise<Session>;
    submitScore(score: number, metadata?: ScoreMetadata): Promise<ScoreResponse>;
    endSession(finalScore?: number, metadata?: Record<string, any>): Promise<SessionEndResponse | null>;
    getLeaderboard(options?: LeaderboardOptions): Promise<LeaderboardResponse>;
    getSession(): Session | null;
    hasActiveSession(): boolean;
    on(event: SDKEventType, callback: EventCallback): void;
    off(event: SDKEventType, callback: EventCallback): void;
    getVersion(): string;
    getConfig(): Partial<SDKConfig>;
    destroy(): void;
    private ensureInitialized;
    private getOrCreateAnonymousUserId;
}
//# sourceMappingURL=lyvely-sdk.d.ts.map