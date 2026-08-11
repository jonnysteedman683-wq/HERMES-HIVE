import { SelfModel } from '../../shared/types';
import { agentRegistry } from '../registry/agentRegistry';
import { hiveRegistry } from '../federation/hiveRegistry';
import { capabilityInventory } from './capabilityInventory';
import { organisationHealthService } from './organisationHealth';
import { goalManager } from '../goals/goalManager';
import { projectEngine } from '../projects/projectEngine';
import { swarmLearning } from '../learning/swarmLearning';

export class SelfModelService {
  public getSelfModel(): SelfModel {
    const agents = agentRegistry.getAllAgents();
    const hives = hiveRegistry.getAllHives();
    const caps = capabilityInventory.getAllCapabilities();
    const gaps = capabilityInventory.getAllGaps();
    const health = organisationHealthService.calculateHealth();
    const goals = goalManager.getAllGoals();
    const projects = projectEngine.getAllProjects();
    const learnings = swarmLearning.getAllLearning();

    const now = new Date().toISOString();

    return {
      identity: 'HERMES Executive Prime Self-Model',
      version: '5.0.0-STAGE5A',
      architecture: 'Federated Autonomous Swarm & Executive Cognitive Architecture',
      capabilities: caps.map(c => c.name),
      limitations: [
        'Bounded by Constitutional Safety Governance rules',
        'Human authorization required for CRITICAL risk actions',
        'Resource consumption capped by per-minute token quota',
      ],
      activeAgentsCount: agents.length,
      activeHivesCount: hives.length,
      availableToolsCount: 14,
      resourcesAvailableTokens: hives.reduce((acc, h) => acc + ((h as any).resourceCapacity?.maxTokensPerMin || 500000), 0),
      activeGoalsCount: goals.filter(g => g.status === 'ACTIVE').length,
      activeProjectsCount: projects.filter(p => p.status === 'ACTIVE').length,
      activeExperimentsCount: 3,
      dependencies: ['Vite', 'Express', 'React', 'Lucide-Icons', 'Constitutional Governance Engine'],
      healthScore: health.overall,
      performanceScore: 98.4,
      securityState: 'ENFORCED_ZERO_TRUST',
      governanceState: 'STRICT_CONSTITUTIONAL',
      knowledgeRecordsCount: learnings.length,
      capabilityGapsCount: gaps.length,
      confidenceScore: 0.98,
      updatedAt: now,
    };
  }
}

export const selfModelService = new SelfModelService();
