import { LedgerEvent } from '../../shared/types';
import { messageBus } from '../bus/messageBus';

export class HiveEventLedger {
  private ledger: LedgerEvent[] = [];
  private maxLedgerSize = 2000;

  constructor() {
    this.subscribeToMessageBus();
  }

  /**
   * Listen to all bus events and persist significant events to causal ledger
   */
  private subscribeToMessageBus() {
    messageBus.subscribe((evt) => {
      this.recordEvent({
        traceId: evt.payload?.traceId as string || `trace-${evt.id}`,
        missionId: evt.missionId,
        taskId: evt.taskId,
        agentId: evt.agentId || evt.source,
        eventType: evt.type,
        payload: evt.payload || {},
        causalParentId: evt.payload?.causalParentId as string,
      });
    });
  }

  /**
   * Explicitly record a ledger event
   */
  public recordEvent(params: {
    traceId?: string;
    missionId?: string;
    goalId?: string;
    taskId?: string;
    agentId?: string;
    eventType: string;
    payload?: Record<string, unknown>;
    causalParentId?: string;
  }): LedgerEvent {
    const eventId = `led-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const traceId = params.traceId || `trace-${Date.now()}`;

    const event: LedgerEvent = {
      eventId,
      timestamp: new Date().toISOString(),
      traceId,
      missionId: params.missionId,
      goalId: params.goalId,
      taskId: params.taskId,
      agentId: params.agentId,
      eventType: params.eventType,
      payload: params.payload || {},
      causalParentId: params.causalParentId,
    };

    this.ledger.unshift(event);
    if (this.ledger.length > this.maxLedgerSize) {
      this.ledger = this.ledger.slice(0, this.maxLedgerSize);
    }

    return event;
  }

  /**
   * Query ledger with multi-attribute filtering
   */
  public queryLedger(filter?: {
    missionId?: string;
    agentId?: string;
    eventType?: string;
    traceId?: string;
    limit?: number;
  }): LedgerEvent[] {
    let result = [...this.ledger];

    if (filter) {
      if (filter.missionId) result = result.filter((e) => e.missionId === filter.missionId);
      if (filter.agentId) result = result.filter((e) => e.agentId === filter.agentId);
      if (filter.eventType) result = result.filter((e) => e.eventType === filter.eventType);
      if (filter.traceId) result = result.filter((e) => e.traceId === filter.traceId);
      if (filter.limit && filter.limit > 0) result = result.slice(0, filter.limit);
    }

    return result;
  }

  /**
   * Reconstruct full causal execution trace by trace ID
   */
  public getTrace(traceId: string): LedgerEvent[] {
    return this.ledger
      .filter((e) => e.traceId === traceId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public getAllEvents(): LedgerEvent[] {
    return [...this.ledger];
  }
}

export const hiveEventLedger = new HiveEventLedger();
