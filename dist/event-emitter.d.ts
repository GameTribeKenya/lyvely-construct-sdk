import { SDKEventType, EventCallback } from './types';
export declare class EventEmitter {
    private listeners;
    constructor();
    on(event: SDKEventType, callback: EventCallback): void;
    off(event: SDKEventType, callback: EventCallback): void;
    emit(event: SDKEventType, data?: any): void;
    removeAllListeners(event?: SDKEventType): void;
}
//# sourceMappingURL=event-emitter.d.ts.map