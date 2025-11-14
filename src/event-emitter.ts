import { SDKEventType, EventCallback } from './types';

/**
 * Simple event emitter for SDK events
 */
export class EventEmitter {
  private listeners: Map<SDKEventType, Set<EventCallback>>;

  constructor() {
    this.listeners = new Map();
  }

  /**
   * Register an event listener
   */
  public on(event: SDKEventType, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove an event listener
   */
  public off(event: SDKEventType, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit an event to all registered listeners
   */
  public emit(event: SDKEventType, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[Lyvely SDK] Error in ${event} event handler:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event
   */
  public removeAllListeners(event?: SDKEventType): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
