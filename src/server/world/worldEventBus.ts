import { WorldEvent } from './worldIntegrationTypes';
import { messageBus } from '../bus/messageBus';

export class WorldEventBus {
  private subscriptions: Map<string, Set<{ hiveId?: string; agentId?: string; callback: (evt: WorldEvent) => void }>> = new Map();
  private eventHistory: WorldEvent[] = [];

  constructor() {
    // Standard setup
  }

  /**
   * Ingests an external event from Hermes Web and routes it intelligently.
   */
  public ingestEvent(evt: WorldEvent): void {
    this.eventHistory.unshift(evt);
    if (this.eventHistory.length > 500) {
      this.eventHistory = this.eventHistory.slice(0, 500);
    }

    messageBus.publish('WORLD_EVENT_INGESTED', 'WorldEventBus', {
      eventId: evt.eventId,
      eventType: evt.eventType,
      source: evt.source,
    }, { severity: 'info' });

    // Intelligently route the event
    const categorySubs = this.subscriptions.get(evt.eventType) || new Set();
    const wildCardSubs = this.subscriptions.get('*') || new Set();

    const allMatchedSubs = new Set([...categorySubs, ...wildCardSubs]);

    allMatchedSubs.forEach((sub) => {
      // Filter subscriptions based on target parameters if specified
      if (evt.targetHives && sub.hiveId && !evt.targetHives.includes(sub.hiveId)) {
        return; // Skip: not targeted for this Hive
      }
      if (evt.targetAgents && sub.agentId && !evt.targetAgents.includes(sub.agentId)) {
        return; // Skip: not targeted for this Agent
      }

      try {
        sub.callback(evt);
      } catch (err) {
        console.error(`Error routing world event ${evt.eventId} in subscription callback:`, err);
      }
    });
  }

  /**
   * Subscribes a Hive or Agent to specific external event types.
   */
  public subscribe(
    eventType: string,
    callback: (evt: WorldEvent) => void,
    options?: { hiveId?: string; agentId?: string }
  ): string {
    const set = this.subscriptions.get(eventType) || new Set();
    const subscription = {
      hiveId: options?.hiveId,
      agentId: options?.agentId,
      callback,
    };
    set.add(subscription);
    this.subscriptions.set(eventType, set);

    return `${eventType}:${options?.hiveId || 'global'}:${options?.agentId || 'global'}`;
  }

  /**
   * Unsubscribes from events.
   */
  public unsubscribe(eventType: string, callback: (evt: WorldEvent) => void): void {
    const set = this.subscriptions.get(eventType);
    if (set) {
      for (const item of set) {
        if (item.callback === callback) {
          set.delete(item);
          break;
        }
      }
    }
  }

  public getHistory(limit: number = 100): WorldEvent[] {
    return this.eventHistory.slice(0, limit);
  }
}

export const worldEventBus = new WorldEventBus();
