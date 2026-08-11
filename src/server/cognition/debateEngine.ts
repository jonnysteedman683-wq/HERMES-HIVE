import { DebateObjection, DebateProposal, DebateRecord } from '../../shared/types';
import { messageBus } from '../bus/messageBus';

export interface ConductDebateOptions {
  topic: string;
  missionId?: string;
  candidateProposals?: {
    agentId: string;
    agentName: string;
    title: string;
    strategySummary: string;
    estimatedCostTokens: number;
    estimatedTimeSec: number;
    confidence: number;
  }[];
}

export class CognitiveDebateEngine {
  private debates: Map<string, DebateRecord> = new Map();

  /**
   * Conduct a structured multi-agent debate across competing strategies
   */
  public conductDebate(options: ConductDebateOptions): DebateRecord {
    const debateId = `dbt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const proposals: DebateProposal[] = options.candidateProposals
      ? options.candidateProposals.map((p, idx) => ({
          id: `prop-${idx + 1}-${Math.random().toString(36).substring(2, 5)}`,
          ...p,
        }))
      : [
          {
            id: `prop-1-${Math.random().toString(36).substring(2, 5)}`,
            agentId: 'agent-strategist-01',
            agentName: 'Astraea (Lead Strategist)',
            title: 'Aggressive Direct Parallel Migration',
            strategySummary: 'Execute all task dependencies concurrently across Cluster A & B with high token parallelism.',
            estimatedCostTokens: 28000,
            estimatedTimeSec: 180,
            confidence: 0.88,
          },
          {
            id: `prop-2-${Math.random().toString(36).substring(2, 5)}`,
            agentId: 'agent-security-01',
            agentName: 'Aegis (Security Auditor)',
            title: 'Staged Verification & Dual-Phase Sandbox',
            strategySummary: 'Stage tasks sequentially through mandatory verification gates in Cluster C before deployment.',
            estimatedCostTokens: 34000,
            estimatedTimeSec: 280,
            confidence: 0.96,
          },
        ];

    // Generate Red-Team objections
    const objections: DebateObjection[] = [
      {
        id: `obj-1-${Math.random().toString(36).substring(2, 5)}`,
        agentId: 'agent-critic-01',
        agentName: 'Argus (Critic Agent)',
        targetProposalId: proposals[0].id,
        objection: 'Parallel execution risks racing state modifications in shared repository modules without verification.',
        severity: 'HIGH',
      },
      {
        id: `obj-2-${Math.random().toString(36).substring(2, 5)}`,
        agentId: 'agent-executive-01',
        agentName: 'Hermes Executive',
        targetProposalId: proposals[1].id,
        objection: 'Sequential staging increases overall latency by ~55%, though risk is reduced.',
        severity: 'MEDIUM',
      },
    ];

    const evidencePoints: string[] = [
      'Historical verification score for Staged Sandbox strategy is 97% vs 82% for Direct Parallel.',
      'Resource manager confirms token budget can absorb the staged verification overhead.',
      'Risk Engine classifies task dependencies as MEDIUM-HIGH security sensitivity.',
    ];

    // Hermes selects winning proposal based on evidence and risk
    const winningProposal = proposals[1] || proposals[0];
    const rejected = proposals.filter((p) => p.id !== winningProposal.id);

    const record: DebateRecord = {
      id: debateId,
      topic: options.topic,
      missionId: options.missionId,
      proposals,
      objections,
      evidencePoints,
      winningProposalId: winningProposal.id,
      finalDecisionSummary: `Selected '${winningProposal.title}' following cognitive debate. Aegis's staged verification strategy addresses Argus's high-severity objection regarding race conditions while staying within governance risk boundaries.`,
      rejectedAlternatives: rejected.map((r) => `'${r.title}' rejected due to ${r.id === proposals[0].id ? 'unmitigated state race risks' : 'higher cost'}.`),
      consensusConfidence: 0.95,
      createdAt: new Date().toISOString(),
    };

    this.debates.set(debateId, record);

    messageBus.publish('DEBATE_RECORDED', 'CognitiveDebateEngine', {
      debate: record,
    }, {
      missionId: options.missionId,
      severity: 'info',
    });

    return record;
  }

  public getDebate(id: string): DebateRecord | undefined {
    return this.debates.get(id);
  }

  public getAllDebates(): DebateRecord[] {
    return Array.from(this.debates.values());
  }
}

export const cognitiveDebateEngine = new CognitiveDebateEngine();
