import { CapabilityDescriptor, CapabilityRiskLevel, Mission, MissionTask } from '../../shared/types';

export type MissionState =
  | 'PROPOSED'
  | 'ANALYZING'
  | 'PLANNING'
  | 'AUTHORIZED'
  | 'EXECUTING'
  | 'WAITING'
  | 'WAITING_FOR_CAPABILITY'
  | 'ADAPTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PAUSED'
  | 'CANCELLED'
  | 'ABORTED';

export interface Observation {
  id: string;
  entityId: string;
  property: string;
  value: any;
  source: string;
  timestamp: string;
  confidence: number; // 0.0 to 1.0
  evidence: string;
  interpretation: string;
  expiration?: string;
}

export interface KnowledgeObject {
  id: string;
  source: string;
  provider: string;
  retrievedAt: string;
  originalContentRef: string;
  transformationHistory: string[];
  confidence: number;
  validationStatus: 'PENDING' | 'VALIDATED' | 'INVALIDATED';
  analyzingAgents: string[];
  usingHives: string[];
  decisionsInfluenced: string[];
}

export interface AutonomousMission {
  missionId: string;
  objective: string;
  motivation: string;
  constraints: string[];
  priority: number; // 1 to 5
  deadline?: string;
  budget: number; // Swarm tokens
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNLIMITED';
  requiredCapabilities: string[];
  assignedHives: string[];
  currentPlan: string[];
  progress: number;
  state: MissionState;
  evidence: string[];
  decisions: string[];
  results: any;
  createdAt: string;
  updatedAt: string;
  isResearchMission: boolean;
  baseMissionRef?: string; // Standard Mission ID in core
}

export interface CapabilityReputation {
  capabilityId: string;
  successCount: number;
  failureCount: number;
  successRate: number; // 0 to 1
  avgLatencyMs: number;
  consistencyScore: number; // 0 to 100
  accuracyScore: number; // 0 to 100
  reliabilityScore: number; // 0 to 100
  costPerUse: number; // Swarm tokens
  availability: 'online' | 'degraded' | 'offline';
  unexpectedBehaviorsCount: number;
  lastUsedAt: string;
}

export interface WorldRiskAssessment {
  riskScore: number; // 1 to 100
  actionRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  informationUncertainty: number; // 0 to 1.0
  capabilityReliability: number; // 0 to 1.0
  cascadingFailureRisk: number; // 1 to 100
  mitigationPlan: string;
  reversibility: 'EASY' | 'COMPLEX' | 'IRREVERSIBLE';
  humanApprovalRequired: boolean;
}

export interface WorldEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  source: string;
  payload: any;
  targetHives?: string[];
  targetAgents?: string[];
}
