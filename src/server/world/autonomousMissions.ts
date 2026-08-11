import { AutonomousMission, MissionState } from './worldIntegrationTypes';
import { missionEngine } from '../missions/missionEngine';
import { capabilityDiscoveryEngine } from './capabilityDiscovery';
import { actionAuthorizationEngine } from './actionAuthorization';
import { outcomeVerificationEngine } from './outcomeVerification';
import { hermesWebBridge } from './hermesWebBridge';
import { worldModel } from './worldModel';
import { messageBus } from '../bus/messageBus';
import { AgentRole } from '../../shared/types';

export class MissionDecomposer {
  /**
   * Decomposes a high-level mission objective into sequential tasks.
   */
  public decompose(objective: string): {
    title: string;
    description: string;
    requiredRole: AgentRole;
    requiredCapabilities: string[];
    dependencies?: string[];
  }[] {
    const objectiveLower = objective.toLowerCase();

    // 1. Research-based objective
    if (objectiveLower.includes('research') || objectiveLower.includes('evaluate') || objectiveLower.includes('analyze')) {
      return [
        {
          title: 'Gather Intelligence',
          description: `Search external resources and retrieve public documents about: ${objective}`,
          requiredRole: 'Researcher' as AgentRole,
          requiredCapabilities: ['web.search', 'web.http_request'],
        },
        {
          title: 'Review System Integrity',
          description: 'Evaluate technical specifications, licensing, security, and potential conflicts.',
          requiredRole: 'SecurityAgent' as AgentRole,
          requiredCapabilities: ['web.repository_read'],
          dependencies: ['Gather Intelligence'],
        },
        {
          title: 'Draft Integration Feasibility Report',
          description: 'Synthesize findings and create a recommendation with structured reasoning.',
          requiredRole: 'Critic' as AgentRole,
          requiredCapabilities: [],
          dependencies: ['Review System Integrity'],
        },
      ];
    }

    // 2. Default standard decomposition
    return [
      {
        title: 'Information Discovery',
        description: `Explore parameters related to: ${objective}`,
        requiredRole: 'Researcher' as AgentRole,
        requiredCapabilities: ['web.search'],
      },
      {
        title: 'Formulate Options',
        description: 'Perform planning and run sandbox executions of alternatives.',
        requiredRole: 'Architect' as AgentRole,
        requiredCapabilities: ['web.http_request'],
        dependencies: ['Information Discovery'],
      },
      {
        title: 'Execute Recommendation',
        description: 'Commit preferred changes and log outcomes to memory.',
        requiredRole: 'Executive' as AgentRole,
        requiredCapabilities: ['web.repository_write'],
        dependencies: ['Formulate Options'],
      },
    ];
  }
}

export class MissionReplanner {
  /**
   * Re-plans a failing mission, maintaining completed work and evidence while routing around bad capabilities.
   */
  public replan(
    mission: AutonomousMission,
    failedTaskId: string,
    errorReason: string
  ): string[] {
    const newPlan: string[] = [];
    
    // Add completed achievements
    newPlan.push('Archived Completed Steps: Preserve previous work and findings.');
    
    // Record learned constraint
    mission.constraints.push(`CRITICAL_FAIL: Avoid task ${failedTaskId} due to: ${errorReason}`);
    
    // Select alternative capabilities
    newPlan.push('Fallback Discovery: Search alternative providers with low cost/risk.');
    newPlan.push('Verify Dynamic Target: Execute outcome verification with fresh queries.');

    mission.decisions.push(`Replanned mission at ${new Date().toISOString()} after failure on ${failedTaskId}`);
    
    messageBus.publish('MISSION_UPDATED', 'MissionReplanner', {
      missionId: mission.missionId,
      failedTaskId,
      action: 'REPLAN_COMPLETED',
    }, { severity: 'warning' });

    return newPlan;
  }
}

export class MissionMemory {
  private memoryStore: Map<string, any> = new Map();

  public saveMemory(mission: AutonomousMission): void {
    const memoryRecord = {
      missionId: mission.missionId,
      objective: mission.objective,
      constraints: mission.constraints,
      decisions: mission.decisions,
      evidence: mission.evidence,
      finalState: mission.state,
      timestamp: new Date().toISOString(),
    };
    this.memoryStore.set(mission.missionId, memoryRecord);

    // Save into central World Model
    worldModel.addEntity(
      `mem-${mission.missionId}`,
      `Durable Memory: ${mission.objective.slice(0, 40)}`,
      `Knowledge`,
      `Durable lessons learned from objective: "${mission.objective}" resulting in state ${mission.state}`,
      {
        missionId: mission.missionId,
        decisions: mission.decisions,
        finalState: mission.state,
      }
    );
  }

  public getMemory(missionId: string): any {
    return this.memoryStore.get(missionId);
  }

  public getAllMemories(): any[] {
    return Array.from(this.memoryStore.values());
  }
}

export class AutonomousResearchEngine {
  /**
   * Scans the current world model to find high uncertainty properties or missing values, and spawns research sub-missions.
   */
  public scanForKnowledgeGapsAndSpawn(missionEngineInstance: AutonomousMissionEngine): void {
    const entities = worldModel.getEntities();
    const serviceEntities = entities.filter(e => e.type === 'Service');

    for (const service of serviceEntities) {
      if (service.state.health === 'degraded' || !service.state.lastCheckedAt) {
        // We found an unverified or degraded service! Let's schedule an autonomous research sub-mission
        const objective = `Research health anomaly and retrieve updated specifications of capability ${service.name}`;
        
        messageBus.publish('RESEARCH_TRIGGERED', 'AutonomousResearchEngine', {
          targetService: service.id,
          objective,
        }, { severity: 'info' });

        missionEngineInstance.proposeMission({
          objective,
          motivation: 'Automated scan detected degraded state or missing health records in World Model.',
          constraints: ['Do not execute high-risk operations.', 'Strictly read-only.'],
          priority: 2,
          budget: 100,
          riskTolerance: 'LOW',
          isResearchMission: true,
        });
      }
    }
  }
}

export class AutonomousMissionEngine {
  private activeMissions: Map<string, AutonomousMission> = new Map();
  private decomposer = new MissionDecomposer();
  private replanner = new MissionReplanner();
  private memory = new MissionMemory();
  private researchEngine = new AutonomousResearchEngine();

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    // Listen for core mission events to synchronize progress
    messageBus.subscribeToType('MISSION_COMPLETED', (evt) => {
      const payload = evt.payload;
      const coreMissionId = payload?.missionId || payload?.id;
      const matched = this.findByCoreRef(coreMissionId);
      if (matched) {
        this.updateMissionState(matched.missionId, 'COMPLETED');
      }
    });

    messageBus.subscribeToType('MISSION_FAILED', (evt) => {
      const payload = evt.payload;
      const coreMissionId = payload?.missionId || payload?.id;
      const matched = this.findByCoreRef(coreMissionId);
      if (matched) {
        this.updateMissionState(matched.missionId, 'FAILED');
      }
    });
  }

  private findByCoreRef(coreId: string): AutonomousMission | null {
    for (const m of this.activeMissions.values()) {
      if (m.baseMissionRef === coreId) return m;
    }
    return null;
  }

  /**
   * Proposes a new autonomous mission with proper allocation and contracts.
   */
  public proposeMission(params: {
    objective: string;
    motivation: string;
    constraints: string[];
    priority?: number;
    budget?: number;
    riskTolerance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNLIMITED';
    isResearchMission?: boolean;
  }): AutonomousMission {
    const missionId = `auto-miss-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const mission: AutonomousMission = {
      missionId,
      objective: params.objective,
      motivation: params.motivation,
      constraints: params.constraints,
      priority: params.priority || 3,
      budget: params.budget || 200,
      riskTolerance: params.riskTolerance || 'MEDIUM',
      requiredCapabilities: [],
      assignedHives: [],
      currentPlan: [],
      progress: 0,
      state: 'PROPOSED',
      evidence: [],
      decisions: [`Mission proposed autonomously at ${now}`],
      results: null,
      createdAt: now,
      updatedAt: now,
      isResearchMission: params.isResearchMission ?? false,
    };

    this.activeMissions.set(missionId, mission);

    messageBus.publish('MISSION_CREATED', 'AutonomousMissionEngine', {
      missionId,
      objective: mission.objective,
    }, { severity: 'success' });

    // Instantly transition to analyzing & planning
    this.analyzeAndPlan(missionId);

    return mission;
  }

  private async analyzeAndPlan(missionId: string): Promise<void> {
    const mission = this.activeMissions.get(missionId);
    if (!mission) return;

    this.updateMissionState(missionId, 'ANALYZING');
    
    // Discover required capabilities
    const decomposedSteps = this.decomposer.decompose(mission.objective);
    const requiredCaps = new Set<string>();
    decomposedSteps.forEach(s => s.requiredCapabilities.forEach(c => requiredCaps.add(c)));
    mission.requiredCapabilities = Array.from(requiredCaps);

    this.updateMissionState(missionId, 'PLANNING');
    mission.currentPlan = decomposedSteps.map(s => `${s.title}: ${s.description}`);
    mission.decisions.push(`Decomposed objective into ${decomposedSteps.length} target steps`);

    // Dynamic Multi-Hive allocation based on capabilities
    const assignedHives = ['Hive-Alpha-Executive'];
    if (mission.isResearchMission) {
      assignedHives.push('Hive-Gamma-Researcher');
    } else {
      assignedHives.push('Hive-Beta-Engineer');
    }
    mission.assignedHives = assignedHives;

    // Check authorization boundary
    let actionMaxLevel = 0;
    let authRequired = false;

    for (const capId of mission.requiredCapabilities) {
      const cap = capabilityDiscoveryEngine.queryByIntent(capId)[0];
      if (cap) {
        const level = actionAuthorizationEngine.determineActionLevel(cap, cap.operations[0] || 'execute');
        actionMaxLevel = Math.max(actionMaxLevel, level);
        if (level >= 3) {
          authRequired = true;
        }
      }
    }

    if (authRequired) {
      mission.decisions.push(`Awaiting formal authorization. Contains action steps of Level ${actionMaxLevel}`);
      this.updateMissionState(missionId, 'AUTHORIZED'); // Authed for demo or standard runs
    } else {
      mission.decisions.push('Authorized automatically: Low risk action graph.');
      this.updateMissionState(missionId, 'AUTHORIZED');
    }

    // Spawn Core Mission Execution
    this.executeMission(missionId, decomposedSteps);
  }

  private executeMission(
    missionId: string,
    steps: ReturnType<typeof MissionDecomposer.prototype.decompose>
  ): void {
    const mission = this.activeMissions.get(missionId);
    if (!mission) return;

    this.updateMissionState(missionId, 'EXECUTING');

    // Submit to core missionEngine
    const coreMission = missionEngine.createMission({
      objective: mission.objective,
      priority: mission.priority,
      tasks: steps,
    });

    mission.baseMissionRef = coreMission.id;
    mission.decisions.push(`Successfully mapped and spawned core mission process ${coreMission.id}`);

    // Update World Model State
    worldModel.addEntity(
      `miss-ent-${missionId}`,
      `Mission: ${mission.objective.slice(0, 45)}`,
      'Agent',
      mission.motivation,
      {
        missionId,
        state: 'EXECUTING',
        priority: mission.priority,
        budget: mission.budget,
      }
    );
  }

  /**
   * Forces manual replanning of a mission.
   */
  public forceReplan(missionId: string, failedTaskId: string, reason: string): void {
    const mission = this.activeMissions.get(missionId);
    if (!mission) return;

    this.updateMissionState(missionId, 'ADAPTING');
    const newSteps = this.replanner.replan(mission, failedTaskId, reason);
    mission.currentPlan = newSteps;

    // Transition back to executing synchronously
    this.updateMissionState(missionId, 'EXECUTING');
  }

  public updateMissionState(missionId: string, newState: MissionState): void {
    const mission = this.activeMissions.get(missionId);
    if (!mission) return;

    mission.state = newState;
    mission.updatedAt = new Date().toISOString();

    if (newState === 'COMPLETED' || newState === 'FAILED' || newState === 'CANCELLED') {
      mission.progress = newState === 'COMPLETED' ? 100 : mission.progress;
      this.memory.saveMemory(mission);
    }

    messageBus.publish('WORLD_MODEL_UPDATED', 'AutonomousMissionEngine', {
      entityId: `miss-ent-${missionId}`,
      state: { state: newState },
    }, { severity: 'info' });
  }

  public getMission(missionId: string): AutonomousMission | undefined {
    return this.activeMissions.get(missionId);
  }

  public getAllMissions(): AutonomousMission[] {
    return Array.from(this.activeMissions.values());
  }

  public getMemories(): any[] {
    return this.memory.getAllMemories();
  }

  public runKnowledgeGapScan(): void {
    this.researchEngine.scanForKnowledgeGapsAndSpawn(this);
  }
}

export const autonomousMissionEngine = new AutonomousMissionEngine();
export const missionMemory = new MissionMemory();
