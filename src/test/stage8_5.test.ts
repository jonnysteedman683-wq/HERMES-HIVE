import { causalTracingEngine } from '../server/diagnostics/causalTracingEngine';
import { stateSnapshotEngine } from '../server/diagnostics/stateSnapshotEngine';
import { missionReplayEngine } from '../server/diagnostics/missionReplayEngine';
import { decisionReplayEngine } from '../server/diagnostics/decisionReplayEngine';
import { rootCauseAnalysisEngine } from '../server/diagnostics/rootCauseAnalysisEngine';
import { debugSandboxEngine } from '../server/diagnostics/debugSandboxEngine';
import { selfRepairEngine } from '../server/diagnostics/selfRepairEngine';
import { whyExplanationEngine } from '../server/diagnostics/whyExplanationEngine';
import { incidentMemoryEngine } from '../server/diagnostics/incidentMemoryEngine';
import { deepDiagnosticsEngine } from '../server/diagnostics/deepDiagnosticsEngine';
import { ErrorEnvelope } from '../shared/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runStage8_5Tests() {
  console.log('=== STARTING HERMES HIVE STAGE 8.5 — DEEP DEBUGGING & SELF-REPAIR SUITE ===');

  // Test 1: Causal Tracing
  console.log('\n--- Scenario 1: Causal Tracing Engine ---');
  const traceId = `trace_test_${Date.now()}`;
  const span1 = causalTracingEngine.recordSpan({
    traceId,
    causality: 'TRIGGERED_BY',
    source: 'TestSuite',
    actor: 'TestAgent',
    component: 'MISSION',
    action: 'INITIATE_MISSION',
    durationMs: 15,
    status: 'SUCCESS',
  });
  assert(Boolean(span1.spanId), 'Span ID must be generated');

  const span2 = causalTracingEngine.recordSpan({
    traceId,
    parentSpanId: span1.spanId,
    causality: 'DEPENDS_ON',
    source: 'TestSuite',
    actor: 'TestAgent',
    component: 'HERMES_WEB',
    action: 'EXECUTE:web.search:search',
    durationMs: 4500,
    status: 'FAILED',
    error: {
      code: 'TIMEOUT_ERR',
      message: 'SLA timeout 5000ms exceeded',
      category: 'TIMEOUT',
      retryable: true,
      severity: 'HIGH',
      timestamp: new Date().toISOString(),
    },
  });

  const traceSpans = causalTracingEngine.getSpansByTraceId(traceId);
  assert(traceSpans.length === 2, 'Should retrieve exactly 2 spans for trace ID');
  const summary = causalTracingEngine.getTraceSummary(traceId);
  assert(summary.failedSpanCount === 1, 'Failed span count in summary must be 1');
  console.log(`✓ Scenario 1 Passed: Recorded ${traceSpans.length} causal spans, 1 failure detected.`);

  // Test 2: State Snapshots & Time-Travel Diffing
  console.log('\n--- Scenario 2: State Snapshot & Time-Travel Engine ---');
  const snap1 = stateSnapshotEngine.takeSnapshot('Checkpoint A');
  const snap2 = stateSnapshotEngine.takeSnapshot('Checkpoint B');
  assert(Boolean(snap1.snapshotId) && Boolean(snap2.snapshotId), 'Snapshot IDs generated');

  const diff = stateSnapshotEngine.diffSnapshots(snap1.snapshotId, snap2.snapshotId) as any;
  assert(diff.timeDeltaSec >= 0, 'Time delta should be computed');
  console.log(`✓ Scenario 2 Passed: Snapshots created (${snap1.snapshotId}, ${snap2.snapshotId}) and diff computed.`);

  // Test 3: Decision Replay with Fact vs Inference Separation
  console.log('\n--- Scenario 3: Decision Replay Engine ---');
  const decisionReplay = decisionReplayEngine.getDecisionReplay('dec_001');
  assert(Boolean(decisionReplay), 'Decision replay record retrieved');
  assert(decisionReplay!.facts.length > 0, 'Facts list should not be empty');
  assert(decisionReplay!.observations.length > 0, 'Observations list should not be empty');
  assert(decisionReplay!.inferences.length > 0, 'Inferences list should not be empty');
  assert(decisionReplay!.predictions.length > 0, 'Predictions list should not be empty');
  console.log(`✓ Scenario 3 Passed: Decision replay verified with strict Fact vs Inference separation.`);

  // Test 4: Root Cause Analysis & Multi-Hypothesis Confidence Scoring
  console.log('\n--- Scenario 4: Root Cause Analysis Engine ---');
  const sampleError: ErrorEnvelope = {
    code: 'TIMEOUT_API_500',
    message: 'Capability web.search response timeout',
    category: 'TIMEOUT',
    retryable: true,
    severity: 'HIGH',
    timestamp: new Date().toISOString(),
  };
  const rcaReport = rootCauseAnalysisEngine.analyzeFailure('inc_test_1', sampleError, traceId);
  assert(rcaReport.primaryErrorCategory === 'TIMEOUT', 'Primary error category should match TIMEOUT');
  assert(rcaReport.rootCauseHypotheses.length > 0, 'Root cause hypotheses generated');
  assert(rcaReport.rootCauseHypotheses[0].confidencePct > 50, 'Primary hypothesis confidence > 50%');
  assert(Boolean(rcaReport.blastRadius.estimatedSeverity), 'Blast radius calculated');
  console.log(`✓ Scenario 4 Passed: RCA produced ${rcaReport.rootCauseHypotheses.length} hypotheses; Primary confidence: ${rcaReport.rootCauseHypotheses[0].confidencePct}%.`);

  // Test 5: Debug Sandbox Simulation
  console.log('\n--- Scenario 5: Debug Sandbox Engine ---');
  const sandboxResult = debugSandboxEngine.runSandboxSimulation('inc_test_1', {
    actionType: 'RECONFIG_TIMEOUT',
    timeoutMs: 12000,
  });
  assert(sandboxResult.success === true, 'Sandbox simulation succeeded');
  assert(sandboxResult.predictedRecoveryPct > 90, 'High predicted recovery in sandbox');
  console.log(`✓ Scenario 5 Passed: Isolated sandbox simulation passed with ${sandboxResult.predictedRecoveryPct}% predicted recovery.`);

  // Test 6: Governed Self-Repair & Rollback Workflow
  console.log('\n--- Scenario 6: Governed Self-Repair Engine ---');
  const repairProposal = selfRepairEngine.generateProposal('inc_test_1', rcaReport);
  assert(repairProposal.status === 'PROPOSED', 'New proposal status must be PROPOSED');

  // Attempt to apply without approval -> should fail governance check
  let approvalBlocked = false;
  try {
    selfRepairEngine.applyProposal(repairProposal.proposalId);
  } catch (err) {
    approvalBlocked = true;
  }
  assert(approvalBlocked, 'Applying proposal without approval must be blocked by governance');

  // Approve proposal
  selfRepairEngine.approveProposal(repairProposal.proposalId, 'Executive Supervisor');
  assert(repairProposal.status === 'APPROVED', 'Proposal status updated to APPROVED');

  // Apply proposal
  selfRepairEngine.applyProposal(repairProposal.proposalId);
  assert(repairProposal.status === 'APPLIED', 'Proposal status updated to APPLIED');

  // Rollback proposal
  selfRepairEngine.rollbackProposal(repairProposal.proposalId);
  assert(repairProposal.status === 'ROLLED_BACK', 'Proposal status updated to ROLLED_BACK');
  console.log(`✓ Scenario 6 Passed: Governed repair flow (PROPOSED -> APPROVED -> APPLIED -> ROLLED_BACK) validated.`);

  // Test 7: Operator "Why?" Explanation Engine
  console.log('\n--- Scenario 7: Operator "Why?" Explanation Engine ---');
  const whyFailReport = whyExplanationEngine.answerWhyQuery('Why did mission fail?');
  assert(whyFailReport.queryType === 'WHY_DID_IT_FAIL', 'Query type should be WHY_DID_IT_FAIL');
  assert(Boolean(whyFailReport.summaryExplanation), 'Summary explanation provided');

  const whyNotReport = whyExplanationEngine.answerWhyQuery("Why didn't Hermes execute unsimulated?");
  assert(whyNotReport.queryType === 'WHY_DIDNT_HERMES_DO', 'Query type should be WHY_DIDNT_HERMES_DO');
  console.log(`✓ Scenario 7 Passed: "Why?" engine generated structured causal explanations.`);

  // Test 8: Incident Memory Engine
  console.log('\n--- Scenario 8: Incident Memory Engine ---');
  const incident = incidentMemoryEngine.getIncident('inc_001');
  assert(Boolean(incident), 'Initial incident record retrieved');
  assert(incident!.status === 'REPAIRED', 'Incident status should be REPAIRED');
  console.log(`✓ Scenario 8 Passed: Permanent incident memory verified.`);

  // Test 9: Chaos Diagnostics
  console.log('\n--- Scenario 9: Chaos Diagnostics Scenario ---');
  const chaosResult = deepDiagnosticsEngine.runChaosScenario('HERMES_WEB_OUTAGE');
  assert(Boolean(chaosResult.traceId), 'Chaos trace generated');
  assert(chaosResult.analysis.rcaReport.primaryErrorCategory === 'TIMEOUT', 'Chaos incident categorized correctly');
  console.log(`✓ Scenario 9 Passed: Chaos scenario injected and diagnosed autonomously.`);

  console.log('\n=== ALL STAGE 8.5 DEEP DEBUGGING & GOVERNED SELF-REPAIR TESTS PASSED ===');
}

runStage8_5Tests().catch((err) => {
  console.error('❌ Stage 8.5 Test Suite Failed:', err);
  process.exit(1);
});
