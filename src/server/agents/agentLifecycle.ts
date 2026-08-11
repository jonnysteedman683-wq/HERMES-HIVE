import { Agent, AgentLifecycleState } from '../../shared/types';
import { messageBus } from '../bus/messageBus';

export interface StateTransitionRecord {
  agentId: string;
  fromState: AgentLifecycleState;
  toState: AgentLifecycleState;
  reason?: string;
  timestamp: string;
}

export class AgentLifecycleManager {
  private agentStates: Map<string, AgentLifecycleState> = new Map();
  private history: Map<string, StateTransitionRecord[]> = new Map();

  /**
   * Register or initialize an agent in the lifecycle manager
   */
  public registerAgent(agent: Agent, initialState: AgentLifecycleState = 'AVAILABLE'): void {
    this.agentStates.set(agent.id, initialState);
    agent.lifecycleState = initialState;

    this.recordTransition(agent.id, 'CREATED', initialState, 'Agent registered in lifecycle manager');
  }

  /**
   * Get current lifecycle state for agent
   */
  public getState(agentId: string): AgentLifecycleState {
    return this.agentStates.get(agentId) || 'AVAILABLE';
  }

  /**
   * Transition agent lifecycle state with validation and audit trail
   */
  public transitionState(
    agent: Agent,
    newState: AgentLifecycleState,
    reason?: string
  ): boolean {
    const currentState = this.getState(agent.id);

    if (currentState === newState) return true;

    // Prevent transitions out of RETIRED unless explicitly reactivated
    if (currentState === 'RETIRED' && newState !== 'INITIALIZING' && newState !== 'AVAILABLE') {
      console.warn(`[AgentLifecycle] Cannot transition retired agent ${agent.id} to ${newState}`);
      return false;
    }

    this.agentStates.set(agent.id, newState);
    agent.lifecycleState = newState;

    // Map lifecycle state to status/health for UI compatibility
    if (newState === 'PAUSED') agent.status = 'paused';
    else if (newState === 'WORKING') agent.status = 'working';
    else if (newState === 'AVAILABLE') agent.status = 'idle';
    else if (newState === 'FAILED') {
      agent.status = 'failed';
      agent.health = 'unresponsive';
    } else if (newState === 'DEGRADED') {
      agent.health = 'degraded';
    } else if (newState === 'RECOVERING') {
      agent.health = 'degraded';
    } else if (newState === 'RETIRED') {
      agent.status = 'terminated';
      agent.health = 'offline';
    }

    this.recordTransition(agent.id, currentState, newState, reason);

    messageBus.publish('AGENT_STATE_CHANGED', 'AgentLifecycleManager', {
      agentId: agent.id,
      agentName: agent.name,
      fromState: currentState,
      toState: newState,
      reason,
    }, {
      agentId: agent.id,
      severity: newState === 'FAILED' ? 'error' : newState === 'DEGRADED' ? 'warning' : 'info',
    });

    return true;
  }

  /**
   * Pause an agent
   */
  public pauseAgent(agent: Agent, reason: string = 'User/System requested pause'): boolean {
    return this.transitionState(agent, 'PAUSED', reason);
  }

  /**
   * Resume a paused or degraded agent
   */
  public resumeAgent(agent: Agent, reason: string = 'Resumed operation'): boolean {
    return this.transitionState(agent, 'AVAILABLE', reason);
  }

  /**
   * Quarantine a degraded or untrusted agent
   */
  public quarantineAgent(agent: Agent, reason: string = 'Quarantined for security or anomaly inspection'): boolean {
    return this.transitionState(agent, 'DEGRADED', reason);
  }

  /**
   * Retire an agent (preserves historical performance/reputation records intact)
   */
  public retireAgent(agent: Agent, reason: string = 'Decommissioned/Retired from active swarm'): boolean {
    return this.transitionState(agent, 'RETIRED', reason);
  }

  /**
   * Get transition history audit trail for an agent
   */
  public getLifecycleHistory(agentId: string): StateTransitionRecord[] {
    return [...(this.history.get(agentId) || [])];
  }

  private recordTransition(
    agentId: string,
    fromState: AgentLifecycleState,
    toState: AgentLifecycleState,
    reason?: string
  ): void {
    if (!this.history.has(agentId)) {
      this.history.set(agentId, []);
    }
    const agentHist = this.history.get(agentId)!;
    agentHist.push({
      agentId,
      fromState,
      toState,
      reason,
      timestamp: new Date().toISOString(),
    });
  }
}

export const agentLifecycleManager = new AgentLifecycleManager();
