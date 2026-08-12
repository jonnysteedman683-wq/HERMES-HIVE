import { describe, it, expect } from 'vitest';
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

describe('Stage 8.5 — Deep Debugging & Governed Self-Repair Suite', () => {
  let traceId: string;
  let rcaReport: any;

  it('Scenario 1: Causal Tracing Engine', () => {
    traceId = `trace_test_${Date.now()}`;
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
    expect(span1.spanId).toBeDefined();

    causalTracingEngine.recordSpan({
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
    expect(traceSpans.length).toBe(2);
    const summary = causalTracingEngine.getTraceSummary(traceId);
    expect(summary.failedSpanCount).toBe(1);
  });

  it('Scenario 2: State Snapshot & Time-Travel Engine', () => {
    const snap1 = stateSnapshotEngine.takeSnapshot('Checkpoint A');
    const snap2 = stateSnapshotEngine.takeSnapshot('Checkpoint B');
    expect(snap1.snapshotId).toBeDefined();
    expect(snap2.snapshotId).toBeDefined();

    const diff = stateSnapshotEngine.diffSnapshots(snap1.snapshotId, snap2.snapshotId) as any;
    expect(diff.timeDeltaSec).toBeGreaterThanOrEqual(0);
  });

  it('Scenario 3: Decision Replay Engine', () => {
    const decisionReplay = decisionReplayEngine.getDecisionReplay('dec_001');
    expect(decisionReplay).toBeDefined();
    expect(decisionReplay!.facts.length).toBeGreaterThan(0);
    expect(decisionReplay!.observations.length).toBeGreaterThan(0);
    expect(decisionReplay!.inferences.length).toBeGreaterThan(0);
    expect(decisionReplay!.predictions.length).toBeGreaterThan(0);
  });

  it('Scenario 4: Root Cause Analysis Engine', () => {
    const sampleError: ErrorEnvelope = {
      code: 'TIMEOUT_API_500',
      message: 'Capability web.search response timeout',
      category: 'TIMEOUT',
      retryable: true,
      severity: 'HIGH',
      timestamp: new Date().toISOString(),
    };
    rcaReport = rootCauseAnalysisEngine.analyzeFailure('inc_test_1', sampleError, traceId);
    expect(rcaReport.primaryErrorCategory).toBe('TIMEOUT');
    expect(rcaReport.rootCauseHypotheses.length).toBeGreaterThan(0);
    expect(rcaReport.rootCauseHypotheses[0].confidencePct).toBeGreaterThan(50);
    expect(rcaReport.blastRadius.estimatedSeverity).toBeTruthy();
  });

  it('Scenario 5: Debug Sandbox Engine', () => {
    const sandboxResult = debugSandboxEngine.runSandboxSimulation('inc_test_1', {
      actionType: 'RECONFIG_TIMEOUT',
      timeoutMs: 12000,
    });
    expect(sandboxResult.success).toBe(true);
    expect(sandboxResult.predictedRecoveryPct).toBeGreaterThan(90);
  });

  it('Scenario 6: Governed Self-Repair Engine', () => {
    const repairProposal = selfRepairEngine.generateProposal('inc_test_1', rcaReport);
    expect(repairProposal.status).toBe('PROPOSED');

    // Attempt to apply without approval -> should fail governance check
    let approvalBlocked = false;
    try {
      selfRepairEngine.applyProposal(repairProposal.proposalId);
    } catch {
      approvalBlocked = true;
    }
    expect(approvalBlocked).toBe(true);

    selfRepairEngine.approveProposal(repairProposal.proposalId, 'Executive Supervisor');
    expect(repairProposal.status).toBe('APPROVED');

    selfRepairEngine.applyProposal(repairProposal.proposalId);
    expect(repairProposal.status).toBe('APPLIED');

    selfRepairEngine.rollbackProposal(repairProposal.proposalId);
    expect(repairProposal.status).toBe('ROLLED_BACK');
  });

  it('Scenario 7: Operator "Why?" Explanation Engine', () => {
    const whyFailReport = whyExplanationEngine.answerWhyQuery('Why did mission fail?');
    expect(whyFailReport.queryType).toBe('WHY_DID_IT_FAIL');
    expect(whyFailReport.summaryExplanation).toBeTruthy();

    const whyNotReport = whyExplanationEngine.answerWhyQuery("Why didn't Hermes execute unsimulated?");
    expect(whyNotReport.queryType).toBe('WHY_DIDNT_HERMES_DO');
  });

  it('Scenario 8: Incident Memory Engine', () => {
    const incident = incidentMemoryEngine.getIncident('inc_001');
    expect(incident).toBeDefined();
    expect(incident!.status).toBe('REPAIRED');
  });

  it('Scenario 9: Chaos Diagnostics Scenario', () => {
    const chaosResult = deepDiagnosticsEngine.runChaosScenario('HERMES_WEB_OUTAGE');
    expect(chaosResult.traceId).toBeTruthy();
    expect(chaosResult.analysis.rcaReport.primaryErrorCategory).toBe('TIMEOUT');
  });

  it('Scenario 10: Mission Replay Engine is available', () => {
    expect(missionReplayEngine).toBeDefined();
  });
});
