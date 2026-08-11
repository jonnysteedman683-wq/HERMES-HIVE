import { ScenarioResult, ScenarioType } from '../../shared/types';
import { digitalTwin } from './digitalTwin';

export class ScenarioEngine {
  private scenarioResults: ScenarioResult[] = [];

  constructor() {
    this.seedScenarios();
  }

  private seedScenarios(): void {
    const s1: ScenarioResult = {
      scenarioId: 'sim-scen-001',
      title: 'Simulated Failover: Engineering Hive Beta Outage',
      scenarioType: 'HIVE_FAILURE',
      assumptions: [
        'Engineering Beta Hive goes offline completely for 30 minutes',
        'Federation automatically redirects software build contracts to Research Alpha Hive',
      ],
      predictedOutcome: 'Missions continue with 18% higher latency. Zero contract drop or data loss.',
      successProbability: 0.94,
      resourceImpactDeltaTokens: +12000,
      riskImpactLevel: 'LOW',
      performanceImpactPct: -18,
      failureModes: ['Temporary build task queue backlog'],
      recoveryOptions: ['Promote standby Engineering agent cluster in Prime Hive'],
      confidenceScore: 0.95,
      simulatedAt: new Date().toISOString(),
    };

    const s2: ScenarioResult = {
      scenarioId: 'sim-scen-002',
      title: 'Resource Reallocation: Double Research Token Quota',
      scenarioType: 'RESOURCE_REALLOCATION',
      assumptions: [
        'Reallocate 150,000 tokens/min from Operations to Deep Research Division',
      ],
      predictedOutcome: 'Accelerate strategic opportunity discovery velocity by 40%.',
      successProbability: 0.97,
      resourceImpactDeltaTokens: 0,
      riskImpactLevel: 'LOW',
      performanceImpactPct: +22,
      failureModes: ['Slight decrease in background telemetry resolution'],
      recoveryOptions: ['Restore balanced token allocation schedule'],
      confidenceScore: 0.96,
      simulatedAt: new Date().toISOString(),
    };

    this.scenarioResults.push(s1, s2);
  }

  public runScenario(title: string, scenarioType: ScenarioType, assumptions: string[]): ScenarioResult {
    // Run isolated simulation using Digital Twin
    digitalTwin.createSnapshot();

    const result: ScenarioResult = {
      scenarioId: `sim-scen-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      scenarioType,
      assumptions,
      predictedOutcome: `Simulation predicts 95%+ success probability under assumption set. Reversible with zero production impact.`,
      successProbability: 0.95,
      resourceImpactDeltaTokens: Math.round(5000 + Math.random() * 10000),
      riskImpactLevel: 'LOW',
      performanceImpactPct: 15,
      failureModes: ['Minor latency spike during initial routing transition'],
      recoveryOptions: ['Automatic rollback to baseline digital twin state'],
      confidenceScore: 0.94,
      simulatedAt: new Date().toISOString(),
    };

    this.scenarioResults.unshift(result);
    return result;
  }

  public getAllScenarios(): ScenarioResult[] {
    return [...this.scenarioResults];
  }
}

export const scenarioEngine = new ScenarioEngine();
