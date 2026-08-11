import { DynamicTeam } from '../../shared/types';
import { agentReputationEngine } from './agentReputationEngine';

export class DynamicTeamFormationEngine {
  private teams: Map<string, DynamicTeam> = new Map();

  constructor() {
    this.seedTeams();
  }

  private seedTeams(): void {
    const t1: DynamicTeam = {
      teamId: 'team-opt-alpha',
      objective: 'Optimize Cross-Hive RPC Latency & Dynamic Token Quotas',
      hiveId: 'hive-hermes-prime',
      coordinatorAgentId: 'agent-executive-prime',
      memberAgentIds: ['agent-executive-prime', 'agent-perf-analyst', 'agent-db-sentinel', 'agent-coder-beta'],
      requiredCapabilities: ['RPC_PROFILING', 'TOKEN_SCHEDULING', 'SECURITY_ATTESTATION'],
      status: 'ACTIVE',
      tokenBudget: 100000,
      tokenConsumed: 42000,
      confidenceScore: 0.96,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    };

    this.teams.set(t1.teamId, t1);
  }

  public getAllTeams(): DynamicTeam[] {
    return Array.from(this.teams.values());
  }

  public formTeam(
    objective: string,
    hiveId: string,
    requiredCapabilities: string[],
    tokenBudget: number = 50000
  ): DynamicTeam {
    const teamId = `team-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Select agents based on capabilities & reputation
    const availableAgents = agentReputationEngine.getReputationRecords();
    const sorted = [...availableAgents].sort((a, b) => b.compositeReputation - a.compositeReputation);

    const coordinator = sorted[0]?.agentId || 'agent-executive-prime';
    const members = sorted.slice(0, Math.min(4, sorted.length)).map(a => a.agentId);

    const team: DynamicTeam = {
      teamId,
      objective,
      hiveId,
      coordinatorAgentId: coordinator,
      memberAgentIds: members,
      requiredCapabilities,
      status: 'ACTIVE',
      tokenBudget,
      tokenConsumed: 0,
      confidenceScore: 0.95,
      createdAt: new Date().toISOString(),
    };

    this.teams.set(teamId, team);
    return team;
  }

  public dissolveTeam(teamId: string): DynamicTeam | null {
    const team = this.teams.get(teamId);
    if (!team) return null;
    team.status = 'DISSOLVED';
    return team;
  }
}

export const dynamicTeamFormationEngine = new DynamicTeamFormationEngine();
