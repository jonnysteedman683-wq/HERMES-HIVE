import { Agent, AgentHealth, AgentReputation, AgentRole, AgentStatus } from '../../shared/types';
import { messageBus } from '../bus/messageBus';
import { AgentRepository } from '../persistence/agentRepository';

class AgentRegistry {
  private agents: Map<string, Agent> = new Map();
  private agentRepository = new AgentRepository();

  constructor() {
    this.loadFromDatabase();
    if (this.agents.size === 0) {
      this.seedDefaultAgents();
    }
  }

  private loadFromDatabase() {
    try {
      const stored = this.agentRepository.getAll();
      stored.forEach((agent) => this.agents.set(agent.id, agent));
    } catch (err) {
      console.error('[AgentRegistry] Failed to load agents from database:', err);
    }
  }

  private seedDefaultAgents() {
    const defaultAgentDefs: { name: string; role: AgentRole; clusterId: string; capabilities: string[] }[] = [
      { name: 'Aegis-Core', role: 'Executive', clusterId: 'Cluster A', capabilities: ['executive_control', 'mission_planning', 'swarm_coordination'] },
      { name: 'Hermes-Research-01', role: 'Researcher', clusterId: 'Cluster A', capabilities: ['repository_analysis', 'web_research', 'data_gathering'] },
      { name: 'Hermes-Analyst-01', role: 'Analyst', clusterId: 'Cluster A', capabilities: ['synthesis', 'pattern_recognition', 'trend_analysis'] },
      { name: 'Hermes-Security-01', role: 'SecurityAgent', clusterId: 'Cluster B', capabilities: ['security_audit', 'code_inspection', 'vulnerability_scanning'] },
      { name: 'Hermes-Developer-01', role: 'Developer', clusterId: 'Cluster B', capabilities: ['code_generation', 'refactoring', 'architecture_design'] },
      { name: 'Hermes-Tester-01', role: 'Tester', clusterId: 'Cluster B', capabilities: ['verification', 'unit_testing', 'integration_check'] },
      { name: 'Hermes-Critic-01', role: 'Critic', clusterId: 'Cluster C', capabilities: ['independent_review', 'risk_assessment', 'quality_check'] },
      { name: 'Hermes-Debugger-01', role: 'Debugger', clusterId: 'Cluster C', capabilities: ['failure_diagnosis', 'log_analysis', 'auto_healing'] },
      { name: 'Hermes-Coordinator-01', role: 'Coordinator', clusterId: 'Cluster C', capabilities: ['swarm_rebalancing', 'message_routing', 'cluster_bridge'] },
    ];

    defaultAgentDefs.forEach((def) => {
      this.createAgent(def);
    });
  }

  public createAgent(params: {
    name: string;
    role: AgentRole;
    capabilities: string[];
    clusterId?: string;
    systemPrompt?: string;
  }): Agent {
    const id = `agent-${params.role.toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const now = new Date().toISOString();

    const initialReputation: AgentReputation = {
      successRate: 0.98,
      failureRate: 0.02,
      averageLatencyMs: 450,
      verificationRate: 0.95,
      missionsCompleted: 12,
      tasksCompleted: 34,
      resourceEfficiency: 0.94,
      score: 95,
    };

    const agent: Agent = {
      id,
      name: params.name,
      role: params.role,
      capabilities: params.capabilities,
      status: 'idle',
      lifecycleState: 'AVAILABLE',
      health: 'healthy',
      lastHeartbeat: now,
      createdAt: now,
      clusterId: params.clusterId || 'Cluster A',
      reputation: initialReputation,
      resourceUsage: {
        cpuPct: Math.floor(Math.random() * 15) + 5,
        memoryMb: Math.floor(Math.random() * 120) + 180,
        tokensUsed: Math.floor(Math.random() * 2000) + 500,
        apiCallsCount: Math.floor(Math.random() * 20) + 5,
      },
      systemPrompt: params.systemPrompt,
    };

    this.agents.set(id, agent);
    this.agentRepository.upsert(agent);

    messageBus.publish('AGENT_CREATED', 'AgentRegistry', {
      agentId: id,
      name: agent.name,
      role: agent.role,
      clusterId: agent.clusterId,
      capabilities: agent.capabilities,
    }, { agentId: id, severity: 'info' });

    return agent;
  }

  public getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  public getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  public findAgentByRole(role: AgentRole): Agent | undefined {
    return Array.from(this.agents.values()).find(
      (a) => a.role === role && a.status !== 'terminated' && a.status !== 'failed'
    );
  }

  public findAvailableAgent(requiredRole?: AgentRole, requiredCapabilities?: string[]): Agent | undefined {
    const candidates = Array.from(this.agents.values()).filter((a) => {
      if (a.status === 'terminated' || a.status === 'failed' || a.status === 'paused') {
        return false;
      }
      if (requiredRole && a.role !== requiredRole) {
        return false;
      }
      if (requiredCapabilities && requiredCapabilities.length > 0) {
        const hasAllCaps = requiredCapabilities.every((cap) => a.capabilities.includes(cap));
        if (!hasAllCaps) return false;
      }
      return true;
    });

    if (candidates.length === 0 && requiredRole) {
      // If no exact match with role, find candidate that shares capabilities
      const capCandidates = Array.from(this.agents.values()).filter((a) => {
        if (a.status === 'terminated' || a.status === 'failed' || a.status === 'paused') return false;
        if (requiredCapabilities && requiredCapabilities.length > 0) {
          return requiredCapabilities.some((cap) => a.capabilities.includes(cap));
        }
        return true;
      });
      if (capCandidates.length > 0) {
        capCandidates.sort((a, b) => b.reputation.score - a.reputation.score);
        return capCandidates[0];
      }
    }

    if (candidates.length > 0) {
      // Prefer idle agents, then sort by highest reputation score
      candidates.sort((a, b) => {
        if (a.status === 'idle' && b.status !== 'idle') return -1;
        if (a.status !== 'idle' && b.status === 'idle') return 1;
        return b.reputation.score - a.reputation.score;
      });
      return candidates[0];
    }

    return undefined;
  }

  public updateAgentStatus(id: string, status: AgentStatus, currentTaskId?: string, currentMissionId?: string): Agent | undefined {
    const agent = this.agents.get(id);
    if (agent) {
      const prevStatus = agent.status;
      agent.status = status;
      agent.currentTaskId = currentTaskId;
      agent.currentMissionId = currentMissionId;
      agent.lastHeartbeat = new Date().toISOString();

      if (status === 'working' && prevStatus !== 'working') {
        messageBus.publish('AGENT_STARTED', 'AgentRegistry', { agentId: id, name: agent.name, currentTaskId }, { agentId: id, missionId: currentMissionId, taskId: currentTaskId, severity: 'info' });
      } else if (status === 'idle' && prevStatus === 'working') {
        messageBus.publish('AGENT_STOPPED', 'AgentRegistry', { agentId: id, name: agent.name }, { agentId: id, severity: 'info' });
      } else if (status === 'failed') {
        messageBus.publish('AGENT_FAILED', 'AgentRegistry', { agentId: id, name: agent.name }, { agentId: id, severity: 'error' });
      }

      return agent;
    }
    return undefined;
  }

  public processHeartbeat(id: string, health: AgentHealth = 'healthy', cpuPct?: number): Agent | undefined {
    const agent = this.agents.get(id);
    if (agent) {
      agent.lastHeartbeat = new Date().toISOString();
      agent.health = health;
      if (cpuPct !== undefined) {
        agent.resourceUsage.cpuPct = cpuPct;
      }
      return agent;
    }
    return undefined;
  }

  public updateReputation(id: string, success: boolean, latencyMs: number) {
    const agent = this.agents.get(id);
    if (agent) {
      const rep = agent.reputation;
      rep.tasksCompleted++;
      if (success) {
        rep.successRate = Number(((rep.successRate * (rep.tasksCompleted - 1) + 1) / rep.tasksCompleted).toFixed(3));
      } else {
        rep.failureRate = Number(((rep.failureRate * (rep.tasksCompleted - 1) + 1) / rep.tasksCompleted).toFixed(3));
      }
      rep.averageLatencyMs = Math.round((rep.averageLatencyMs * 0.7) + (latencyMs * 0.3));
      rep.score = Math.min(100, Math.max(0, Math.round(rep.successRate * 70 + rep.verificationRate * 20 + rep.resourceEfficiency * 10)));
    }
  }

  public pauseAgent(id: string): Agent | undefined {
    return this.updateAgentStatus(id, 'paused');
  }

  public resumeAgent(id: string): Agent | undefined {
    return this.updateAgentStatus(id, 'idle');
  }

  public terminateAgent(id: string): Agent | undefined {
    return this.updateAgentStatus(id, 'terminated');
  }

  public restartAgent(id: string): Agent | undefined {
    const agent = this.agents.get(id);
    if (agent) {
      agent.health = 'healthy';
      agent.status = 'idle';
      agent.currentTaskId = undefined;
      agent.currentMissionId = undefined;
      agent.lastHeartbeat = new Date().toISOString();
      messageBus.publish('AGENT_STARTED', 'AgentRegistry', { agentId: id, action: 'restarted' }, { agentId: id, severity: 'info' });
      return agent;
    }
    return undefined;
  }

  public registerAgent(agent: Agent): Agent {
    this.agents.set(agent.id, agent);
    return agent;
  }

  public getHermesAgent(): Agent {
    const executive = this.findAgentByRole('Executive');
    if (executive) return executive;
    return Array.from(this.agents.values())[0];
  }
}

export const agentRegistry = new AgentRegistry();
