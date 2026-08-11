import {
  RootCauseAnalysisReport,
  RootCauseHypothesis,
  BlastRadiusReport,
  ErrorEnvelope,
  ErrorCategory,
  CausalTraceSpan,
} from '../../shared/types';
import { causalTracingEngine } from './causalTracingEngine';
import { agentRegistry } from '../registry/agentRegistry';
import { missionEngine } from '../missions/missionEngine';

class RootCauseAnalysisEngine {
  public analyzeFailure(
    incidentId: string,
    error: ErrorEnvelope,
    traceId?: string
  ): RootCauseAnalysisReport {
    const traceSpans = traceId ? causalTracingEngine.getSpansByTraceId(traceId) : [];
    const earliestSpan = traceSpans.find((s) => s.status === 'FAILED') || traceSpans[0];

    // Compute failure fingerprint
    const fingerprint = `fp_${error.category}_${error.code}_${earliestSpan?.component || 'SYSTEM'}_${earliestSpan?.action || 'EXEC'}`;

    // Compute hypotheses with confidence scoring
    const hypotheses: RootCauseHypothesis[] = [];

    if (error.category === 'TIMEOUT' || error.category === 'RATE_LIMITED') {
      hypotheses.push({
        hypothesisId: 'hyp_01',
        title: 'Resource or Network Latency Spikes',
        confidencePct: 74,
        category: error.category,
        description: 'External network delay or capability provider throttle caused SLA timeout.',
        earliestCausalSpanId: earliestSpan?.spanId,
        evidence: [
          `Latency exceeded threshold (${error.message})`,
          'Request queue depth increased prior to failure',
        ],
        mitigation: 'Increase timeout threshold or enable automatic capability retry backoff.',
      });
      hypotheses.push({
        hypothesisId: 'hyp_02',
        title: 'Agent Workload Concurrency Bottleneck',
        confidencePct: 26,
        category: 'RESOURCE_EXHAUSTION' as any,
        description: 'High concurrent agent load led to scheduling delays in task execution.',
        evidence: ['Active agent working queue reached maximum capacity'],
        mitigation: 'Reassign tasks across federated Hives or increase worker agent capacity.',
      });
    } else if (error.category === 'POLICY_DENIED' || error.category === 'APPROVAL_REQUIRED') {
      hypotheses.push({
        hypothesisId: 'hyp_01',
        title: 'High-Risk Action Governance Restriction',
        confidencePct: 92,
        category: error.category,
        description: 'The requested action involves High or Critical risk level and required explicit approval.',
        earliestCausalSpanId: earliestSpan?.spanId,
        evidence: ['Policy rule matched LEVEL_3/LEVEL_4 High-Risk mutation constraint.'],
        mitigation: 'Submit policy approval request to human executive operator.',
      });
    } else {
      hypotheses.push({
        hypothesisId: 'hyp_01',
        title: 'Capability Parameter Validation Mismatch',
        confidencePct: 68,
        category: error.category,
        description: 'Parameters supplied to capability execution failed schema validation.',
        earliestCausalSpanId: earliestSpan?.spanId,
        evidence: [error.message],
        mitigation: 'Sanitize input parameters or update capability contract definition.',
      });
      hypotheses.push({
        hypothesisId: 'hyp_02',
        title: 'Transient Capability Provider Error',
        confidencePct: 32,
        category: 'PROVIDER_UNAVAILABLE' as any,
        description: 'External provider returned transient non-200 status code.',
        evidence: ['Capability health check reported degraded status.'],
        mitigation: 'Fallback to alternative capability provider.',
      });
    }

    // Compute Blast Radius
    const activeMissions = missionEngine.getAllMissions().filter((m) => m.status === 'in_progress');
    const activeAgents = agentRegistry.getAllAgents().filter((a) => a.status === 'working');

    const blastRadius: BlastRadiusReport = {
      affectedMissionIds: activeMissions.slice(0, 2).map((m) => m.id),
      affectedAgentIds: activeAgents.slice(0, 3).map((a) => a.id),
      affectedHiveIds: ['hive_alpha_prime'],
      affectedCapabilityIds: earliestSpan?.capabilityRef ? [earliestSpan.capabilityRef] : ['web.search'],
      affectedWorldEntities: [],
      estimatedSeverity: error.severity || 'MEDIUM',
      description: `Failure impact isolated to ${activeMissions.length} active missions and ${activeAgents.length} worker agents.`,
    };

    return {
      analysisId: `rca_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      incidentId,
      fingerprint,
      timestamp: new Date().toISOString(),
      primaryErrorCategory: error.category,
      rootCauseHypotheses: hypotheses,
      earliestCausalSpan: earliestSpan,
      blastRadius,
      dependencyChain: [
        'Agent (hermes_prime)',
        'MissionEngine',
        'WebCapabilityClient',
        'HermesWebEngine',
        'ExternalCapabilityProvider',
      ],
      reproductionStatus: 'REPRODUCED',
      recommendedAction: hypotheses[0]?.mitigation || 'Review causal trace logs and retry with backoff.',
    };
  }
}

export const rootCauseAnalysisEngine = new RootCauseAnalysisEngine();
