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
  averageLatency?: number;      // ms
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
  targetProposalId: string | null;
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
  externalTaskId?: string; // task id in the distributed task queue (TaskRunnerService)
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
