import { 
  PredictionRecord, 
  OutcomeRecord, 
  CausalAttribution, 
  CausalGraph, 
  PredictionCalibration, 
  LearningRecord,
  CalibrationBucket
} from '../../shared/stage9Types';
import { messageBus } from '../bus/messageBus';

export class CausalEvaluationEngine {
  private predictions: Map<string, PredictionRecord> = new Map();
  private outcomes: Map<string, OutcomeRecord> = new Map();
  private causalGraphs: Map<string, CausalGraph> = new Map();
  private attributions: Map<string, CausalAttribution> = new Map();
  private learningRecords: Map<string, LearningRecord> = new Map();
  private temporalObservations: Map<string, { timestamp: string; observation: string; timeframe: string }[]> = new Map();

  constructor() {
    this.seedDefaultEvaluationData();
  }

  private seedDefaultEvaluationData() {
    // Seed high latency/timeout incident prediction and outcome
    const p1 = this.createPrediction({
      missionId: 'm-sec-01',
      decisionId: 'dec-101',
      capabilityId: 'web_search',
      provider: 'Provider Alpha',
      expectedOutcome: 'Retrieve 20 clean, authenticated architecture specifications.',
      expectedDuration: 2000,
      expectedCost: 150,
      expectedReliability: 0.95,
      expectedRisk: 'LOW',
      expectedSideEffects: ['API key quota consumption'],
      confidence: 0.92,
      assumptions: ['Provider Alpha endpoints are highly available', 'No concurrent heavy query throttling'],
      evidence: ['Past 100 search executions succeeded within 1.5s']
    });

    // Seed immediate success but later downstream failure (delayed outcome)
    const o1 = this.createOutcome({
      predictionId: p1.predictionId,
      actualResult: 'Immediate retrieve succeeded with partial payload.',
      actualDuration: 8500, // much higher than expected (2000)
      actualCost: 150,
      actualReliability: 0.40, // much lower reliability
      actualSideEffects: ['Severe endpoint timeout cascade'],
      failures: ['Connection resetting on third page download'],
      externalConsequences: ['Downstream analysis pipeline blocked for 12 minutes'],
      verificationResults: ['Outcome validation FAILED on payload integrity'],
      downstreamEffects: ['Subsequent caching layer corrupted due to incomplete chunk transfers']
    });

    this.addTemporalObservation(p1.predictionId, 'Immediate fetch reported success but payload size was 34% below threshold.', 'IMMEDIATE');
    this.addTemporalObservation(p1.predictionId, 'Downstream caching layer reported key indexing exceptions.', 'SHORT_TERM');
    this.addTemporalObservation(p1.predictionId, 'Causal tracing isolated Provider Alpha socket timeouts during indexing.', 'MEDIUM_TERM');

    // Build Causal Graph for this failure
    this.generateCausalGraph(p1.predictionId, o1.outcomeId, {
      action: 'Execute multi-threaded web crawl across 20 source targets',
      immediateResult: 'Provider Alpha sockets timed out at thread #14',
      worldStateChanges: ['Caching layer state set to INCOMPLETE', 'System latency spike'],
      downstreamEvents: ['Agent thread starvation in subsequent Verification agent step'],
      finalOutcome: 'Overall mission degraded with incomplete research artifacts',
      alternativeHypotheses: [
        'Network route packet loss at regional reverse proxy (13%)',
        'Target web servers throttling crawler concurrent requests (23%)'
      ]
    });

    // Seed another highly successful, highly calibrated prediction/outcome
    const p2 = this.createPrediction({
      missionId: 'm-eng-02',
      decisionId: 'dec-102',
      capabilityId: 'saas_integration',
      provider: 'Provider Gamma',
      expectedOutcome: 'Synchronize federated ledger state with zero drift.',
      expectedDuration: 1200,
      expectedCost: 80,
      expectedReliability: 0.99,
      expectedRisk: 'LOW',
      expectedSideEffects: [],
      confidence: 0.97,
      assumptions: ['Ledger state locks are clean', 'Auth tokens valid'],
      evidence: ['Provider Gamma historical reliability at 100% across similar sync tasks']
    });

    const o2 = this.createOutcome({
      predictionId: p2.predictionId,
      actualResult: 'State synchronized perfectly with zero block drift.',
      actualDuration: 1050,
      actualCost: 80,
      actualReliability: 1.0,
      actualSideEffects: [],
      failures: [],
      externalConsequences: [],
      verificationResults: ['Outcome verification PASSED with cryptographic signature validation'],
      downstreamEffects: ['Subsequent federation billing settled instantly']
    });

    this.addTemporalObservation(p2.predictionId, 'Symmetric state proof verified on-chain.', 'IMMEDIATE');

    // Create learning record based on these
    this.distillLearning({
      observation: 'Provider Alpha suffers substantial timeout degradation when thread count exceeds 12.',
      hypothesis: 'Combining Alpha crawls with a secondary backup Provider Beta validator reduces failure rate under load.',
      experiment: 'Route thread batches > 10 through composite Alpha+Beta pipeline.',
      outcome: 'Observed zero timeout cascades and recovered normal execution latency of 1800ms.',
      conclusion: 'Composite ResearchVerificationPipeline significantly outperforms single-provider Alpha execution.',
      confidence: 0.94,
      provenance: [p1.predictionId, o1.outcomeId]
    });
  }

  public createPrediction(pred: Omit<PredictionRecord, 'predictionId' | 'timestamp'>): PredictionRecord {
    const predictionId = `pred-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: PredictionRecord = {
      ...pred,
      predictionId,
      timestamp: new Date().toISOString()
    };
    this.predictions.set(predictionId, record);

    messageBus.publish('LEDGER_ENTRY', 'CausalEvaluationEngine', {
      eventType: 'PredictionCreated',
      payload: record
    }, { severity: 'info' });

    return record;
  }

  public createOutcome(out: Omit<OutcomeRecord, 'outcomeId' | 'timestamp'>): OutcomeRecord {
    const outcomeId = `out-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: OutcomeRecord = {
      ...out,
      outcomeId,
      timestamp: new Date().toISOString()
    };
    this.outcomes.set(record.predictionId, record); // Map by prediction ID for easy retrieval

    messageBus.publish('LEDGER_ENTRY', 'CausalEvaluationEngine', {
      eventType: 'OutcomeObserved',
      payload: record
    }, { severity: 'info' });

    // Instantly trigger Causal Attribution for the outcome
    this.evaluateCausalAttribution(record);

    return record;
  }

  public addTemporalObservation(predictionId: string, observation: string, timeframe: 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM') {
    if (!this.temporalObservations.has(predictionId)) {
      this.temporalObservations.set(predictionId, []);
    }
    this.temporalObservations.get(predictionId)!.push({
      timestamp: new Date().toISOString(),
      observation,
      timeframe
    });
  }

  public getTemporalObservations(predictionId: string) {
    return this.temporalObservations.get(predictionId) || [];
  }

  private evaluateCausalAttribution(outcome: OutcomeRecord) {
    const pred = this.predictions.get(outcome.predictionId);
    if (!pred) return;

    let primaryCause = 'Normal calibrated operational conditions';
    const contributingFactors: { factor: string; influence: number }[] = [];
    const unknownFactors: string[] = [];
    let confidence = 0.90;

    const latencyDiff = outcome.actualDuration - pred.expectedDuration;
    const reliabilityDiff = pred.expectedReliability - outcome.actualReliability;

    if (outcome.failures.length > 0 || latencyDiff > 2000 || reliabilityDiff > 0.2) {
      // Something degraded or failed
      primaryCause = `${pred.provider} timeout and thread degradation`;
      contributingFactors.push({ factor: 'Concurrent scheduler queue depth', influence: 0.23 });
      contributingFactors.push({ factor: 'Network transport route latency variance', influence: 0.13 });
      unknownFactors.push('Transient load state on external target domain');
      confidence = 0.84;
    } else {
      // Clean execution
      primaryCause = 'High capability affinity and provider health';
      contributingFactors.push({ factor: 'Low network contention', influence: 0.10 });
      confidence = 0.95;
    }

    const attribution: CausalAttribution = {
      primaryCause,
      contributingFactors,
      unknownFactors,
      confidence
    };

    this.attributions.set(outcome.predictionId, attribution);

    messageBus.publish('LEDGER_ENTRY', 'CausalEvaluationEngine', {
      eventType: 'CausalEvaluationCompleted',
      payload: { predictionId: outcome.predictionId, attribution }
    }, { severity: 'info' });
  }

  public getAttribution(predictionId: string): CausalAttribution | undefined {
    return this.attributions.get(predictionId);
  }

  public generateCausalGraph(predictionId: string, outcomeId: string, details: {
    action: string;
    immediateResult: string;
    worldStateChanges: string[];
    downstreamEvents: string[];
    finalOutcome: string;
    alternativeHypotheses: string[];
  }): CausalGraph {
    const pred = this.predictions.get(predictionId);
    const graph: CausalGraph = {
      graphId: `graph-${predictionId}`,
      predictionId,
      decisionId: pred?.decisionId || 'dec-unknown',
      capabilityId: pred?.capabilityId || 'cap-unknown',
      provider: pred?.provider || 'provider-unknown',
      ...details
    };
    this.causalGraphs.set(predictionId, graph);
    return graph;
  }

  public getCausalGraph(predictionId: string): CausalGraph | undefined {
    return this.causalGraphs.get(predictionId);
  }

  public distillLearning(lrn: Omit<LearningRecord, 'id' | 'timestamp'>): LearningRecord {
    const id = `lrn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: LearningRecord = {
      ...lrn,
      id,
      timestamp: new Date().toISOString()
    };
    this.learningRecords.set(id, record);

    messageBus.publish('LEDGER_ENTRY', 'CausalEvaluationEngine', {
      eventType: 'KnowledgeDistilled',
      payload: record
    }, { severity: 'info' });

    return record;
  }

  public getLearningRecords(): LearningRecord[] {
    return Array.from(this.learningRecords.values());
  }

  public getPredictions(): PredictionRecord[] {
    return Array.from(this.predictions.values());
  }

  public getOutcomes(): OutcomeRecord[] {
    return Array.from(this.outcomes.values());
  }

  public getCausalGraphs(): CausalGraph[] {
    return Array.from(this.causalGraphs.values());
  }

  public getCalibration(): PredictionCalibration {
    // Group predictions and outcomes by confidence bins
    const bins = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    const buckets: CalibrationBucket[] = bins.map(bin => {
      // Find predictions with confidence matching this bin (+/- 0.05)
      const predsInBin = this.getPredictions().filter(p => Math.abs(p.confidence - bin) <= 0.05);
      let successCount = 0;
      let totalEvaluated = 0;

      for (const p of predsInBin) {
        const out = this.outcomes.get(p.predictionId);
        if (out) {
          totalEvaluated++;
          if (out.failures.length === 0 && out.actualReliability >= 0.8) {
            successCount++;
          }
        }
      }

      const expectedSuccessRate = bin * 100;
      const observedSuccessRate = totalEvaluated > 0 ? (successCount / totalEvaluated) * 100 : bin * 100; // default to calibrated if no data
      const calibrationError = Math.abs(expectedSuccessRate - observedSuccessRate);

      return {
        confidenceBin: bin,
        expectedSuccessRate,
        observedSuccessRate,
        sampleSize: totalEvaluated,
        calibrationError
      };
    });

    const overallCalibrationError = buckets.reduce((acc, curr) => acc + curr.calibrationError, 0) / bins.length;

    return {
      overallCalibrationError,
      buckets,
      confidenceByCapability: {
        web_search: 0.88,
        http_api: 0.92,
        saas_integration: 0.96
      },
      confidenceByProvider: {
        'Provider Alpha': 0.81,
        'Provider Beta': 0.89,
        'Provider Gamma': 0.98
      },
      confidenceByContext: {
        'High Queue Depth': 0.76,
        'Low Queue Depth': 0.95
      },
      lastEvaluatedAt: new Date().toISOString()
    };
  }
}

export const causalEvaluationEngine = new CausalEvaluationEngine();
