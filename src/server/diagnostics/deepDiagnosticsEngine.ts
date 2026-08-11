import { causalTracingEngine } from './causalTracingEngine';
import { stateSnapshotEngine } from './stateSnapshotEngine';
import { missionReplayEngine } from './missionReplayEngine';
import { decisionReplayEngine } from './decisionReplayEngine';
import { rootCauseAnalysisEngine } from './rootCauseAnalysisEngine';
import { debugSandboxEngine } from './debugSandboxEngine';
import { selfRepairEngine } from './selfRepairEngine';
import { whyExplanationEngine } from './whyExplanationEngine';
import { incidentMemoryEngine } from './incidentMemoryEngine';
import { ErrorEnvelope, IncidentRecord } from '../../shared/types';

class DeepDiagnosticsEngine {
  public getCausalTraces(traceId?: string) {
    if (traceId) {
      return causalTracingEngine.getSpansByTraceId(traceId);
    }
    return causalTracingEngine.getSpans();
  }

  public takeStateSnapshot(reason?: string) {
    return stateSnapshotEngine.takeSnapshot(reason);
  }

  public getSnapshots() {
    return stateSnapshotEngine.getSnapshots();
  }

  public diffSnapshots(id1: string, id2: string) {
    return stateSnapshotEngine.diffSnapshots(id1, id2);
  }

  public replayMission(missionId: string) {
    return missionEngineReplay(missionId);
  }

  public replayDecision(decisionId: string) {
    return decisionReplayEngine.getDecisionReplay(decisionId);
  }

  public analyzeIncident(incidentId: string, error: ErrorEnvelope, traceId?: string) {
    const rcaReport = rootCauseAnalysisEngine.analyzeFailure(incidentId, error, traceId);
    const repairProposal = selfRepairEngine.generateProposal(incidentId, rcaReport);

    const incident: IncidentRecord = {
      incidentId,
      fingerprint: rcaReport.fingerprint,
      title: `Incident ${incidentId}: ${error.message}`,
      category: error.category,
      severity: error.severity || 'MEDIUM',
      status: 'OPEN',
      symptoms: [error.message],
      timeline: [
        { timestamp: new Date().toISOString(), event: 'Failure detected and logged' },
        { timestamp: new Date().toISOString(), event: 'RootCauseAnalysisEngine generated RCA report' },
        { timestamp: new Date().toISOString(), event: `Generated SelfRepairProposal ${repairProposal.proposalId}` },
      ],
      rootCauseReport: rcaReport,
      repairProposalId: repairProposal.proposalId,
      createdAt: new Date().toISOString(),
    };

    incidentMemoryEngine.recordIncident(incident);

    return {
      rcaReport,
      repairProposal,
      incident,
    };
  }

  public getWhyExplanation(query: string) {
    return whyExplanationEngine.answerWhyQuery(query);
  }

  public getIncidents() {
    return incidentMemoryEngine.getAllIncidents();
  }

  public getRepairProposals() {
    return selfRepairEngine.getAllProposals();
  }

  public approveRepair(proposalId: string, approvedBy?: string) {
    return selfRepairEngine.approveProposal(proposalId, approvedBy);
  }

  public applyRepair(proposalId: string) {
    return selfRepairEngine.applyProposal(proposalId);
  }

  public rollbackRepair(proposalId: string) {
    return selfRepairEngine.rollbackProposal(proposalId);
  }

  public runChaosScenario(scenarioType: 'HERMES_WEB_OUTAGE' | 'INCORRECT_CAPABILITY_DATA' | 'AGENT_CRASH' | 'RESOURCE_BOTTLENECK') {
    const traceId = `trace_chaos_${Date.now()}`;
    causalTracingEngine.recordSpan({
      traceId,
      causality: 'TRIGGERED_BY',
      source: 'ChaosEngine',
      actor: 'ChaosTester',
      component: 'HERMES_WEB',
      action: `CHAOS_INJECTION_${scenarioType}`,
      durationMs: 12,
      status: 'FAILED',
      error: {
        code: 'CHAOS_SIMULATED_ERROR',
        message: `Injected chaos scenario: ${scenarioType}`,
        category: 'TIMEOUT',
        retryable: true,
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
      },
    });

    const analysis = this.analyzeIncident(
      `inc_chaos_${Date.now()}`,
      {
        code: 'CHAOS_SIMULATED_ERROR',
        message: `Injected chaos scenario: ${scenarioType}`,
        category: 'TIMEOUT',
        retryable: true,
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
      },
      traceId
    );

    return {
      scenarioType,
      traceId,
      analysis,
    };
  }
}

function missionEngineReplay(missionId: string) {
  return missionReplayEngine.reconstructMissionReplay(missionId);
}

export const deepDiagnosticsEngine = new DeepDiagnosticsEngine();
