export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PredictionRecord {
  predictionId: string;
  missionId: string;
  decisionId: string;
  capabilityId: string;
  provider: string;
  expectedOutcome: string;
  expectedDuration: number;
  expectedCost: number;
  expectedReliability: number;
  expectedRisk: RiskLevel;
  expectedSideEffects: string[];
  confidence: number;
  assumptions: string[];
  evidence: string[];
  timestamp: string;
}

export interface OutcomeRecord {
  outcomeId: string;
  predictionId: string;
  actualResult: string;
  actualDuration: number;
  actualCost: number;
  actualReliability: number;
  actualSideEffects: string[];
  failures: string[];
  externalConsequences: string[];
  verificationResults: string[];
  downstreamEffects: string[];
  timestamp: string;
}

export interface CausalAttribution {
  primaryCause: string;
  contributingFactors: { factor: string; influence: number }[];
  unknownFactors: string[];
  confidence: number;
}

export interface CausalGraph {
  graphId: string;
  predictionId: string;
  decisionId: string;
  capabilityId: string;
  provider: string;
  action: string;
  immediateResult: string;
  worldStateChanges: string[];
  downstreamEvents: string[];
  finalOutcome: string;
  alternativeHypotheses: string[];
}

export interface CalibrationBucket {
  confidenceBin: number; // e.g., 0.1, 0.2, ..., 1.0
  expectedSuccessRate: number;
  observedSuccessRate: number;
  sampleSize: number;
  calibrationError: number;
}

export interface PredictionCalibration {
  overallCalibrationError: number;
  buckets: CalibrationBucket[];
  confidenceByCapability: Record<string, number>;
  confidenceByProvider: Record<string, number>;
  confidenceByContext: Record<string, number>;
  lastEvaluatedAt: string;
}

export interface ProviderReputation {
  provider: string;
  reliability: number; // 0 to 1
  latency: number; // average ms
  costAccuracy: number; // 0 to 1
  quality: number; // 0 to 1
  availability: number; // 0 to 1
  failureRate: number; // 0 to 1
  securityHistory: string[];
  verificationSuccessPct: number;
  predictionAccuracyPct: number;
  environmentalSensitivity: string[];
  confidence: number; // 0 to 1
  lastEvaluatedAt: string;
}

export interface CapabilityReputation {
  capabilityId: string;
  provider: string;
  reliability: number;
  latency: number;
  costAccuracy: number;
  quality: number;
  availability: number;
  lastEvaluatedAt: string;
}

export type CapabilityCompositionStatus = 'PROPOSED' | 'SIMULATED' | 'VALIDATED' | 'AVAILABLE';

export interface CapabilityComposition {
  compositionId: string;
  name: string;
  purpose: string;
  componentCapabilities: string[];
  expectedBenefit: string;
  expectedRisk: RiskLevel;
  expectedCost: number;
  confidence: number;
  evidence: string[];
  dependencies: string[];
  rollbackStrategy: string;
  status: CapabilityCompositionStatus;
  createdAt: string;
}

export interface LearningRecord {
  id: string;
  observation: string;
  hypothesis: string;
  experiment: string;
  outcome: string;
  conclusion: string;
  confidence: number;
  provenance: string[];
  timestamp: string;
}

export interface Stage9LearningOverview {
  predictionsCount: number;
  outcomesCount: number;
  predictionAccuracy: number; // %
  calibrationError: number; // %
  capabilitiesImproved: number;
  activeExperimentsCount: number;
  newCompositionsCount: number;
  lastEvaluatedAt: string;
}
