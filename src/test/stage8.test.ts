import { describe, it, expect } from 'vitest';
import { worldEventBus } from '../server/world/worldEventBus';
import { WorldEvent } from '../server/world/worldIntegrationTypes';

describe('Stage 8 — World Event Routing', () => {
  it('Scenario 6: Intelligent Event Routing — subscribed hive receives event with payload', () => {
    let eventTriggered = false;
    let receivedPayload: WorldEvent['payload'] | null = null;

    worldEventBus.subscribe('API_RATE_LIMIT_EXCEEDED', (evt) => {
      eventTriggered = true;
      receivedPayload = evt.payload;
    }, { hiveId: 'Hive-Alpha-Executive' });

    worldEventBus.ingestEvent({
      eventId: 'evt-rate-limit-001',
      eventType: 'API_RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString(),
      source: 'hermes-web',
      payload: { service: 'web.search' },
      targetHives: ['Hive-Alpha-Executive'],
    });

    expect(eventTriggered).toBe(true);
    expect(receivedPayload).toEqual({ service: 'web.search' });
  });

  it('Scenario 6b: Non-targeted hive is skipped', () => {
    let triggered = false;

    worldEventBus.subscribe('API_RATE_LIMIT_EXCEEDED', () => {
      triggered = true;
    }, { hiveId: 'Hive-Beta-Other' });

    worldEventBus.ingestEvent({
      eventId: 'evt-rate-limit-002',
      eventType: 'API_RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString(),
      source: 'hermes-web',
      payload: { service: 'web.search' },
      targetHives: ['Hive-Alpha-Executive'],
    });

    expect(triggered).toBe(false);
  });

  it('Scenario 6c: Wildcard subscription receives all event types', () => {
    let wildcardCount = 0;

    worldEventBus.subscribe('*', () => {
      wildcardCount += 1;
    });

    worldEventBus.ingestEvent({
      eventId: 'evt-wildcard-001',
      eventType: 'SOME_OTHER_EVENT',
      timestamp: new Date().toISOString(),
      source: 'test',
      payload: {},
    });

    expect(wildcardCount).toBeGreaterThan(0);
  });
});
