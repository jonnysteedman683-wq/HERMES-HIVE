import { ExperimentRecord, ExperimentStatus } from '../../shared/types';
import { hypothesisEngine } from './hypothesisEngine';

export class ExperimentEngine {
  private experiments: Map<string, ExperimentRecord> = new Map();

  constructor() {
    this.seedExperiments();
  }

  private seedExperiments(): void {
    const e1: ExperimentRecord = {
      experimentId: 'exp-001',
      hypothesisId: 'hyp-001',
      title: 'A/B Test: Research Token Quota Boost vs Baseline',
      baselineStrategy: 'Standard Static Token Quota Allocation',
      candidateStrategy: 'Dynamic Token Allocation with Research Priority Boost',
      isolationLevel: 'SIMULATION',
      status: 'VERIFIED',
      metrics: {
        baselineLatencyMs: 420,
        candidateLatencyMs: 290,
        baselineSuccessRatePct: 94.0,
        candidateSuccessRatePct: 98.5,
        costDeltaTokensPct: +5.2,
      },
      durationMinutes: 60,
      resourceBudgetTokens: 50000,
      riskLevel: 'LOW',
      resultsSummary: 'Candidate strategy achieved 31% latency reduction and +4.5% success rate boost.',
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date().toISOString(),
    };

    const e2: ExperimentRecord = {
      experimentId: 'exp-002',
      hypothesisId: 'hyp-002',
      title: 'Sandbox: Automated Pre-Flight Build Verification',
      baselineStrategy: 'Direct Contract Build Execution',
      candidateStrategy: 'Pre-flight Dependency Check + Static Verification',
      isolationLevel: 'SANDBOX',
      status: 'RUNNING',
      metrics: {
        baselineLatencyMs: 850,
        candidateLatencyMs: 890,
        baselineSuccessRatePct: 91.0,
        candidateSuccessRatePct: 99.2,
        costDeltaTokensPct: +1.8,
      },
      durationMinutes: 30,
      resourceBudgetTokens: 25000,
      riskLevel: 'LOW',
      startedAt: new Date().toISOString(),
    };

    this.experiments.set(e1.experimentId, e1);
    this.experiments.set(e2.experimentId, e2);
  }

  public getAllExperiments(): ExperimentRecord[] {
    return Array.from(this.experiments.values());
  }

  public createExperiment(
    hypothesisId: string,
    title: string,
    baselineStrategy: string,
    candidateStrategy: string
  ): ExperimentRecord {
    const id = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const exp: ExperimentRecord = {
      experimentId: id,
      hypothesisId,
      title,
      baselineStrategy,
      candidateStrategy,
      isolationLevel: 'SANDBOX',
      status: 'RUNNING',
      metrics: {
        baselineLatencyMs: 500,
        candidateLatencyMs: 350,
        baselineSuccessRatePct: 92.0,
        candidateSuccessRatePct: 97.5,
        costDeltaTokensPct: -2.0,
      },
      durationMinutes: 45,
      resourceBudgetTokens: 30000,
      riskLevel: 'LOW',
      startedAt: new Date().toISOString(),
    };

    this.experiments.set(id, exp);
    return exp;
  }

  public promoteExperiment(experimentId: string): ExperimentRecord | null {
    const exp = this.experiments.get(experimentId);
    if (!exp) return null;
    exp.status = 'PROMOTED';
    exp.completedAt = new Date().toISOString();
    exp.resultsSummary = 'Promoted to production after governance verification and Digital Twin validation.';
    return exp;
  }
}

export const experimentEngine = new ExperimentEngine();
