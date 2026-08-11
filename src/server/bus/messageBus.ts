import { HiveEvent, HiveEventType } from '../../shared/types';

/**
 * Filter rules for subscribing or querying events on the Message Bus
 */
export interface BusFilter {
  type?: HiveEventType | HiveEventType[];
  missionId?: string;
  taskId?: string;
  agentId?: string;
  source?: string;
  severity?: 'info' | 'success' | 'warning' | 'error';
  pattern?: string; // Wildcard topic matcher e.g. 'TASK_*', 'AGENT_*', '*'
  customPredicate?: (event: HiveEvent) => boolean;
}

/**
 * Subscription options
 */
export interface SubscriptionOptions {
  filter?: BusFilter;
  replayHistory?: boolean; // Replay past matching events upon subscribing
}

/**
 * Middleware / Interceptor hook for intercepting published events
 */
export type BusMiddleware = (
  event: HiveEvent
) => HiveEvent | null | Promise<HiveEvent | null>;

/**
 * Event Listener function
 */
export type EventListener = (event: HiveEvent) => void | Promise<void>;

/**
 * Dead Letter Queue item
 */
export interface DeadLetterItem {
  id: string;
  event: HiveEvent;
  error: string;
  timestamp: string;
  retryCount: number;
}

/**
 * Message Bus Statistics
 */
export interface MessageBusStats {
  totalPublished: number;
  totalDelivered: number;
  activeSubscribers: number;
  dlqCount: number;
  eventsByType: Record<string, number>;
  uptimeSeconds: number;
}

/**
 * Publish options
 */
export interface PublishOptions {
  missionId?: string;
  taskId?: string;
  agentId?: string;
  severity?: 'info' | 'success' | 'warning' | 'error';
  requireAck?: boolean;
}

/**
 * Robust, strongly-typed internal Message Bus for inter-agent communication,
 * workflow coordination, and system-wide event broadcasting.
 */
class MessageBus {
  private events: HiveEvent[] = [];
  private subscriptions: Set<{ id: string; listener: EventListener; filter?: BusFilter }> = new Set();
  private middlewares: BusMiddleware[] = [];
  private deadLetterQueue: DeadLetterItem[] = [];
  private maxHistory = 1000;
  private startTime = Date.now();

  // Metrics tracking
  private totalPublished = 0;
  private totalDelivered = 0;
  private eventsByType: Record<string, number> = {};

  constructor() {
    this.registerDefaultMiddlewares();
  }

  /**
   * Register default system interceptors (sanitization, metrics, audit)
   */
  private registerDefaultMiddlewares() {
    // 1. Sanitization Middleware (Redact confidential secret tokens in text payloads)
    this.use((event) => {
      if (event.payload && typeof event.payload === 'object') {
        const payloadStr = JSON.stringify(event.payload);
        if (payloadStr.includes('Bearer ') || payloadStr.includes('AIzaSy')) {
          const sanitizedPayload = JSON.parse(
            payloadStr
              .replace(/Bearer\s+[A-Za-z0-9-_=.]+/g, 'Bearer [REDACTED]')
              .replace(/AIzaSy[A-Za-z0-9-_]{33}/g, 'AIzaSy[REDACTED]')
          );
          return { ...event, payload: sanitizedPayload };
        }
      }
      return event;
    });

    // 2. Metrics & Accounting Middleware
    this.use((event) => {
      this.totalPublished++;
      this.eventsByType[event.type] = (this.eventsByType[event.type] || 0) + 1;
      return event;
    });

    // 3. System Audit Log Interceptor
    this.use((event) => {
      if (event.severity === 'error' || event.severity === 'warning') {
        console.log(`[MessageBus Audit] [${event.severity.toUpperCase()}] ${event.type} from ${event.source}:`, event.payload);
      }
      return event;
    });
  }

  /**
   * Register a middleware interceptor into the publish pipeline
   */
  public use(middleware: BusMiddleware): () => void {
    this.middlewares.push(middleware);
    return () => {
      const idx = this.middlewares.indexOf(middleware);
      if (idx !== -1) {
        this.middlewares.splice(idx, 1);
      }
    };
  }

  /**
   * Publish an event to the Message Bus
   */
  public async publishAsync(
    type: HiveEventType,
    source: string,
    payload: Record<string, unknown>,
    options?: PublishOptions
  ): Promise<HiveEvent> {
    let event: HiveEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      timestamp: new Date().toISOString(),
      source,
      missionId: options?.missionId,
      taskId: options?.taskId,
      agentId: options?.agentId,
      severity: options?.severity || 'info',
      payload,
    };

    // Execute middleware chain sequentially
    for (const middleware of this.middlewares) {
      try {
        const result = await middleware(event);
        if (!result) {
          // Event suppressed by middleware
          return event;
        }
        event = result;
      } catch (err) {
        console.error('[MessageBus] Error in middleware execution:', err);
      }
    }

    // Save to historical queue
    this.events.unshift(event);
    if (this.events.length > this.maxHistory) {
      this.events = this.events.slice(0, this.maxHistory);
    }

    // Dispatch to matching subscribers
    let matchedListeners = 0;
    const dispatchPromises: Promise<void>[] = [];

    this.subscriptions.forEach((sub) => {
      if (this.matchesFilter(event, sub.filter)) {
        matchedListeners++;
        const p = Promise.resolve().then(async () => {
          try {
            await sub.listener(event);
            this.totalDelivered++;
          } catch (err) {
            console.error(`[MessageBus] Subscriber ${sub.id} failed on event ${event.id}:`, err);
            this.addToDeadLetter(event, err instanceof Error ? err.message : String(err));
          }
        });
        dispatchPromises.push(p);
      }
    });

    // If critical event required acknowledgement but matched no listeners, move to DLQ
    if (options?.requireAck && matchedListeners === 0) {
      this.addToDeadLetter(event, 'No active listeners matched required event');
    }

    // Run subscriber notifications asynchronously to avoid blocking callers
    Promise.allSettled(dispatchPromises).catch(() => {});

    return event;
  }

  /**
   * Synchronous publish signature (maintains full backward compatibility)
   */
  public publish(
    type: HiveEventType,
    source: string,
    payload: Record<string, unknown>,
    options?: PublishOptions
  ): HiveEvent {
    // Invoke publishAsync in background & return event immediately
    const event: HiveEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      timestamp: new Date().toISOString(),
      source,
      missionId: options?.missionId,
      taskId: options?.taskId,
      agentId: options?.agentId,
      severity: options?.severity || 'info',
      payload,
    };

    // Run pipeline asynchronously
    this.publishAsync(type, source, payload, options).catch((err) => {
      console.error('[MessageBus] Error during async event broadcast:', err);
    });

    return event;
  }

  /**
   * Helper for direct agent-to-agent messaging
   */
  public sendAgentMessage(
    senderId: string,
    targetId: string,
    subject: string,
    body: unknown,
    options?: { missionId?: string; taskId?: string }
  ): HiveEvent {
    return this.publish('AGENT_DIRECT_MESSAGE', senderId, {
      senderAgentId: senderId,
      targetAgentId: targetId,
      subject,
      body,
    }, {
      agentId: targetId,
      missionId: options?.missionId,
      taskId: options?.taskId,
      severity: 'info',
    });
  }

  /**
   * Helper for publishing mission state updates
   */
  public publishMissionEvent(
    type: HiveEventType,
    missionId: string,
    payload: Record<string, unknown>,
    severity: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): HiveEvent {
    return this.publish(type, 'MissionEngine', payload, {
      missionId,
      severity,
    });
  }

  /**
   * Helper for publishing task updates
   */
  public publishTaskEvent(
    type: HiveEventType,
    taskId: string,
    missionId: string,
    agentId: string,
    payload: Record<string, unknown>,
    severity: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): HiveEvent {
    return this.publish(type, agentId || 'TaskExecutor', payload, {
      taskId,
      missionId,
      agentId,
      severity,
    });
  }

  /**
   * Helper for broadcasting system-wide alerts
   */
  public publishSystemAlert(
    source: string,
    message: string,
    severity: 'info' | 'warning' | 'error' = 'warning',
    extraDetails?: Record<string, unknown>
  ): HiveEvent {
    return this.publish('SYSTEM_ALERT', source, {
      message,
      ...(extraDetails || {}),
    }, {
      severity,
    });
  }

  /**
   * Main subscription method supporting filters and options
   */
  public subscribe(
    listener: EventListener,
    filterOrOptions?: BusFilter | SubscriptionOptions
  ): () => void {
    const subId = `sub-${Math.random().toString(36).substring(2, 9)}`;
    let filter: BusFilter | undefined;
    let replayHistory = false;

    if (filterOrOptions) {
      if ('replayHistory' in filterOrOptions || 'filter' in filterOrOptions) {
        const opts = filterOrOptions as SubscriptionOptions;
        filter = opts.filter;
        replayHistory = !!opts.replayHistory;
      } else {
        filter = filterOrOptions as BusFilter;
      }
    }

    const subObj = { id: subId, listener, filter };
    this.subscriptions.add(subObj);

    // If requested, replay historical matching events to caller
    if (replayHistory) {
      const history = this.getEvents(filter);
      history.reverse().forEach((evt) => {
        try {
          listener(evt);
        } catch (err) {
          console.error('[MessageBus] Error replaying history to new subscriber:', err);
        }
      });
    }

    return () => {
      this.subscriptions.delete(subObj);
    };
  }

  /**
   * Subscribe strictly to specific event type(s)
   */
  public subscribeToType(
    type: HiveEventType | HiveEventType[],
    listener: EventListener
  ): () => void {
    return this.subscribe(listener, { type });
  }

  /**
   * Subscribe strictly to events for a specific mission
   */
  public subscribeToMission(
    missionId: string,
    listener: EventListener
  ): () => void {
    return this.subscribe(listener, { missionId });
  }

  /**
   * Subscribe strictly to events targeted at or originating from a specific agent
   */
  public subscribeToAgent(
    agentId: string,
    listener: EventListener
  ): () => void {
    return this.subscribe(listener, { agentId });
  }

  /**
   * Subscribe to topic patterns (e.g., 'TASK_*', 'AGENT_*', 'VERIFICATION_*')
   */
  public subscribeToPattern(
    pattern: string,
    listener: EventListener
  ): () => void {
    return this.subscribe(listener, { pattern });
  }

  /**
   * Query historical events with filtering & limiting
   */
  public getEvents(
    filter?: BusFilter & { limit?: number; since?: string; until?: string }
  ): HiveEvent[] {
    let result = [...this.events];

    if (filter) {
      if (filter.since) {
        const sinceTime = new Date(filter.since).getTime();
        result = result.filter((e) => new Date(e.timestamp).getTime() >= sinceTime);
      }
      if (filter.until) {
        const untilTime = new Date(filter.until).getTime();
        result = result.filter((e) => new Date(e.timestamp).getTime() <= untilTime);
      }

      result = result.filter((evt) => this.matchesFilter(evt, filter));

      if (filter.limit && filter.limit > 0) {
        result = result.slice(0, filter.limit);
      }
    }

    return result;
  }

  /**
   * Replay historical events to a given listener
   */
  public replay(listener: EventListener, filter?: BusFilter): number {
    const historical = this.getEvents(filter);
    let replayedCount = 0;
    historical.reverse().forEach((evt) => {
      try {
        listener(evt);
        replayedCount++;
      } catch (err) {
        console.error('[MessageBus] Error replaying event:', err);
      }
    });
    return replayedCount;
  }

  /**
   * Evaluate if an event matches subscriber/query filter criteria
   */
  private matchesFilter(event: HiveEvent, filter?: BusFilter): boolean {
    if (!filter) return true;

    // 1. Type matching
    if (filter.type) {
      if (Array.isArray(filter.type)) {
        if (!filter.type.includes(event.type)) return false;
      } else if (event.type !== filter.type) {
        return false;
      }
    }

    // 2. Pattern matching (wildcards)
    if (filter.pattern && !this.matchPattern(filter.pattern, event.type)) {
      return false;
    }

    // 3. Mission ID matching
    if (filter.missionId && event.missionId !== filter.missionId) {
      return false;
    }

    // 4. Task ID matching
    if (filter.taskId && event.taskId !== filter.taskId) {
      return false;
    }

    // 5. Agent ID matching (matches source, agentId, or payload targetAgentId)
    if (filter.agentId) {
      const targetInPayload = event.payload?.targetAgentId || event.payload?.assigneeAgentId;
      if (
        event.agentId !== filter.agentId &&
        event.source !== filter.agentId &&
        targetInPayload !== filter.agentId
      ) {
        return false;
      }
    }

    // 6. Source matching
    if (filter.source && event.source !== filter.source) {
      return false;
    }

    // 7. Severity matching
    if (filter.severity && event.severity !== filter.severity) {
      return false;
    }

    // 8. Custom predicate
    if (filter.customPredicate && !filter.customPredicate(event)) {
      return false;
    }

    return true;
  }

  /**
   * Pattern wildcard matcher (e.g. 'TASK_*', '*', 'AGENT_*')
   */
  private matchPattern(pattern: string, eventType: string): boolean {
    if (pattern === '*') return true;
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return eventType.startsWith(prefix);
    }
    return pattern === eventType;
  }

  /**
   * Add failed or unhandled event to Dead Letter Queue
   */
  private addToDeadLetter(event: HiveEvent, error: string) {
    this.deadLetterQueue.unshift({
      id: `dlq-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      event,
      error,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    });
    if (this.deadLetterQueue.length > 200) {
      this.deadLetterQueue = this.deadLetterQueue.slice(0, 200);
    }
  }

  /**
   * Retrieve Dead Letter Queue items
   */
  public getDeadLetterQueue(): DeadLetterItem[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Retry a DLQ item by re-publishing it
   */
  public retryDeadLetter(dlqId: string): boolean {
    const itemIdx = this.deadLetterQueue.findIndex((i) => i.id === dlqId);
    if (itemIdx === -1) return false;

    const item = this.deadLetterQueue[itemIdx];
    this.deadLetterQueue.splice(itemIdx, 1);
    item.retryCount++;

    this.publish(
      item.event.type,
      `DLQRetry:${item.event.source}`,
      item.event.payload,
      {
        missionId: item.event.missionId,
        taskId: item.event.taskId,
        agentId: item.event.agentId,
        severity: item.event.severity,
      }
    );

    return true;
  }

  /**
   * Clear Dead Letter Queue
   */
  public clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
  }

  /**
   * Clear event history log
   */
  public clearHistory(): void {
    this.events = [];
  }

  /**
   * Telemetry stats for system monitoring
   */
  public getStats(): MessageBusStats {
    return {
      totalPublished: this.totalPublished,
      totalDelivered: this.totalDelivered,
      activeSubscribers: this.subscriptions.size,
      dlqCount: this.deadLetterQueue.length,
      eventsByType: { ...this.eventsByType },
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}

export const messageBus = new MessageBus();
