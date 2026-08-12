import { describe, it, expect, vi, afterEach } from 'vitest';
import { capabilityRegistry } from '../server/web/capabilityRegistry';
import { capabilityRouter } from '../server/web/capabilityRouter';
import { policyAndAuthorizationEngine } from '../server/web/policyAndAuthorizationEngine';
import { CapabilityDescriptor, CapabilityRequest } from '../shared/types';

/**
 * Regression suite for the web capability policy path:
 *  - idempotency cache must be scoped by execution mode (a cached SIMULATE
 *    dry-run must never be served for a live EXECUTE with the same key)
 *  - SIMULATE requests bypass the live-execution rate limit ("Simulation is
 *    ALWAYS allowed if capability supports it")
 *  - the rate-limit window rolls over at exactly its expiry instant
 */

function registerProbeCapability(id: string, maxRequestsPerMin: number): void {
  capabilityRegistry.registerCapability({
    id,
    name: `Probe ${id}`,
    version: '1.0.0',
    category: 'web_search',
    description: 'vitest probe capability',
    provider: 'vitest-probe',
    operations: ['ping'],
    inputSchema: {},
    outputSchema: {},
    permissions: ['web_read'],
    riskLevel: 'LOW',
    authenticationRequirements: ['service:hermes-hive'],
    availability: 'online',
    health: 'operational',
    rateLimits: { maxRequestsPerMin, currentMinUsage: 0 },
    supportsSimulation: true,
    supportsCancellation: true,
    supportsVerification: true,
  });
}

function makeRequest(capabilityId: string, executionMode: 'SIMULATE' | 'EXECUTE', idempotencyKey?: string): CapabilityRequest {
  return {
    requestId: `req_${Math.random().toString(36).slice(2, 8)}`,
    correlationId: 'corr_probe',
    traceId: 'trace_probe',
    source: 'hermes-hive',
    agentId: 'agent_probe',
    agentName: 'Probe Agent',
    capabilityId,
    operation: 'ping',
    parameters: {},
    authorizationContext: { serviceIdentity: 'hermes-hive', permissions: ['web_read'] },
    executionMode,
    idempotencyKey,
    timestamp: new Date().toISOString(),
  };
}

describe('Web capability policy & idempotency correctness', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('idempotency: a cached SIMULATE dry-run is never replayed for a live EXECUTE with the same key', async () => {
    const capId = 'web.probe_idem';
    registerProbeCapability(capId, 1000);

    const sim = await capabilityRouter.routeRequest(makeRequest(capId, 'SIMULATE', 'probe_key_1'));
    expect(sim.status).toBe('REQUEST_SUCCESS');
    expect(sim.executionStatus).toBe('SIMULATED');

    // Same idempotency key, but a LIVE execution: must NOT return the cached
    // simulation. The unbound probe connector fails with EXECUTION_ERROR,
    // proving the router actually attempted a real execution instead of
    // serving the stale dry-run.
    const live = await capabilityRouter.routeRequest(makeRequest(capId, 'EXECUTE', 'probe_key_1'));
    expect(live.executionStatus).not.toBe('SIMULATED');
    expect(live.status).toBe('FAILED');
    expect(live.error?.code).toBe('EXECUTION_ERROR');
  });

  it('rate limit: SIMULATE requests bypass the live-execution quota and are always allowed', () => {
    const capId = 'web.probe_ratelimit';
    registerProbeCapability(capId, 2);

    const exec = () => policyAndAuthorizationEngine.evaluateRequest(makeRequest(capId, 'EXECUTE'));
    const sim = () => policyAndAuthorizationEngine.evaluateRequest(makeRequest(capId, 'SIMULATE'));

    expect(exec().decision).toBe('ALLOW');
    expect(exec().decision).toBe('ALLOW');
    expect(exec().decision).toBe('DENY'); // live quota exhausted

    // Simulation must still be allowed with the live quota exhausted, and must
    // not consume the live budget (two back-to-back SIMULATEs both ALLOW).
    expect(sim().decision).toBe('ALLOW');
    expect(sim().decision).toBe('ALLOW');
  });

  it('rate limit: window rolls over at exactly the expiry instant (>= boundary)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const capId = 'web.probe_window';
    registerProbeCapability(capId, 1);

    const exec = () => policyAndAuthorizationEngine.evaluateRequest(makeRequest(capId, 'EXECUTE'));
    expect(exec().decision).toBe('ALLOW'); // count=1, windowResetTime = T0 + 60000

    // Just inside the window: still denied.
    vi.setSystemTime(new Date('2026-01-01T00:00:59.999Z'));
    expect(exec().decision).toBe('DENY');

    // Exactly at the expiry instant: the window must roll over -> allowed.
    vi.setSystemTime(new Date('2026-01-01T00:01:00.000Z'));
    expect(exec().decision).toBe('ALLOW');
  });
});
