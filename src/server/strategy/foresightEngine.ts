import { StrategicForesightScenario } from '../../shared/types';

export class StrategicForesightEngine {
  private scenarios: StrategicForesightScenario[] = [];

  constructor() {
    this.seedScenarios();
  }

  private seedScenarios(): void {
    this.scenarios = [
      {
        id: 'fore-001',
        horizon: 'BASELINE',
        title: 'Steady-State Autonomous Federation Expansion',
        description: 'Organisation continues linear expansion across 4 specialized Hives with 99.4% health score.',
        probabilityPct: 85,
        keyDrivers: ['Stable API quotas', 'Proven constitutional governance rules', 'High swarm reputation'],
        predictedRisks: ['Minor token budget depletion on heavy parallel debate tasks'],
        recommendedInitiatives: ['Maintain dynamic token balancing in Resource Market'],
      },
      {
        id: 'fore-002',
        horizon: 'OPTIMISTIC',
        title: 'Accelerated Cross-Hive Autonomous Project Synthesis',
        description: 'Opportunity Engine automatically discovers 5+ strategic initiatives with zero human friction.',
        probabilityPct: 75,
        keyDrivers: ['High knowledge promotion velocity', 'Instant federated contract acceptance'],
        predictedRisks: ['Increased need for human authorization queue processing'],
        recommendedInitiatives: ['Expand Digital Divisions token allocation'],
      },
      {
        id: 'fore-003',
        horizon: 'ADVERSE',
        title: 'External API Quota Constraint & Latency Spike',
        description: 'Upstream model endpoints experience 300ms latency degradation and 30% quota reduction.',
        probabilityPct: 20,
        keyDrivers: ['Provider rate limiting', 'Regional network congestion'],
        predictedRisks: ['Mission execution timeouts if unmitigated'],
        recommendedInitiatives: ['Activate local fallback cache and queue compression'],
      },
      {
        id: 'fore-004',
        horizon: 'TRANSFORMATIONAL',
        title: 'Fully Autonomous Self-Improving Organisation (Stage 5B Ready)',
        description: 'HERMES autonomously proposes, simulates, tests, and promotes system improvements.',
        probabilityPct: 90,
        keyDrivers: ['Self-Model Graph', 'Digital Twin verification', 'Institutional Memory precision'],
        predictedRisks: ['Requires explicit human approval for architectural modifications'],
        recommendedInitiatives: ['Deploy Stage 5B Autonomous Evolution Loop'],
      },
    ];
  }

  public getAllScenarios(): StrategicForesightScenario[] {
    return [...this.scenarios];
  }
}

export const strategicForesightEngine = new StrategicForesightEngine();
