export type AgentRole =
  | 'Executive'
  | 'Researcher'
  | 'Analyst'
  | 'Planner'
  | 'Developer'
  | 'Tester'
  | 'Debugger'
  | 'SecurityAgent'
  | 'DataAgent'
  | 'Reviewer'
  | 'Critic'
  | 'Writer'
  | 'Explorer'
  | 'Coordinator';

export type AgentStatus = 'idle' | 'working' | 'paused' | 'failed' | 'waiting' | 'terminated';

export type OperatingMode =
  | 'MANUAL'
  | 'ASSISTED'
  | 'AUTONOMOUS'
  | 'SUPERVISED_AUTONOMOUS';

export type AgentHealth = 'healthy' | 'degraded' | 'unresponsive' | 'offline';

export type AgentLifecycleState =
  | 'CREATED'
  | 'INITIALIZING'
  | 'AVAILABLE'
  | 'WORKING'
  | 'DEGRADED'
  | 'PAUSED'
  | 'RECOVERING'
  | 'RETIRED'
  | 'FAILED';

export interface AgentReputation {
  successRate: number;         // 0 to 1
  verificationScore?: number;   // 0 to 1
  verificationRate?: number;    // 0 to 1
  failureRate: number;         // 0 to 1
  recoveryRate?: number;        // 0 to 1
  averageLatencyMs?: number;    // ms
  averageCost?: number;         // token count or units
  toolReliability?: number;     // 0 to 1
  specializationScores?: Record<string, number>; // domain/role -> 0-100
  collaborationScore?: number;  // 0 to 1
  recentFailures?: number;      // count
  taskCompletionRate?: number;  // 0 to 1
  tasksCompleted?: number;      // count
  missionsCompleted?: number;   // count
  resourceEfficiency?: number;  // 0 to 1
  score: number;               // 0 to 100 overall
}

export interface AgentResourceUsage {
  cpuPct: number;
  memoryMb: number;
  tokensUsed: number;
  apiCallsCount: number;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  capabilities: string[];
  status: AgentStatus;
  lifecycleState: AgentLifecycleState;
  health: AgentHealth;
  currentTaskId?: string;
  currentMissionId?: string;
  lastHeartbeat: string;
  createdAt: string;
  reputation: AgentReputation;
  resourceUsage: AgentResourceUsage;
  clusterId: string; // Cluster A, B, or C
  systemPrompt?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  permissions?: string[];
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskFactors {
  impact: number;              // 1 to 10
  uncertainty: number;         // 1 to 10
  reversibility: number;       // 1 to 10 (10 = irreversible)
  privilege: number;           // 1 to 10
  externality: number;         // 1 to 10
  securitySensitivity: number; // 1 to 10
  resourceCost: number;        // 1 to 10
}

export interface RiskAssessment {
  id: string;
  actionType: string;
  targetResource?: string;
  agentId?: string;
  riskLevel: RiskLevel;
  score: number; // 0 to 100
  factors: RiskFactors;
  requiredApproval: 'AUTONOMOUS' | 'VERIFICATION_REQUIRED' | 'MULTI_AGENT_APPROVAL' | 'EXPLICIT_HUMAN_AUTHORIZATION';
  timestamp: string;
}

export interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  category: 'tool' | 'autonomy' | 'resource' | 'security' | 'prohibited';
  enabled: boolean;
  prohibitedOperations?: string[];
  maxResourceLimit?: number;
  requiredRolesForApproval?: AgentRole[];
  requireHumanApprovalAboveRisk?: RiskLevel;
}

export interface CapabilityDefinition {
  id: string;
  name: string;
  description: string;
  category: 'research' | 'engineering' | 'security' | 'verification' | 'governance' | 'data';
  requiredTools: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  defaultPermissions: string[];
}

export type WorldEntityType =
  | 'System'
  | 'Repository'
  | 'Service'
  | 'Agent'
  | 'User'
  | 'Mission'
  | 'Dependency'
  | 'Tool'
  | 'Risk'
  | 'Resource'
  | 'Event'
  | 'Assumption'
  | 'Knowledge'
  | 'Observation'
  | 'Unknown';

export type WorldRelationType =
  | 'DEPENDS_ON'
  | 'AFFECTS'
  | 'OWNS'
  | 'EXECUTES'
  | 'VERIFIES'
  | 'USES'
  | 'THREATENS'
  | 'BLOCKS'
  | 'PRODUCED_BY'
  | 'PROVIDES';

export interface WorldEntity {
  id: string;
  name: string;
  type: WorldEntityType;
  description: string;
  state: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorldRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: WorldRelationType;
  metadata?: Record<string, unknown>;
}

export interface DebateProposal {
  id: string;
  agentId: string;
  agentName: string;
  title: string;
  strategySummary: string;
  estimatedCostTokens: number;
  estimatedTimeSec: number;
  confidence: number;
}

export interface DebateObjection {
  id: string;
  agentId: string;
  agentName: string;
  targetProposalId: string;
  objection: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface MissionEvaluation {
  id: string;
  missionId: string;
  score: number; // 0 to 100
  success: boolean;
  failuresCount: number;
  inefficienciesDetected: string[];
  lessonsLearned: string[];
  recommendations: string[];
  confidence: number;
  evaluatedAt: string;
}

export interface ResourceBudget {
  id: string;
  entityType: 'mission' | 'goal' | 'task' | 'agent' | 'tool';
  entityId: string;
  maxTokens: number;
  consumedTokens: number;
  maxApiCalls: number;
  consumedApiCalls: number;
  updatedAt: string;
}

export interface LedgerEvent {
  eventId: string;
  timestamp: string;
  traceId: string;
  missionId?: string;
  goalId?: string;
  taskId?: string;
  agentId?: string;
  eventType: string;
  payload: Record<string, unknown>;
  causalParentId?: string;
}

export interface SwarmLearningRecord {
  id: string;
  category: 'strategy' | 'agent_assignment' | 'tool_reliability' | 'discovery' | 'recovery';
  title: string;
  knowledgeContent: string;
  confidenceScore: number; // 0 to 1
  verificationValidated: boolean;
  sourceMissionId?: string;
  promotedToSemanticMemory: boolean;
  createdAt: string;
}

export interface DebateRecord {
  id: string;
  topic: string;
  missionId?: string;
  proposals: DebateProposal[];
  objections: DebateObjection[];
  evidencePoints: string[];
  winningProposalId: string;
  finalDecisionSummary: string;
  rejectedAlternatives: string[];
  consensusConfidence: number; // 0 to 1
  createdAt: string;
}

export interface SimulationResult {
  id: string;
  missionId: string;
  missionTitle: string;
  predictedSuccessProbability: number; // 0 to 1
  riskLevel: RiskLevel;
  estimatedCostTokens: number;
  estimatedDurationMs: number;
  potentialSideEffects: string[];
  rollbackDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
  securityImpact: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceScore: number; // 0 to 1
  verificationRequired: boolean;
  humanApprovalRequired: boolean;
  simulatedAt: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  clusterId: string;
  capabilities: string[];
  assignedTools: string[];
  defaultPermissions: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  systemPrompt: string;
}

export type GoalStatus =
  | 'PROPOSED'
  | 'ACTIVE'
  | 'BLOCKED'
  | 'PAUSED'
  | 'DEFERRED'
  | 'COMPLETED'
  | 'FAILED'
  | 'ABANDONED'
  | 'SUPERSEDED';

export interface Goal {
  id: string;
  missionId: string;
  parentGoalId?: string;
  childGoalIds: string[];
  title: string;
  description: string;
  status: GoalStatus;
  priority: number; // 1 to 5
  progress: number; // 0 to 100
  assignedAgentIds: string[];
  taskIds: string[];
  dependencies: string[]; // Goal IDs
  blockingReason?: string;
  obsoleteReason?: string;
  conflictReason?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export type TaskStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface MissionTask {
  id: string;
  missionId: string;
  title: string;
  description: string;
  requiredRole: AgentRole;
  requiredCapabilities: string[];
  dependencies: string[]; // task IDs
  status: TaskStatus;
  assignedAgentId?: string;
  assignedAgentName?: string;
  result?: string;
  verificationRequired: boolean;
  verified?: boolean;
  verificationComments?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  externalTaskId?: string;
}

export type MissionStatus =
  | 'created'
  | 'planning'
  | 'in_progress'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'recovering';

export interface MissionResult {
  summary: string;
  deliverables: { title: string; content: string; format?: string }[];
  keyFindings: string[];
  confidenceScore: number; // 0 to 1
  verifiedBy?: string;
  completedAt: string;
}

export interface Mission {
  id: string;
  objective: string;
  title?: string;
  description?: string;
  status: MissionStatus;
  priority: number; // 1 (lowest) to 5 (highest)
  tasks: MissionTask[];
  assignedAgents: string[];
  progress: number; // 0 to 100
  createdAt: string;
  updatedAt: string;
  result?: MissionResult;
  executionLog: string[];
}

export type HiveEventType =
  | 'PING'
  | 'TASK_ASSIGNMENT'
  | 'TASK_ACCEPTED'
  | 'TASK_PROGRESS'
  | 'TASK_RESULT'
  | 'TASK_FAILURE'
  | 'AGENT_CREATED'
  | 'AGENT_STARTED'
  | 'AGENT_STOPPED'
  | 'AGENT_FAILED'
  | 'AGENT_HEARTBEAT'
  | 'AGENT_STATE_CHANGED'
  | 'AGENT_REPUTATION_UPDATED'
  | 'OPERATING_MODE_CHANGED'
  | 'LOOP_PHASE_CHANGED'
  | 'MISSION_CREATED'
  | 'MISSION_UPDATED'
  | 'MISSION_COMPLETED'
  | 'MISSION_FAILED'
  | 'GOAL_CREATED'
  | 'GOAL_UPDATED'
  | 'GOAL_COMPLETED'
  | 'GOAL_BLOCKED'
  | 'GOAL_SUPERSEDED'
  | 'CAPABILITY_REGISTERED'
  | 'WORLD_MODEL_UPDATED'
  | 'SIMULATION_COMPLETED'
  | 'RISK_ASSESSED'
  | 'GOVERNANCE_CHECK'
  | 'DEBATE_RECORDED'
  | 'EVALUATION_COMPLETED'
  | 'LEARNING_PROMOTED'
  | 'RESOURCE_BUDGET_UPDATED'
  | 'LEDGER_ENTRY'
  | 'KNOWLEDGE_SHARED'
  | 'VERIFICATION_REQUEST'
  | 'VERIFICATION_RESULT'
  | 'SYSTEM_ALERT'
  | 'HERMES_DECISION'
  | 'HEALING_ACTION'
  | 'AGENT_DIRECT_MESSAGE'
  | 'RESEARCH_TRIGGERED'
  | 'CAPABILITY_DISCOVERED'
  | 'REPUTATION_DECAY_APPLIED'
  | 'CAPABILITY_REPUTATION_UPDATED'
  | 'BRIDGE_WARNING'
  | 'OUTCOME_VERIFIED'
  | 'WORLD_EVENT_INGESTED'
  | 'EMERGENCY_CONTROL';

export interface HiveEvent {
  id: string;
  type: HiveEventType;
  timestamp: string;
  source: string;
  missionId?: string;
  taskId?: string;
  agentId?: string;
  severity: 'info' | 'success' | 'warning' | 'error' | 'critical';
  payload: Record<string, unknown>;
}

export type MemoryLayer =
  | 'working'    // Active mission context
  | 'episodic'   // Past mission experiences
  | 'semantic'   // Validated facts and knowledge
  | 'procedural' // Successful execution patterns & workflows
  | 'agent';      // Agent specific context

export interface MemoryRecord {
  id: string;
  layer: MemoryLayer;
  key: string;
  content: string;
  tags: string[];
  sourceMissionId?: string;
  sourceAgentId?: string;
  confidence: number;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
}

export type HermesDecisionType =
  | 'CREATE_MISSION'
  | 'CREATE_AGENT'
  | 'ASSIGN_TASK'
  | 'REASSIGN_TASK'
  | 'REQUEST_VERIFICATION'
  | 'RETRY_TASK'
  | 'COMPLETE_MISSION'
  | 'REBALANCE_SWARM'
  | 'ESCALATE';

export interface HermesAction {
  actionType: HermesDecisionType;
  targetId?: string;
  details: Record<string, unknown>;
}

export interface HermesDecision {
  id: string;
  type: HermesDecisionType;
  reasoningSummary: string;
  actions: HermesAction[];
  confidence: number;
  timestamp: string;
}

export interface ToolContext {
  agentId?: string;
  missionId?: string;
  taskId?: string;
  permissions: string[];
}

export interface ToolResult {
  success: boolean;
  output: unknown;
  error?: string;
  executionTimeMs: number;
}

export interface HiveTool {
  name: string;
  description: string;
  permissions: string[];
  execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult>;
}

export interface DiagnosticsMetrics {
  hiveHealthPct: number;
  agentHealthPct: number;
  missionSuccessRatePct: number;
  taskFailureRatePct: number;
  avgTaskDurationSec: number;
  activeAgentsCount: number;
  idleAgentsCount: number;
  failedAgentsCount: number;
  messageThroughputPerMin: number;
  memoryRecordsCount: number;
  totalAiRequests: number;
  totalTokensUsed: number;
  avgAiLatencyMs: number;
  recoveryCount: number;
  uptimeSeconds: number;
  providerName?: string;
}

/* ==========================================================================
   STAGE 4 — FEDERATION & HIVE OPERATING SYSTEM TYPES
   ========================================================================== */

export type HiveStatus =
  | 'INITIALIZING'
  | 'ONLINE'
  | 'DEGRADED'
  | 'BUSY'
  | 'PAUSED'
  | 'QUARANTINED'
  | 'OFFLINE'
  | 'RETIRED';

export interface HiveIdentity {
  hiveId: string;
  name: string;
  description: string;
  version: string;
  capabilities: string[];
  specializations: string[];
  governanceProfile: string;
  resourceCapacity: {
    maxTokensPerMin: number;
    maxParallelMissions: number;
    availableAgents: number;
  };
  reputation: number; // 0-100
  status: HiveStatus;
  createdAt: string;
  updatedAt: string;
}

export type FederationMessageType =
  | 'HIVE_DISCOVERY'
  | 'CAPABILITY_ADVERTISEMENT'
  | 'MISSION_REQUEST'
  | 'MISSION_PROPOSAL'
  | 'MISSION_ACCEPTED'
  | 'MISSION_REJECTED'
  | 'MISSION_COMPLETED'
  | 'RESOURCE_REQUEST'
  | 'RESOURCE_OFFER'
  | 'RESOURCE_ACCEPTED'
  | 'RESOURCE_DECLINED'
  | 'KNOWLEDGE_REQUEST'
  | 'KNOWLEDGE_RESPONSE'
  | 'HEALTH_UPDATE'
  | 'ESCALATION'
  | 'FEDERATION_ALERT';

export interface FederationMessage {
  messageId: string;
  federationId: string;
  sourceHive: string;
  destinationHive: string;
  timestamp: string;
  messageType: FederationMessageType;
  correlationId?: string;
  payload: Record<string, unknown>;
  signature: string;
}

export type ContractStatus =
  | 'PROPOSED'
  | 'NEGOTIATING'
  | 'ACCEPTED'
  | 'ACTIVE'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'FAILED'
  | 'DISPUTED'
  | 'CANCELLED';

export interface MissionContract {
  contractId: string;
  requestingHive: string;
  executingHive: string;
  objective: string;
  successCriteria: string[];
  resourceBudget: {
    maxTokens: number;
    maxApiCalls: number;
  };
  deadline: string;
  riskLevel: RiskLevel;
  verificationRequirements: string[];
  permissions: string[];
  deliverables: string[];
  rollbackPolicy: string;
  status: ContractStatus;
  createdAt: string;
}

export type TrustLevel = 'UNKNOWN' | 'LIMITED' | 'TRUSTED' | 'HIGH_TRUST' | 'QUARANTINED';

export interface TrustRecord {
  hiveId: string;
  trustLevel: TrustLevel;
  trustScore: number; // 0 - 100
  historicalSuccessCount: number;
  historicalFailureCount: number;
  lastVerifiedAt: string;
}

export interface ResourceMarketListing {
  listingId: string;
  hiveId: string;
  hiveName: string;
  resourceType: 'TOKEN_BUDGET' | 'COMPUTE' | 'AGENT_CAPACITY' | 'SPECIALIZED_CAPABILITIES';
  availableQuantity: number;
  unitCostTokens: number;
  estimatedLatencyMs: number;
  reputationScore: number;
}

export interface OrganizationDivision {
  id: string;
  name: string;
  description: string;
  leadAgentId: string;
  budgetTokens: number;
  currentProjectsCount: number;
  kpis: Record<string, number>;
}

export interface StrategicObjective {
  id: string;
  title: string;
  description: string;
  priority: number; // 1-5
  successCriteria: string[];
  targetDate: string;
  progressPct: number;
  status: 'ACTIVE' | 'ACHIEVED' | 'BEHIND';
  createdAt: string;
}

export interface OpportunityProposal {
  proposalId: string;
  title: string;
  description: string;
  evidence: string;
  expectedValue: number; // 0-100
  estimatedCostTokens: number;
  riskLevel: RiskLevel;
  confidence: number; // 0-1
  recommendedAction: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'CONVERTED';
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  opportunityId?: string;
  divisionId?: string;
  missionsCount: number;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface HiveOSStatus {
  operatingMode: OperatingMode;
  schedulerState: 'IDLE' | 'SCHEDULING' | 'EXECUTING';
  activeHivesCount: number;
  activeContractsCount: number;
  totalResourceTokensAvailable: number;
  systemHealth: number;
}

export interface SelfModel {
  identity: string;
  version: string;
  architecture: string;
  capabilities: string[];
  limitations: string[];
  activeAgentsCount: number;
  activeHivesCount: number;
  availableToolsCount: number;
  resourcesAvailableTokens: number;
  activeGoalsCount: number;
  activeProjectsCount: number;
  activeExperimentsCount: number;
  dependencies: string[];
  healthScore: number;
  performanceScore: number;
  securityState: string;
  governanceState: string;
  knowledgeRecordsCount: number;
  capabilityGapsCount: number;
  confidenceScore: number;
  updatedAt: string;
}

export type CapabilityClassification = 'CORE' | 'SPECIALIZED' | 'EMERGING' | 'DEGRADED' | 'EXPERIMENTAL' | 'MISSING';

export interface CapabilityItem {
  id: string;
  name: string;
  owner: string;
  assignedAgents: string[];
  assignedHives: string[];
  classification: CapabilityClassification;
  confidenceScore: number; // 0-1
  historicalPerformancePct: number;
  availabilityPct: number;
  costTokensPerOp: number;
  riskLevel: RiskLevel;
}

export interface CapabilityGap {
  gapId: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedSystems: string[];
  recommendedAction: string;
}

export interface OrganisationHealthMetrics {
  overall: number;
  reliability: number;
  efficiency: number;
  security: number;
  knowledge: number;
  innovation: number;
  federation: number;
  resilience: number;
  confidence: number;
}

export type ScenarioType =
  | 'RESOURCE_REALLOCATION'
  | 'AGENT_FAILURE'
  | 'HIVE_FAILURE'
  | 'NEW_HIVE'
  | 'NEW_CAPABILITY'
  | 'PROJECT_ACCELERATION'
  | 'PROJECT_CANCELLATION'
  | 'ARCHITECTURE_CHANGE'
  | 'POLICY_CHANGE_PROPOSAL'
  | 'LOAD_INCREASE'
  | 'DEPENDENCY_FAILURE';

export interface ScenarioResult {
  scenarioId: string;
  title: string;
  scenarioType: ScenarioType;
  assumptions: string[];
  predictedOutcome: string;
  successProbability: number; // 0-1
  resourceImpactDeltaTokens: number;
  riskImpactLevel: RiskLevel;
  performanceImpactPct: number;
  failureModes: string[];
  recoveryOptions: string[];
  confidenceScore: number; // 0-1
  simulatedAt: string;
}

export type ForesightHorizon = 'BASELINE' | 'OPTIMISTIC' | 'ADVERSE' | 'CRITICAL' | 'TRANSFORMATIONAL';

export interface StrategicForesightScenario {
  id: string;
  horizon: ForesightHorizon;
  title: string;
  description: string;
  probabilityPct: number;
  keyDrivers: string[];
  predictedRisks: string[];
  recommendedInitiatives: string[];
}

export interface InstitutionalDecision {
  decisionId: string;
  objective: string;
  context: string;
  alternativesConsidered: string[];
  selectedStrategy: string;
  evidence: string;
  riskLevel: RiskLevel;
  expectedOutcome: string;
  actualOutcome?: string;
  confidenceScore: number;
  decisionMaker: string;
  timestamp: string;
}

export interface PredictionRecord {
  id: string;
  scenarioId: string;
  metricName: string;
  predictedValue: number;
  actualValue?: number;
  variancePct?: number;
  accuracyScore?: number; // 0-100
  evaluatedAt?: string;
}

export interface EvolutionHypothesis {
  hypothesisId: string;
  statement: string;
  evidence: string;
  expectedEffect: string;
  measurementMetric: string;
  riskLevel: RiskLevel;
  confidenceScore: number;
  createdAt: string;
}

export type ExperimentStatus = 'PROPOSED' | 'RUNNING' | 'COMPLETED' | 'VERIFIED' | 'PROMOTED' | 'REJECTED' | 'ROLLED_BACK';

export interface ExperimentRecord {
  experimentId: string;
  hypothesisId: string;
  title: string;
  baselineStrategy: string;
  candidateStrategy: string;
  isolationLevel: 'SANDBOX' | 'SIMULATION' | 'TEST_ENVIRONMENT' | 'STAGING';
  status: ExperimentStatus;
  metrics: {
    baselineLatencyMs: number;
    candidateLatencyMs: number;
    baselineSuccessRatePct: number;
    candidateSuccessRatePct: number;
    costDeltaTokensPct: number;
  };
  durationMinutes: number;
  resourceBudgetTokens: number;
  riskLevel: RiskLevel;
  resultsSummary?: string;
  startedAt?: string;
  completedAt?: string;
}

export type TaskQueueStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timed_out';
export type TaskKind = 'agent_llm' | 'agent_tool' | 'tool_execute' | 'llm_generate' | 'health_check' | 'system' | string;

export interface TaskSpec {
  taskId?: string;
  kind: TaskKind;
  agentId?: string;
  agentRole?: AgentRole;
  agentCapabilities?: string[];
  systemPrompt?: string;
  prompt: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  requiredCapabilities?: string[];
  timeoutMs?: number;
  retryPolicy?: {
    maxRetries?: number;
    backoffMs?: number;
    backoffMultiplier?: number;
    maxBackoffMs?: number;
  };
  priority?: number;
  context?: Record<string, unknown>;
}

export interface TaskRecord extends TaskSpec {
  id: string;
  status: TaskQueueStatus;
  priority: number;
  retryCount: number;
  output?: string;
  error?: string;
  tokensUsed?: number;
  latencyMs?: number;
  modelUsed?: string;
  verificationScore?: number;
  verificationComments?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  workerPid?: number | null;
  errorHistory?: Array<{ error: string; timestamp: string; attempt?: number }>;
  context?: Record<string, unknown>;
  requiredCapabilities?: string[];
  toolName?: string | null;
  toolArgs?: Record<string, unknown> | null;
  retryPolicy?: {
    maxRetries?: number;
    backoffMs?: number;
    backoffMultiplier?: number;
    maxBackoffMs?: number;
  } | null;
  updatedAt: string;
  agentRole?: AgentRole | null;
  agentCapabilities?: string[];
  systemPrompt?: string | null;
}

export interface TaskResult {
  taskId: string;
  status: 'completed' | 'failed' | 'cancelled' | 'timed_out';
  output?: string;
  error?: string;
  tokensUsed?: number;
  latencyMs?: number;
  modelUsed?: string;
  verificationScore?: number;
  verificationComments?: string;
  completedAt?: string;
}

export interface WorkerRegistration {
  workerId: string;
  pid: number;
  backend: string;
  supportedTaskKinds: string[];
  maxConcurrency: number;
  currentLoad: number;
  lastHeartbeat: string;
  startedAt: string;
}

export type CapabilityGeneState = 'MISSING' | 'EMERGING' | 'EXPERIMENTAL' | 'VALIDATED' | 'MATURE' | 'DEGRADED' | 'DEPRECATED';

export interface CapabilityGene {
  capabilityId: string;
  category: string;
  dependencies: string[];
  requiredTools: string[];
  requiredAgents: string[];
  requiredModels: string[];
  performancePct: number;
  reliabilityPct: number;
  costTokensPerOp: number;
  state: CapabilityGeneState;
  confidenceScore: number;
}

export type ProjectLifecycle = 'PROPOSED' | 'EVALUATING' | 'APPROVED' | 'ACTIVE' | 'PAUSED' | 'BLOCKED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'ARCHIVED';

export interface PortfolioItem {
  projectId: string;
  name: string;
  description: string;
  strategicValue: number; // 1-100
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  costTokensBudget: number;
  costTokensConsumed: number;
  riskLevel: RiskLevel;
  status: ProjectLifecycle;
  progressPct: number;
  dependencies: string[];
  assignedHiveId: string;
  updatedAt: string;
}

export interface ResearchProgram {
  programId: string;
  title: string;
  domain: string;
  questions: string[];
  researchMissionsCount: number;
  activeExperimentsCount: number;
  confidenceScore: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  createdAt: string;
}

export interface EvolutionProposal {
  proposalId: string;
  title: string;
  changeDescription: string;
  evidence: string;
  expectedBenefit: string;
  costEstimateTokens: number;
  riskLevel: RiskLevel;
  affectedSystems: string[];
  simulationResults: string;
  experimentResults: string;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'FAILED';
  rollbackPlan: string;
  confidenceScore: number;
  createdAt: string;
}

// ==========================================
// STAGE 7: FEDERATION & MULTI-HIVE TYPES
// ==========================================

export type FederatedHiveState =
  | 'DISCOVERING'
  | 'PENDING_TRUST'
  | 'ACTIVE'
  | 'DEGRADED'
  | 'UNREACHABLE'
  | 'PARTITIONED'
  | 'QUARANTINED'
  | 'SUSPENDED'
  | 'REMOVED';

export type FederatedTrustLevel =
  | 'UNTRUSTED'
  | 'PENDING'
  | 'LIMITED'
  | 'TRUSTED'
  | 'HIGH_TRUST'
  | 'DEGRADED'
  | 'QUARANTINED'
  | 'REVOKED';

export type QuarantineStatus =
  | 'NONE'
  | 'WARNING'
  | 'RESTRICTED'
  | 'QUARANTINED'
  | 'ISOLATED';

export interface FederatedHiveIdentity {
  hiveId: string;
  name: string;
  description: string;
  publicKey: string;
  createdAt: string;
  federationMembershipState: FederatedHiveState;
  capabilityProfile: string[];
  version: string;
  trustStatus: FederatedTrustLevel;
  governanceFingerprint: string;
  protocolVersion: string;
}

export interface FederatedHiveRecord {
  identity: FederatedHiveIdentity;
  state: FederatedHiveState;
  lastSeenHeartbeat: string;
  endpoint: string;
  reputationScore: number;
  trustScore: number;
  quarantineStatus: QuarantineStatus;
  capabilities: string[];
}

export interface FederatedTrustRecord {
  hiveId: string;
  trustLevel: FederatedTrustLevel;
  trustScore: number; // 0-100
  verifiedEvidence: string[];
  historicalReliabilityPct: number;
  policyCompliancePct: number;
  lastEvaluatedAt: string;
}

export interface FederatedMessage {
  messageId: string;
  sourceHiveId: string;
  destinationHiveId: string;
  messageType: string;
  timestamp: string;
  correlationId: string;
  protocolVersion: string;
  payload: Record<string, unknown>;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  expiration: string;
  signature: string;
  deliveryStatus: 'PENDING' | 'DELIVERED' | 'FAILED' | 'REJECTED' | 'REPLAY_BLOCKED';
}

export interface FederatedTask {
  taskId: string;
  originatorHiveId: string;
  assignedHiveId?: string;
  objective: string;
  requiredCapabilities: string[];
  constraints: string[];
  priority: number;
  deadline: string;
  tokenBudget: number;
  compensationTokens: number;
  riskClassification: RiskLevel;
  status: 'PUBLISHED' | 'BIDDING' | 'ASSIGNED' | 'EXECUTING' | 'VERIFYING' | 'SETTLED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
}

export interface FederatedTaskBid {
  bidId: string;
  taskId: string;
  biddingHiveId: string;
  biddingHiveName: string;
  capabilitiesMatched: string[];
  estimatedCompletionTimeSec: number;
  confidence: number; // 0-1
  bidPriceTokens: number;
  reputationScore: number;
  bidScore: number;
  submittedAt: string;
}

export interface FederatedMemoryRecord {
  memoryId: string;
  sourceHiveId: string;
  category: string;
  content: string;
  provenance: string;
  confidence: number;
  evidence: string;
  validationState: 'RECEIVED' | 'UNVERIFIED' | 'CORROBORATED' | 'VALIDATED' | 'PROMOTED' | 'REJECTED';
  timestamp: string;
  replicationState: 'LOCAL_ONLY' | 'REPLICATING' | 'FULLY_REPLICATED';
  conflictState?: {
    hasConflict: boolean;
    conflictingMemoryId?: string;
    resolutionDetails?: string;
  };
}

export interface FederatedConsensusProposal {
  proposalId: string;
  proposerHiveId: string;
  title: string;
  objective: string;
  affectedHiveIds: string[];
  options: {
    optionId: string;
    description: string;
    expectedOutcome: string;
  }[];
  votes: {
    hiveId: string;
    selectedOptionId: string;
    weight: number;
    reasoning: string;
    signature: string;
  }[];
  dissentRecords: {
    hiveId: string;
    rationale: string;
    evidence: string;
  }[];
  quorumPct: number;
  consensusOptionId?: string;
  status: 'PROPOSED' | 'VOTING' | 'CONSENSUS_REACHED' | 'FEDERATION_BLOCKED' | 'EXPIRED';
  createdAt: string;
}

export interface HiveQuarantineRecord {
  quarantineId: string;
  hiveId: string;
  status: QuarantineStatus;
  reason: string;
  evidence: string;
  quarantinedBy: string;
  timestamp: string;
  recoveryConditions: string[];
}

export interface FederationHealthMetrics {
  federationHealthScore: number; // 0-100
  activeHivesCount: number;
  reachableHivesPct: number;
  partitionedHivesCount: number;
  quarantinedHivesCount: number;
  messageDeliverySuccessPct: number;
  avgTransportLatencyMs: number;
  consensusStabilityPct: number;
  trustDistributionPct: number;
  explainability: string[];
  updatedAt: string;
}

export interface FederationEvent {
  eventId: string;
  timestamp: string;
  sourceHiveId: string;
  destinationHiveId?: string;
  eventType: string;
  details: Record<string, unknown>;
  governanceResult: 'ALLOWED' | 'BLOCKED' | 'QUARANTINED';
  traceId: string;
}


export interface CollectiveObservation {
  id: string;
  agentId: string;
  agentName: string;
  hiveId: string;
  observation: string;
  category: 'INFRASTRUCTURE' | 'GOVERNANCE' | 'SECURITY' | 'PERFORMANCE' | 'STRATEGY';
  timestamp: string;
  confidence: number;
}

export interface SynthesizedAwareness {
  id: string;
  title: string;
  summary: string;
  contributingObservationIds: string[];
  contradictionsDetected: string[];
  primaryHypothesis: string;
  confidenceScore: number;
  synthesizedAt: string;
}

export interface DynamicTeam {
  teamId: string;
  objective: string;
  hiveId: string;
  coordinatorAgentId: string;
  memberAgentIds: string[];
  requiredCapabilities: string[];
  status: 'FORMING' | 'ACTIVE' | 'COMPLETED' | 'DISSOLVED';
  tokenBudget: number;
  tokenConsumed: number;
  confidenceScore: number;
  createdAt: string;
}

export interface CollectiveDecisionProposal {
  proposalId: string;
  title: string;
  objective: string;
  proposerAgentId: string;
  options: {
    optionId: string;
    description: string;
    expectedOutcome: string;
    riskLevel: RiskLevel;
  }[];
  votes: {
    agentId: string;
    agentRole: string;
    selectedOptionId: string;
    weight: number;
    reasoning: string;
    confidence: number;
  }[];
  dissentRecords: {
    agentId: string;
    dissentingOptionId: string;
    rationale: string;
    evidence: string;
    riskWarning: string;
  }[];
  quorumMet: boolean;
  consensusOptionId?: string;
  consensusConfidence: number;
  status: 'PROPOSED' | 'DEBATING' | 'CONSENSUS_REACHED' | 'GOVERNANCE_BLOCKED' | 'EXECUTED';
  createdAt: string;
}

export interface AgentReputationRecord {
  agentId: string;
  agentName: string;
  role: string;
  accuracyScore: number; // 0-100
  reliabilityScore: number; // 0-100
  efficiencyScore: number; // 0-100
  taskSuccessRatePct: number; // 0-100
  predictionAccuracyPct: number; // 0-100
  collaborationScore: number; // 0-100
  policyCompliancePct: number; // 0-100
  recoveryPerformanceScore: number; // 0-100
  compositeReputation: number; // 0-100
  evidenceLogs: {
    timestamp: string;
    event: string;
    delta: number;
  }[];
  updatedAt: string;
}

export interface CollectiveMemoryRecord {
  id: string;
  category: 'SUCCESSFUL_STRATEGY' | 'FAILED_STRATEGY' | 'LESSON_LEARNED' | 'ARCHITECTURAL_KNOWLEDGE' | 'REJECTED_HYPOTHESIS';
  content: string;
  sourceAgentIds: string[];
  timestamp: string;
  evidence: string;
  confidence: number;
  validationStatus: 'PROPOSED' | 'VALIDATED' | 'PROMOTED' | 'DEPRECATED';
  relevanceTags: string[];
  relatedGoalIds: string[];
}

export interface TaskBid {
  bidId: string;
  taskId: string;
  agentId: string;
  agentName: string;
  capabilityMatchScore: number; // 0-1
  estimatedTokenCost: number;
  expectedSuccessRate: number; // 0-1
  currentWorkload: number; // 0-1
  bidScore: number; // computed
  submittedAt: string;
}

export interface ResourceAllocationRecord {
  allocationId: string;
  hiveId: string;
  teamId?: string;
  tokensAllocated: number;
  tokensUsed: number;
  priorityScore: number;
  starvationRisk: boolean;
  status: 'ACTIVE' | 'RELEASED' | 'THROTTLED';
  allocatedAt: string;
}

export interface EmergentStrategyRecord {
  strategyId: string;
  title: string;
  objective: string;
  generatedBySwarm: boolean;
  proposedSteps: string[];
  riskLevel: RiskLevel;
  simulatedSuccessRate: number; // 0-100
  resourceCostTokens: number;
  consensusScore: number; // 0-100
  status: 'DRAFT' | 'SIMULATED' | 'DEBATED' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface HiveHealthMetrics {
  hiveHealthScore: number; // 0-100
  agentAvailabilityPct: number;
  coordinationEfficiencyPct: number;
  goalProgressPct: number;
  knowledgeGrowthRate: number;
  resourceEfficiencyPct: number;
  decisionQualityPct: number;
  failureRatePct: number;
  recoveryRatePct: number;
  capabilityCoveragePct: number;
  governanceStabilityPct: number;
  explainability: string[];
  updatedAt: string;
}

// ============================================================================
// HERMES HIVE ↔ HERMES WEB CAPABILITY PROTOCOL CONTRACTS
// ============================================================================

export type ServiceIdentity = 'hermes-hive' | 'hermes-web';

export type CapabilityRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ExecutionMode = 'SIMULATE' | 'EXECUTE';

export type SyncMode = 'SYNC' | 'ASYNC';

export type CapabilityStatus = 'operational' | 'degraded' | 'maintenance' | 'offline';

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SIMULATED' | 'CANCELLED';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'SKIPPED';

export type RequestResponseStatus = 'REQUEST_SUCCESS' | 'ACCEPTED' | 'REJECTED' | 'FAILED' | 'APPROVAL_REQUIRED';

export type PolicyDecisionType = 'ALLOW' | 'DENY' | 'REQUIRE_APPROVAL';

export type ErrorCategory =
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'CAPABILITY_NOT_FOUND'
  | 'PROVIDER_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'EXECUTION_ERROR'
  | 'VERIFICATION_ERROR'
  | 'POLICY_DENIED'
  | 'APPROVAL_REQUIRED'
  | 'INTERNAL_ERROR';

export interface CapabilityDescriptor {
  id: string;
  name: string;
  version: string;
  category: 'web_search' | 'http_api' | 'repository' | 'database' | 'saas_integration' | 'system_command' | 'storage';
  description: string;
  provider: string;
  operations: string[];
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  permissions: string[];
  riskLevel: CapabilityRiskLevel;
  authenticationRequirements: string[];
  availability: 'online' | 'degraded' | 'offline';
  health: CapabilityStatus;
  rateLimits: {
    maxRequestsPerMin: number;
    currentMinUsage: number;
  };
  supportsSimulation: boolean;
  supportsCancellation: boolean;
  supportsVerification: boolean;
}

export interface AuthorizationContext {
  serviceIdentity: ServiceIdentity;
  agentIdentity?: string;
  swarmIdentity?: string;
  permissions: string[];
  signature?: string;
  authToken?: string;
}

export interface RiskContext {
  evaluatedRiskLevel: CapabilityRiskLevel;
  reversibility: number; // 1-10 (10 = irreversible)
  impactScore: number;    // 1-10
  securitySensitivity: number; // 1-10
}

export interface CapabilityRequest {
  requestId: string;
  correlationId: string;
  traceId: string;
  source: ServiceIdentity;
  agentId?: string;
  agentName?: string;
  swarmId?: string;
  capabilityId: string;
  operation: string;
  parameters: Record<string, any>;
  authorizationContext: AuthorizationContext;
  riskContext?: RiskContext;
  executionMode: ExecutionMode;
  syncMode?: SyncMode;
  timeoutMs?: number;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface PolicyDecision {
  decision: PolicyDecisionType;
  reason: string;
  approvalId?: string;
  evaluatedRules: string[];
  timestamp: string;
}

export interface ErrorEnvelope {
  code: string;
  message: string;
  category: ErrorCategory;
  retryable: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requestId?: string;
  executionId?: string;
  provider?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface CapabilityResponse {
  requestId: string;
  executionId: string;
  status: RequestResponseStatus;
  executionStatus: ExecutionStatus;
  verificationStatus: VerificationStatus;
  policyDecision?: PolicyDecision;
  result: any;
  error?: ErrorEnvelope;
  warnings?: string[];
  timing: {
    receivedAt: string;
    startedAt?: string;
    completedAt?: string;
    durationMs: number;
  };
  executionMetadata?: {
    providerUsed?: string;
    capabilityVersion?: string;
    executionMode?: ExecutionMode;
    simulatedSideEffects?: string[];
    costEstimateTokens?: number;
    traceId?: string;
    correlationId?: string;
  };
}

export type CapabilityEventType =
  | 'capability.available'
  | 'capability.unavailable'
  | 'execution.requested'
  | 'execution.authorized'
  | 'execution.started'
  | 'execution.progress'
  | 'execution.completed'
  | 'execution.failed'
  | 'execution.cancelled'
  | 'approval.required'
  | 'verification.completed'
  | 'connector.health_changed';

export interface CapabilityEventEnvelope {
  eventId: string;
  eventType: CapabilityEventType;
  schemaVersion: string;
  timestamp: string;
  source: ServiceIdentity;
  correlationId: string;
  traceId: string;
  requestId?: string;
  executionId?: string;
  agentId?: string;
  capabilityId?: string;
  payload: Record<string, any>;
}

export interface CapabilityApprovalRequest {
  approvalId: string;
  executionId: string;
  requestId: string;
  capabilityId: string;
  operation: string;
  requestingAgentId?: string;
  requestingAgentName?: string;
  riskLevel: CapabilityRiskLevel;
  parameters: Record<string, any>;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface HermesWebAuditLog {
  id: string;
  traceId: string;
  correlationId: string;
  requestId: string;
  executionId: string;
  timestamp: string;
  serviceIdentity: ServiceIdentity;
  agentId?: string;
  agentName?: string;
  capabilityId: string;
  operation: string;
  executionMode: ExecutionMode;
  riskLevel: CapabilityRiskLevel;
  policyDecision: PolicyDecisionType;
  executionStatus: ExecutionStatus;
  verificationStatus: VerificationStatus;
  durationMs: number;
  provider: string;
  success: boolean;
  error?: string;
  errorDetails?: string;
  externalTaskId?: string;
}

// ============================================================================
// STAGE 8.5 — DEEP DEBUGGING, CAUSAL TRACING & GOVERNED SELF-REPAIR CONTRACTS
// ============================================================================

export interface CausalTraceSpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  causality: 'TRIGGERED_BY' | 'DEPENDS_ON' | 'SUBTASK_OF' | 'INFLUENCED_BY' | 'MUTATED_BY';
  timestamp: string;
  source: string;
  actor: string;
  actorRole?: string;
  component: 'AGENT' | 'HIVE' | 'FEDERATION' | 'MISSION' | 'DECISION' | 'MEMORY' | 'CAPABILITY' | 'HERMES_WEB' | 'HERMES_WEB_BRIDGE' | 'WORLD_STATE';
  action: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  stateRef?: string;
  decisionRef?: string;
  memoryRefs?: string[];
  capabilityRef?: string;
  error?: ErrorEnvelope;
  durationMs: number;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'WARNING';
}

export interface SystemStateSnapshot {
  snapshotId: string;
  timestamp: string;
  triggerReason: string;
  activeAgentsCount: number;
  activeMissionsCount: number;
  activeHivesCount: number;
  worldEntitiesCount: number;
  capabilityHealthMap: Record<string, CapabilityStatus>;
  memoryStats: {
    totalRecords: number;
    activeCacheKeys: number;
  };
  agentHealthSummary: {
    healthy: number;
    degraded: number;
    failed: number;
  };
  federationStatus: string;
  rawStateData?: Record<string, any>;
}

export interface MissionReplayRecord {
  missionId: string;
  objective: string;
  startTime: string;
  endTime?: string;
  status: string;
  chronologicalEvents: {
    timestamp: string;
    stage: string;
    actor: string;
    description: string;
    payload?: any;
  }[];
  causalChain: CausalTraceSpan[];
  decisionsMade: string[];
  capabilitiesInvoked: string[];
  failuresEncountered: ErrorEnvelope[];
  finalOutcomeSummary: string;
}

export interface DecisionReplayRecord {
  decisionId: string;
  traceId: string;
  agentId: string;
  timestamp: string;
  facts: string[];
  observations: string[];
  assumptions: string[];
  inferences: string[];
  predictions: string[];
  candidateOptions: {
    optionId: string;
    description: string;
    estimatedRisk: number;
    confidenceScore: number;
  }[];
  selectedOptionId: string;
  rejectedOptionIds: string[];
  dissentRecords: {
    agentId: string;
    reason: string;
  }[];
  retrievedMemoryIds: string[];
  policyApprovalRef?: string;
  finalDecisionText: string;
  resultingAction?: string;
}

export interface RootCauseHypothesis {
  hypothesisId: string;
  title: string;
  confidencePct: number; // 0-100
  category: ErrorCategory;
  description: string;
  earliestCausalSpanId?: string;
  evidence: string[];
  mitigation: string;
}

export interface BlastRadiusReport {
  affectedMissionIds: string[];
  affectedAgentIds: string[];
  affectedHiveIds: string[];
  affectedCapabilityIds: string[];
  affectedWorldEntities: string[];
  estimatedSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export interface RootCauseAnalysisReport {
  analysisId: string;
  incidentId: string;
  fingerprint: string;
  timestamp: string;
  primaryErrorCategory: ErrorCategory;
  rootCauseHypotheses: RootCauseHypothesis[];
  earliestCausalSpan?: CausalTraceSpan;
  blastRadius: BlastRadiusReport;
  dependencyChain: string[];
  reproductionStatus: 'REPRODUCED' | 'CANNOT_REPRODUCE' | 'SKIPPED';
  recommendedAction: string;
}

export interface SelfRepairProposal {
  proposalId: string;
  incidentId: string;
  title: string;
  category: 'RETRY_WITH_BACKOFF' | 'FALLBACK_CAPABILITY' | 'REASSIGN_HIVE' | 'STATE_ROLLBACK' | 'QUARANTINE_AGENT' | 'RECONFIG_TIMEOUT';
  targetComponent: string;
  description: string;
  proposedAction: Record<string, any>;
  riskLevel: CapabilityRiskLevel;
  simulationResult: {
    success: boolean;
    simulatedImpact: string;
    predictedRecoveryPct: number;
  };
  status: 'PROPOSED' | 'SIMULATED' | 'APPROVED' | 'APPLIED' | 'REJECTED' | 'ROLLED_BACK';
  governanceApprovalRequired: boolean;
  approvedBy?: string;
  createdAt: string;
  appliedAt?: string;
  rollbackPlan: {
    rollbackAction: string;
    rollbackData?: any;
  };
  rollbackAt?: string;
}

export interface WhyExplanationReport {
  query: string;
  queryType: 'WHY_DID_HERMES_DO' | 'WHY_DIDNT_HERMES_DO' | 'WHY_DID_IT_FAIL';
  summaryExplanation: string;
  objectiveContext?: string;
  retrievedInformation?: string[];
  reasoningFactors?: string[];
  governanceConstraints?: string[];
  alternativeOptionsEvaluated?: string[];
  rootCauseDetails?: string;
  causalTraceRef?: string;
  timestamp: string;
}

export interface IncidentRecord {
  incidentId: string;
  fingerprint: string;
  title: string;
  category: ErrorCategory;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'ANALYZING' | 'REPAIRED' | 'ROLLED_BACK' | 'CLOSED';
  symptoms: string[];
  timeline: {
    timestamp: string;
    event: string;
  }[];
  rootCauseReport?: RootCauseAnalysisReport;
  repairProposalId?: string;
  resolutionSummary?: string;
  lessonsLearned?: string[];
  createdAt: string;
  resolvedAt?: string;
}

// ==================================================================
// STAGE 9 — HERMES CHAT & COGNITIVE CONSOLE TYPES
// ==================================================================

export type ChatIntent =
  | 'QUESTION'
  | 'RESEARCH'
  | 'ANALYSIS'
  | 'COMMAND'
  | 'MISSION_REQUEST'
  | 'DIAGNOSTIC_REQUEST'
  | 'NAVIGATION'
  | 'STATUS_REQUEST'
  | 'CONFIGURATION_REQUEST';

export interface ChatActivityStep {
  step: string;
  status: 'in_progress' | 'completed' | 'failed';
  timestamp?: string;
}

export interface ChatRichCard {
  type: 'status' | 'mission' | 'hive' | 'federation' | 'diagnostic' | 'incident' | 'world' | 'action_confirmation';
  title?: string;
  data: any;
}

export interface ChatSource {
  title: string;
  category: string;
  link?: string;
  details?: string;
}

export interface ChatActionRequired {
  actionId: string;
  actionType: string;
  target: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  consequences: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  details?: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'hermes' | 'system';
  text: string;
  timestamp: string;
  intent?: ChatIntent;
  activitySteps?: ChatActivityStep[];
  richCards?: ChatRichCard[];
  sources?: ChatSource[];
  actionRequired?: ChatActionRequired;
}

export interface ConversationContext {
  hiveId?: string;
  missionId?: string;
  incidentId?: string;
  entityId?: string;
  activeTab?: string;
  pageTitle?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  participants: string[];
  context?: ConversationContext;
  messages: ChatMessage[];
  relatedMissions?: string[];
  relatedHives?: string[];
  relatedIncidents?: string[];
  archived?: boolean;
}







// ==================================================================
// STAGE 9 — CRYPTOGRAPHIC FEDERATED SLA & BIDDING MARKET TYPES
// ==================================================================

export interface SLAContract {
  slaId: string;
  taskId: string;
  providerHiveId: string;
  consumerHiveId: string;
  agreedLatencyMs: number;
  agreedReliabilityPct: number;
  penaltyTokens: number;
  status: 'ACTIVE' | 'MET' | 'VIOLATED';
  createdAt: string;
  resolvedAt?: string;
}

export interface CryptographicProof {
  proofId: string;
  taskId: string;
  providerHiveId: string;
  payloadHash: string;
  signature: string;
  timestamp: string;
  verificationStatus: 'PENDING' | 'VALID' | 'INVALID';
}

export interface SLAEnforcementRecord {
  recordId: string;
  slaId: string;
  taskId: string;
  violationDetected: boolean;
  actualLatencyMs?: number;
  penaltyApplied: number;
  timestamp: string;
  details?: string;
}

export interface MarketAsk {
  askId: string;
  hiveId: string;
  capabilityId: string;
  minPriceTokens: number;
  maxLatencyMs: number;
  reliabilityPct: number;
  timestamp: string;
}
