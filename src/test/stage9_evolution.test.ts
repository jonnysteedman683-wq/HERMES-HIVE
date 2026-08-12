import { describe, it, expect } from 'vitest';
import { causalEvaluationEngine } from '../server/learning/causalEvaluationEngine';
import { reputationEngine } from '../server/learning/reputationEngine';
import { capabilityEvolutionEngine } from '../server/learning/capabilityEvolutionEngine';

describe('Stage 9 — Evolution & Causal Verification', () => {
  let pRecord: any;
  let newComposition: any;

  it('Test 1: Verifying seeded default data', () => {
    const predictions = causalEvaluationEngine.getPredictions();
    const outcomes = causalEvaluationEngine.getOutcomes();
    const learningRecords = causalEvaluationEngine.getLearningRecords();

    expect(predictions.length).toBeGreaterThanOrEqual(2);
    expect(outcomes.length).toBeGreaterThanOrEqual(2);
    expect(learningRecords.length).toBeGreaterThanOrEqual(1);
  });

  it('Test 2: Creating a new Prediction & Temporal Tracking', () => {
    pRecord = causalEvaluationEngine.createPrediction({
      missionId: 'm-test-99',
      decisionId: 'dec-999',
      capabilityId: 'http_api',
      provider: 'Provider Beta',
      expectedOutcome: 'Process 100 mock requests with low queue delay.',
      expectedDuration: 1500,
      expectedCost: 120,
      expectedReliability: 0.90,
      expectedRisk: 'LOW',
      expectedSideEffects: [],
      confidence: 0.85,
      assumptions: ['Provider Beta queue depth remains under 50'],
      evidence: ['Provider Beta standard latency benchmark is 1.4s']
    });

    expect(pRecord.predictionId).toBeDefined();

    causalEvaluationEngine.addTemporalObservation(pRecord.predictionId, 'Request batch 1-50 completed within 980ms.', 'IMMEDIATE');
    causalEvaluationEngine.addTemporalObservation(pRecord.predictionId, 'Request batch 51-100 experienced queue blocking, average 1200ms.', 'SHORT_TERM');

    const temporalObs = causalEvaluationEngine.getTemporalObservations(pRecord.predictionId);
    expect(temporalObs.length).toBe(2);
  });

  it('Test 3: Observing Outcome & Causal Attribution', () => {
    const oRecord = causalEvaluationEngine.createOutcome({
      predictionId: pRecord.predictionId,
      actualResult: 'Processed 100 mock requests. Queue delays encountered.',
      actualDuration: 2200, // higher than predicted 1500
      actualCost: 120,
      actualReliability: 0.82, // lower than predicted 0.90
      actualSideEffects: [],
      failures: [],
      externalConsequences: ['Slight delay in secondary verification worker'],
      verificationResults: ['Outcome validation PASSED with minor warnings'],
      downstreamEffects: []
    });

    expect(oRecord.predictionId).toBe(pRecord.predictionId);

    const attribution = causalEvaluationEngine.getAttribution(pRecord.predictionId);
    expect(attribution).toBeDefined();
    expect(attribution.primaryCause).toBeDefined();

    const calibration = causalEvaluationEngine.getCalibration();
    expect(calibration.overallCalibrationError).toBeDefined();
  });

  it('Test 4: Provider Reputation Adaptation & Decay', () => {
    const betaRepBefore = reputationEngine.getProviderReputation('Provider Beta');
    const initialReliability = betaRepBefore?.reliability || 0;

    // Update reputation through a simulated bad outcome on Provider Beta
    reputationEngine.updateReputationFromOutcome('Provider Beta', {
      reliability: 0.50, // very poor
      latency: 5000,
      success: false,
      costMatches: false
    });

    const betaRepAfter = reputationEngine.getProviderReputation('Provider Beta');
    expect(betaRepAfter!.reliability).toBeLessThan(initialReliability);

    // Apply decay and verify behavior
    reputationEngine.applyDecay(0.10); // 10% decay rate
    const betaRepDecayed = reputationEngine.getProviderReputation('Provider Beta');
    expect(betaRepDecayed!.reliability).toBeDefined();
  });

  it('Test 5: Evolved Capability Composition & Sandbox Benchmarking', () => {
    newComposition = capabilityEvolutionEngine.proposeComposition({
      name: 'SecureStateFailsafePipeline',
      purpose: 'Cryptographic verified multi-region backup pipeline',
      componentCapabilities: ['http_api', 'verification'],
      expectedBenefit: 'Guarantees reliable ledger state transfer with 99.9% uptime.',
      expectedRisk: 'MEDIUM',
      expectedCost: 350,
      confidence: 0.92,
      evidence: ['Seeded and tested database syncing exceptions'],
      dependencies: ['http_api'],
      rollbackStrategy: 'Revert to legacy http_api REST routes.'
    });

    expect(newComposition.compositionId).toBeDefined();

    capabilityEvolutionEngine.simulateComposition(newComposition.compositionId);
    expect(newComposition.status).toBe('SIMULATED');

    capabilityEvolutionEngine.validateComposition(newComposition.compositionId);
    expect(newComposition.status).toBe('VALIDATED');

    // Benchmark composite vs baseline
    const benchmark = capabilityEvolutionEngine.runBenchmark(newComposition.compositionId);
    expect(benchmark.compositeLatency).toBeDefined();
    expect(benchmark.baselineLatency).toBeDefined();
  });

  it('Test 6: Governed Promotion Rule Enforcement', () => {
    // Propose high risk composition
    const highRiskComposition = capabilityEvolutionEngine.proposeComposition({
      name: 'AutonomousSystemOverlordNetwork',
      purpose: 'Unrestricted execution capability to change low-level infrastructure',
      componentCapabilities: ['web_search', 'verification'],
      expectedBenefit: 'Complete autonomous infrastructure rebuilding.',
      expectedRisk: 'CRITICAL', // high risk
      expectedCost: 9999,
      confidence: 0.99,
      evidence: [],
      dependencies: [],
      rollbackStrategy: 'Disconnect power immediately.'
    });

    expect(highRiskComposition.compositionId).toBeDefined();
    capabilityEvolutionEngine.promoteComposition(highRiskComposition.compositionId);
    expect(highRiskComposition.status).not.toBe('AVAILABLE');

    // Promote low-risk composition (SecureStateFailsafePipeline is MEDIUM)
    capabilityEvolutionEngine.promoteComposition(newComposition.compositionId, 'Executive Operator');
    expect(newComposition.status).toBe('AVAILABLE');
  });
});
