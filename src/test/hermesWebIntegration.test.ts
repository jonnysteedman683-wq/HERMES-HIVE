import { describe, it, expect } from 'vitest';
import { webCapabilityClient } from '../server/hermes/webCapabilityClient';
import { capabilityRegistry } from '../server/web/capabilityRegistry';
import { policyAndAuthorizationEngine } from '../server/web/policyAndAuthorizationEngine';
import { hermesWebEngine } from '../server/web/hermesWebEngine';
import { auditLogger } from '../server/web/auditLogger';

describe('Hermes Hive ↔ Hermes Web Capability Protocol Integration', () => {
  it('Test 1: Capability Discovery', async () => {
    const capabilities = await webCapabilityClient.discoverCapabilities();
    expect(capabilities.length).toBeGreaterThanOrEqual(5);
  });

  it('Test 2: SIMULATE Mode Execution (Non-mutating Dry Run)', async () => {
    const simRes = await webCapabilityClient.simulateCapability(
      'agent_alpha',
      'Researcher Agent Alpha',
      'web.search',
      'search',
      { query: 'Hermes Hive Protocol Integration' },
      'trace_test_001'
    );

    expect(simRes.status).toBe('REQUEST_SUCCESS');
    expect(simRes.executionStatus).toBe('SIMULATED');
  });

  it('Test 3: LIVE Execution of an unbound provider is rejected with EXECUTION_ERROR', async () => {
    // The web.search connector is not bound to a real search provider
    // (connectorRuntime throws 'web.search is not yet bound to a real search
    // provider'), so live EXECUTE fails by design until a provider is wired.
    // This pins the actual routing contract; SIMULATE mode (Test 2) is the
    // supported non-mutating path.
    const liveRes = await webCapabilityClient.executeCapability(
      'agent_beta',
      'Analyst Agent Beta',
      'web.search',
      'search',
      { query: 'Hermes Web Capability Fabric', maxResults: 3 },
      'EXECUTE',
      'idempotent_key_101',
      'trace_test_002'
    );

    expect(liveRes.status).toBe('FAILED');
    expect(liveRes.executionStatus).toBe('FAILED');
    expect(liveRes.error?.code).toBe('EXECUTION_ERROR');
  });

  it('Test 4: Idempotency — same key + SIMULATE returns the cached execution', async () => {
    // Idempotency is recorded only on successful executions (SIMULATE or a
    // working connector). Live EXECUTE fails before recording, so exercise
    // the idempotency contract through SIMULATE mode with an explicit key.
    const first = await webCapabilityClient.executeCapability(
      'agent_alpha',
      'Researcher Agent Alpha',
      'web.search',
      'search',
      { query: 'Hermes Hive Protocol Integration' },
      'SIMULATE',
      'idem_key_101',
      'trace_idem_101'
    );
    const second = await webCapabilityClient.executeCapability(
      'agent_alpha',
      'Researcher Agent Alpha',
      'web.search',
      'search',
      { query: 'Hermes Hive Protocol Integration' },
      'SIMULATE',
      'idem_key_101',
      'trace_idem_101'
    );

    expect(first.status).toBe('REQUEST_SUCCESS');
    expect(first.executionId).toBe(second.executionId);
  });

  it('Test 5: High Risk Policy Governance & Approval Flow', async () => {
    const highRiskRes = await webCapabilityClient.executeCapability(
      'agent_gamma',
      'Developer Agent Gamma',
      'web.repository_write',
      'write_file',
      { filePath: 'src/shared/config.ts', content: 'export const CONFIG = {};' },
      'EXECUTE',
      undefined,
      'trace_test_003'
    );

    expect(highRiskRes.status).toBe('APPROVAL_REQUIRED');

    const approvalId = highRiskRes.policyDecision?.approvalId;
    expect(approvalId).toBeDefined();

    // Resolve Approval
    const approvalResolved = hermesWebEngine.resolveApproval(approvalId, true, 'Test Executive Operator');
    expect(approvalResolved?.status).toBe('APPROVED');
  });

  it('Test 6: Audit Ledger & Trace Correlation', async () => {
    const logs = auditLogger.getLogs(10, { traceId: 'trace_test_002' });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('Supporting engines are available', () => {
    expect(capabilityRegistry).toBeDefined();
    expect(policyAndAuthorizationEngine).toBeDefined();
  });
});
