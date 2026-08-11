import { causalEvaluationEngine } from '../server/learning/causalEvaluationEngine';
import { reputationEngine } from '../server/learning/reputationEngine';
import { capabilityEvolutionEngine } from '../server/learning/capabilityEvolutionEngine';

async function runStage9EvolutionTests() {
  console.log('=====================================================');
  console.log('   HERMES HIVE — STAGE 9 EVOLUTION & CAUSAL VERIFY   ');
  console.log('=====================================================\n');

  // Test 1: Seed verification
  console.log('--- Test 1: Verifying seeded default data ---');
  const predictions = causalEvaluationEngine.getPredictions();
  const outcomes = causalEvaluationEngine.getOutcomes();
  const learningRecords = causalEvaluationEngine.getLearningRecords();

  console.log(`Initial Predictions count: ${predictions.length}`);
  console.log(`Initial Outcomes count: ${outcomes.length}`);
  console.log(`Initial Learning Records count: ${learningRecords.length}`);

  if (predictions.length < 2) throw new Error('Expected seeded predictions data');
  if (outcomes.length < 2) throw new Error('Expected seeded outcomes data');
  if (learningRecords.length < 1) throw new Error('Expected seeded learning records');

  // Test 2: Prediction Creation & Temporal tracking
  console.log('\n--- Test 2: Creating a new Prediction & Temporal Tracking ---');
  const pRecord = causalEvaluationEngine.createPrediction({
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

  console.log(`Created Prediction ID: ${pRecord.predictionId}`);
  if (!pRecord.predictionId) throw new Error('Failed to generate prediction ID');

  causalEvaluationEngine.addTemporalObservation(pRecord.predictionId, 'Request batch 1-50 completed within 980ms.', 'IMMEDIATE');
  causalEvaluationEngine.addTemporalObservation(pRecord.predictionId, 'Request batch 51-100 experienced queue blocking, average 1200ms.', 'SHORT_TERM');

  const temporalObs = causalEvaluationEngine.getTemporalObservations(pRecord.predictionId);
  console.log(`Temporal Observations tracked: ${temporalObs.length}`);
  if (temporalObs.length !== 2) throw new Error('Expected exactly 2 temporal observations');

  // Test 3: Outcome Creation, Causal Attribution & Calibration
  console.log('\n--- Test 3: Observing Outcome & Causal Attribution ---');
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

  console.log(`Outcome recorded under prediction ID: ${oRecord.predictionId}`);
  const attribution = causalEvaluationEngine.getAttribution(pRecord.predictionId);
  console.log(`Causal Attribution Primary Cause: "${attribution?.primaryCause}"`);
  if (!attribution) throw new Error('Attribution was not automatically evaluated');

  const calibration = causalEvaluationEngine.getCalibration();
  console.log(`Overall Prediction Calibration Error: ${calibration.overallCalibrationError.toFixed(2)}%`);

  // Test 4: Provider & Capability Reputation Updates & Decay
  console.log('\n--- Test 4: Provider Reputation Adaptation & Decay ---');
  const betaRepBefore = reputationEngine.getProviderReputation('Provider Beta');
  const initialReliability = betaRepBefore?.reliability || 0;
  console.log(`Provider Beta initial reliability: ${(initialReliability * 100).toFixed(1)}%`);

  // Update reputation through an simulated bad outcome on Provider Beta
  reputationEngine.updateReputationFromOutcome('Provider Beta', {
    reliability: 0.50, // very poor
    latency: 5000,
    success: false,
    costMatches: false
  });

  const betaRepAfter = reputationEngine.getProviderReputation('Provider Beta');
  console.log(`Provider Beta reliability after bad outcome: ${(betaRepAfter!.reliability * 100).toFixed(1)}%`);
  if (betaRepAfter!.reliability >= initialReliability) {
    throw new Error('Reputation reliability should have decreased after a bad outcome');
  }

  // Apply decay and verify restoration behavior
  console.log('Applying temporal decay...');
  reputationEngine.applyDecay(0.10); // 10% decay rate
  const betaRepDecayed = reputationEngine.getProviderReputation('Provider Beta');
  console.log(`Provider Beta reliability after decay: ${(betaRepDecayed!.reliability * 100).toFixed(1)}%`);

  // Test 5: Capability Evolution, Simulation, Validation & Benchmarking
  console.log('\n--- Test 5: Evolved Capability Composition & Sandbox Benchmarking ---');
  const newComposition = capabilityEvolutionEngine.proposeComposition({
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

  console.log(`Proposed new Composite Capability ID: ${newComposition.compositionId}`);
  console.log(`Current Status: ${newComposition.status}`);

  capabilityEvolutionEngine.simulateComposition(newComposition.compositionId);
  console.log(`Status after simulation: ${newComposition.status}`);
  if ((newComposition.status as string) !== 'SIMULATED') throw new Error('Status should be SIMULATED');

  capabilityEvolutionEngine.validateComposition(newComposition.compositionId);
  console.log(`Status after validation: ${newComposition.status}`);
  if ((newComposition.status as string) !== 'VALIDATED') throw new Error('Status should be VALIDATED');

  // Benchmark composite vs baseline
  const benchmark = capabilityEvolutionEngine.runBenchmark(newComposition.compositionId);
  console.log(`Benchmark Latency -> Composite: ${benchmark.compositeLatency}ms, Baseline: ${benchmark.baselineLatency}ms`);
  console.log(`Benchmark Success -> Composite: ${benchmark.compositeSuccessPct}%, Baseline: ${benchmark.baselineSuccessPct}%`);
  console.log(`Improvement Detected: ${benchmark.improvementDetected ? 'YES' : 'NO'}`);

  // Test 6: Governed Promotion
  console.log('\n--- Test 6: Governed Promotion Rule Enforcement ---');
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

  console.log(`High-Risk Composite ID: ${highRiskComposition.compositionId}, Risk: ${highRiskComposition.expectedRisk}`);
  capabilityEvolutionEngine.promoteComposition(highRiskComposition.compositionId);
  console.log(`Status after promotion attempt: ${highRiskComposition.status}`);
  if ((highRiskComposition.status as string) === 'AVAILABLE') {
    throw new Error('High-risk composition must NOT be promoted without explicit human authorization');
  }
  console.log('Success: High-risk composition promotion was successfully blocked.');

  // Promote low-risk composition (SecureStateFailsafePipeline is MEDIUM, lets try promoting it)
  capabilityEvolutionEngine.promoteComposition(newComposition.compositionId, 'Executive Operator');
  console.log(`Medium-Risk Composite Status after promotion: ${newComposition.status}`);
  if ((newComposition.status as string) !== 'AVAILABLE') {
    throw new Error('Expected medium-risk composition to be promotable');
  }

  console.log('\n=====================================================');
  console.log('   ALL STAGE 9 CAUSAL & EVOLUTION TESTS PASSED!');
  console.log('=====================================================\n');
}

runStage9EvolutionTests().catch((err) => {
  console.error('Stage 9 Evolution Test Failed:', err);
  process.exit(1);
});
