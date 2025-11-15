import { HttpClient } from './http-client';
import { EventEmitter } from './event-emitter';
import { Session, SessionEndResponse } from './types';
export declare class SessionManager {
    private httpClient;
    private eventEmitter;
    private session;
    private heartbeatInterval;
    private heartbeatTimer;
    private debug;
    constructor(httpClient: HttpClient, eventEmitter: EventEmitter, heartbeatInterval: number, debug: boolean);
    startSession(userId: string, metadata?: Record<string, any>): Promise<Session>;
    endSession(finalScore?: number, metadata?: Record<string, any>): Promise<SessionEndResponse | null>;
    getSession(): Session | null;
    hasActiveSession(): boolean;
    private startHeartbeat;
    private stopHeartbeat;
    private pauseHeartbeat;
    private resumeHeartbeat;
    private sendHeartbeat;
    private cleanup;
    destroy(): void;
}
//# sourceMappingURL=session-manager.d.ts.map