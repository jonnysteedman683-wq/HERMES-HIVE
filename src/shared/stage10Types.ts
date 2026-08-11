export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SymbiontHive {
  hiveId: string;
  name: string;
  specialization: 'Temporal Reasoning' | 'Security Auditing' | 'Cognitive Synthesis' | 'Resource Allocation' | 'Evolutionary Sandbox' | 'Primary Strategist';
  status: 'ONLINE' | 'SYNCHRONIZING' | 'OFFLINE' | 'QUARANTINED';
  reputationScore: number; // 0 to 1
  latencyMs: number;
  computeShares: number; // allocated resources
  treasuryBalance: number; // in collective energy tokens (T)
  version: string;
  lastSyncAt: string;
}

export interface RecombinantMutation {
  mutationId: string;
  proposedBy: string; // Hive ID
  componentAffected: string; // e.g., "Scheduler", "A/B Benchmark", "Memory Consolidation"
  mutationTarget: string; // Code path / target heuristic name
  heuristicDiff: {
    removed: string;
    added: string;
  };
  expectedEfficiencyGainPct: number;
  expectedReliabilityGainPct: number;
  riskLevel: RiskLevel;
  status: 'PENDING_SANDBOX' | 'SANDBOX_VERIFIED' | 'COMPILING_RECURSIVE' | 'DEPLOYED_MUTATION' | 'RESTRICTED';
  safetyAuditScore: number; // 0 to 100
  sandboxExecutionLogs: string[];
  authorizedBy?: string;
  timestamp: string;
}

export interface SymbiosisSession {
  sessionId: string;
  title: string;
  participantHives: string[]; // Hive names
  objective: string;
  status: 'INITIATING' | 'COMPUTING_CONSENSUS' | 'CONSOLIDATED' | 'COMPLETED' | 'FAILED';
  sharedInsights: string[];
  computeAllocated: number;
  lastActive: string;
}

export interface HolographicNode {
  id: string;
  label: string;
  dimensionVector: number[]; // High-dimensional coordinate
  associatedInsight: string;
  sourceHive: string;
  importanceScore: number; // 0 to 1
  connections: string[]; // Node IDs
  timestamp: string;
}

export interface SuperHologram {
  lastUpdated: string;
  globalConsciousnessAlignmentPct: number;
  knowledgeEntropy: number;
  nodes: HolographicNode[];
}

export interface SymbioticTreasuryLedger {
  totalTokens: number;
  reallocationHistory: {
    id: string;
    fromHive: string;
    toHive: string;
    amount: number;
    purpose: string;
    timestamp: string;
  }[];
}

export interface Stage10SymbiosisOverview {
  totalOnlineHives: number;
  activeSymbiosisSessions: number;
  mutationsDeployedCount: number;
  overallSystemEntropy: number;
  globalConsciousnessAlignment: number; // %
  symbioticTreasuryTotal: number; // T
  recombinantSafetyCompliance: number; // %
  lastConsolidatedAt: string;
}
