import { PredictionRecord } from '../../shared/types';

export class PredictionTracker {
  private records: Map<string, PredictionRecord> = new Map();

  constructor() {
    this.seedPredictions();
  }

  private seedPredictions(): void {
    const p1: PredictionRecord = {
      id: 'pred-001',
      scenarioId: 'sim-scen-001',
      metricName: 'Engineering Hive Failover Latency Increase',
      predictedValue: 18, // 18%
      actualValue: 16.5, // 16.5%
      variancePct: 1.5,
      accuracyScore: 92,
      evaluatedAt: new Date().toISOString(),
    };

    const p2: PredictionRecord = {
      id: 'pred-002',
      scenarioId: 'sim-scen-002',
      metricName: 'Research Quota Reallocation Discovery Velocity',
      predictedValue: 40, // 40%
      actualValue: 42, // 42%
      variancePct: 2.0,
      accuracyScore: 95,
      evaluatedAt: new Date().toISOString(),
    };

    this.records.set(p1.id, p1);
    this.records.set(p2.id, p2);
  }

  public getAllPredictions(): PredictionRecord[] {
    return Array.from(this.records.values());
  }

  public getAverageAccuracyScore(): number {
    const recs = this.getAllPredictions();
    if (recs.length === 0) return 100;
    const sum = recs.reduce((acc, r) => acc + (r.accuracyScore || 100), 0);
    return Number((sum / recs.length).toFixed(1));
  }
}

export const predictionTracker = new PredictionTracker();
