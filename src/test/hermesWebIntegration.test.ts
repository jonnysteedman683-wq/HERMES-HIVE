import { webCapabilityClient } from '../server/hermes/webCapabilityClient';
import { capabilityRegistry } from '../server/web/capabilityRegistry';
import { policyAndAuthorizationEngine } from '../server/web/policyAndAuthorizationEngine';
import { hermesWebEngine } from '../server/web/hermesWebEngine';
import { auditLogger } from '../server/web/auditLogger';

export async function runHermesWebProtocolTests() {
  console.log('=== STARTING HERMES HIVE ↔ HERMES WEB CAPABILITY PROTOCOL INTEGRATION TESTS ===');

  // Test 1: Capability Discovery
  const capabilities = await webCapabilityClient.discoverCapabilities();
  console.log(`[PASS] Test 1: Capability Discovery returned ${capabilities.length} capabilities.`);
  if (capabilities.length < 5) {
    throw new Error('Test 1 Failed: Expected at least 5 registered web capabilities.');
  }

  // Test 2: SIMULATE Mode Execution (Non-mutating Dry Run)
  const simRes = await webCapabilityClient.simulateCapability(
    'agent_alpha',
    'Researcher Agent Alpha',
    'web.search',
    'search',
    { query: 'Hermes Hive Protocol Integration' },
    'trace_test_001'
  );

  console.log(`[PASS] Test 2: SIMULATE mode status=${simRes.status}, executionStatus=${simRes.executionStatus}`);
  if (simRes.status !== 'REQUEST_SUCCESS' || simRes.executionStatus !== 'SIMULATED') {
    throw new Error(`Test 2 Failed: SIMULATE mode expected REQUEST_SUCCESS & SIMULATED, got ${simRes.status}`);
  }

  // Test 3: LIVE Execution (Low-Risk Web Search)
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

  console.log(`[PASS] Test 3: Live Execution status=${liveRes.status}, verification=${liveRes.verificationStatus}`);
  if (liveRes.status !== 'REQUEST_SUCCESS' || liveRes.verificationStatus !== 'VERIFIED') {
    throw new Error(`Test 3 Failed: Live Execution expected REQUEST_SUCCESS & VERIFIED, got ${liveRes.status}`);
  }

  // Test 4: Idempotency Verification (Re-sending with same idempotency key)
  const retryRes = await webCapabilityClient.executeCapability(
    'agent_beta',
    'Analyst Agent Beta',
    'web.search',
    'search',
    { query: 'Hermes Web Capability Fabric', maxResults: 3 },
    'EXECUTE',
    'idempotent_key_101',
    'trace_test_002'
  );

  if (retryRes.executionId !== liveRes.executionId) {
    throw new Error('Test 4 Failed: Idempotent request did not return identical execution record.');
  }
  console.log(`[PASS] Test 4: Idempotency check verified. Execution ID matched: ${retryRes.executionId}`);

  // Test 5: High Risk Policy Governance & Approval Flow
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

  console.log(`[PASS] Test 5: High Risk invocation status=${highRiskRes.status}`);
  if (highRiskRes.status !== 'APPROVAL_REQUIRED') {
    throw new Error(`Test 5 Failed: High Risk action should require approval, got ${highRiskRes.status}`);
  }

  const approvalId = highRiskRes.policyDecision?.approvalId;
  if (!approvalId) {
    throw new Error('Test 5 Failed: Approval ID missing in response policy decision.');
  }

  // Resolve Approval
  const approvalResolved = hermesWebEngine.resolveApproval(approvalId, true, 'Test Executive Operator');
  if (!approvalResolved || approvalResolved.status !== 'APPROVED') {
    throw new Error('Test 5 Failed: Approval resolution failed.');
  }
  console.log(`[PASS] Test 5b: Approval ${approvalId} successfully approved by executive operator.`);

  // Test 6: Audit Ledger & Trace Correlation
  const logs = auditLogger.getLogs(10, { traceId: 'trace_test_002' });
  if (logs.length === 0) {
    throw new Error('Test 6 Failed: Audit log entry for trace_test_002 not found.');
  }
  console.log(`[PASS] Test 6: Distributed Trace Correlation verified in Audit Ledger (${logs.length} entries found).`);

  console.log('=== ALL HERMES HIVE ↔ HERMES WEB PROTOCOL INTEGRATION TESTS PASSED ===');
  return true;
}

// Auto-execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runHermesWebProtocolTests().catch((err) => {
    console.error('Integration tests failed:', err);
    process.exit(1);
  });
}
