import { EvolutionProposal } from '../../shared/types';
import { governanceEngine } from '../governance/governanceEngine';

export interface AgentEvolutionAction {
  actionId: string;
  type: 'CREATE_AGENT' | 'RETIRE_AGENT' | 'SPECIALIZE_AGENT' | 'PROMOTE_AGENT' | 'REASSIGN_ROLE' | 'CLONE_CONFIGURATION' | 'MERGE_CAPABILITIES';
  targetAgentOrRole: string;
  rationale: string;
  capabilityGapIdentified: string;
  governanceApproved: boolean;
  createdAt: string;
}

export class AgentEvolutionEngine {
  private actions: Map<string, AgentEvolutionAction> = new Map();

  constructor() {
    this.seedEvolutionActions();
  }

  private seedEvolutionActions(): void {
    const act1: AgentEvolutionAction = {
      actionId: 'evo-act-001',
      type: 'CREATE_AGENT',
      targetAgentOrRole: 'Automated Pre-Flight Contract Verifier',
      rationale: 'Telemetry identified a 12% build failure rate due to missing dependency checks prior to contract execution.',
      capabilityGapIdentified: 'STATIC_DEPENDENCY_PREFLIGHT_VERIFICATION',
      governanceApproved: true,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    };

    const act2: AgentEvolutionAction = {
      actionId: 'evo-act-002',
      type: 'SPECIALIZE_AGENT',
      targetAgentOrRole: 'agent-perf-analyst -> Cross-Hive RPC Specialist',
      rationale: 'High volume of cross-Hive vector queries requires dedicated RPC optimization specialist.',
      capabilityGapIdentified: 'DYNAMIC_LATENCY_THROTTLING',
      governanceApproved: true,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    };

    this.actions.set(act1.actionId, act1);
    this.actions.set(act2.actionId, act2);
  }

  public getAllEvolutionActions(): AgentEvolutionAction[] {
    return Array.from(this.actions.values());
  }

  public proposeEvolution(
    type: AgentEvolutionAction['type'],
    targetAgentOrRole: string,
    rationale: string,
    capabilityGapIdentified: string
  ): AgentEvolutionAction {
    const actionId = `evo-act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Pass through governance check
    const isBlocked = governanceEngine.checkAction('PROHIBITED_SELF_MUTATION');
    const approved = !isBlocked;

    const action: AgentEvolutionAction = {
      actionId,
      type,
      targetAgentOrRole,
      rationale,
      capabilityGapIdentified,
      governanceApproved: approved,
      createdAt: new Date().toISOString(),
    };

    this.actions.set(actionId, action);
    return action;
  }
}

export const agentEvolutionEngine = new AgentEvolutionEngine();
