import { 
  SymbiontHive, 
  RecombinantMutation, 
  SymbiosisSession, 
  SymbioticTreasuryLedger, 
  Stage10SymbiosisOverview,
  RiskLevel
} from '../../shared/stage10Types';
import { messageBus } from '../bus/messageBus';

export class SymbioticSynthesisEngine {
  private hives: Map<string, SymbiontHive> = new Map();
  private mutations: Map<string, RecombinantMutation> = new Map();
  private sessions: Map<string, SymbiosisSession> = new Map();
  private treasury: SymbioticTreasuryLedger = {
    totalTokens: 50000,
    reallocationHistory: []
  };

  constructor() {
    this.seedDefaultSymbiosisData();
  }

  private seedDefaultSymbiosisData() {
    // Seed Symbiont Hives
    const h1: SymbiontHive = {
      hiveId: 'hive-prime',
      name: 'Hive Prime',
      specialization: 'Primary Strategist',
      status: 'ONLINE',
      reputationScore: 0.98,
      latencyMs: 12,
      computeShares: 2500,
      treasuryBalance: 15400,
      version: 'v8.2.1-recombinant',
      lastSyncAt: new Date().toISOString()
    };
    const h2: SymbiontHive = {
      hiveId: 'hive-chronos',
      name: 'Hive Chronos',
      specialization: 'Temporal Reasoning',
      status: 'ONLINE',
      reputationScore: 0.96,
      latencyMs: 45,
      computeShares: 1800,
      treasuryBalance: 8900,
      version: 'v8.1.9-temporal',
      lastSyncAt: new Date().toISOString()
    };
    const h3: SymbiontHive = {
      hiveId: 'hive-nexus',
      name: 'Hive Nexus',
      specialization: 'Cognitive Synthesis',
      status: 'ONLINE',
      reputationScore: 0.99,
      latencyMs: 18,
      computeShares: 3200,
      treasuryBalance: 14200,
      version: 'v8.3.0-nexus',
      lastSyncAt: new Date().toISOString()
    };
    const h4: SymbiontHive = {
      hiveId: 'hive-gaia',
      name: 'Hive Gaia',
      specialization: 'Resource Allocation',
      status: 'SYNCHRONIZING',
      reputationScore: 0.92,
      latencyMs: 110,
      computeShares: 1200,
      treasuryBalance: 5100,
      version: 'v8.0.4-gaia',
      lastSyncAt: new Date().toISOString()
    };
    const h5: SymbiontHive = {
      hiveId: 'hive-hephaestus',
      name: 'Hive Hephaestus',
      specialization: 'Evolutionary Sandbox',
      status: 'ONLINE',
      reputationScore: 0.97,
      latencyMs: 32,
      computeShares: 2200,
      treasuryBalance: 6400,
      version: 'v8.2.5-sandbox',
      lastSyncAt: new Date().toISOString()
    };

    this.hives.set(h1.hiveId, h1);
    this.hives.set(h2.hiveId, h2);
    this.hives.set(h3.hiveId, h3);
    this.hives.set(h4.hiveId, h4);
    this.hives.set(h5.hiveId, h5);

    // Seed Recombinant Mutations
    const m1: RecombinantMutation = {
      mutationId: 'mut-101',
      proposedBy: 'hive-nexus',
      componentAffected: 'Scheduler',
      mutationTarget: 'Adaptive Backoff Core Heuristic',
      heuristicDiff: {
        removed: 'const delay = Math.pow(2, retries) * 1000;',
        added: 'const jitter = Math.random() * 300;\nconst delay = Math.pow(1.85, retries) * 1000 + jitter;\nconst cacheAffinityBoost = queueDepth > 20 ? 0.75 : 1.0;\nreturn delay * cacheAffinityBoost;'
      },
      expectedEfficiencyGainPct: 18.5,
      expectedReliabilityGainPct: 12.2,
      riskLevel: 'LOW',
      status: 'DEPLOYED_MUTATION',
      safetyAuditScore: 98,
      sandboxExecutionLogs: [
        'Sandbox instance spawned successfully.',
        'Simulated 10,000 synthetic queue items with thread depth 15.',
        'Observed execution delay reduced by 1,420ms average.',
        'Zero exceptions thrown across sandbox bounds.',
        'Compilation verified on Node target v22.14.0.'
      ],
      authorizedBy: 'Autonomous Consensus Engine',
      timestamp: new Date(Date.now() - 36000000).toISOString()
    };

    const m2: RecombinantMutation = {
      mutationId: 'mut-102',
      proposedBy: 'hive-chronos',
      componentAffected: 'Memory Consolidation',
      mutationTarget: 'Decay Formula Smoothing',
      heuristicDiff: {
        removed: 'const decay = Math.exp(-rate * time);',
        added: 'const temporalAffinity = Math.cos(temporalVariance * Math.PI);\nconst decay = Math.exp(-rate * time * (1.0 - 0.15 * temporalAffinity));'
      },
      expectedEfficiencyGainPct: 8.4,
      expectedReliabilityGainPct: 15.6,
      riskLevel: 'MEDIUM',
      status: 'SANDBOX_VERIFIED',
      safetyAuditScore: 94,
      sandboxExecutionLogs: [
        'Sandbox compiled cleanly.',
        'Validation suite detected 22% improvement in retention coherence.',
        'Safety limits verified: heap consumption remains linear under load.'
      ],
      timestamp: new Date().toISOString()
    };

    this.mutations.set(m1.mutationId, m1);
    this.mutations.set(m2.mutationId, m2);

    // Seed Symbiosis Sessions
    const s1: SymbiosisSession = {
      sessionId: 'sess-201',
      title: 'State Consensus Alignment Protocol',
      participantHives: ['Hive Prime', 'Hive Nexus', 'Hive Chronos'],
      objective: 'Synchronize high-dimensional memory indices with sub-microsecond consensus.',
      status: 'CONSOLIDATED',
      sharedInsights: [
        'Combining Cronos temporal anchors with Nexus semantic representations reduces drift on complex multi-tier tasks.',
        'Compute shares allocation must be adjusted to account for Gaia sync state latency.'
      ],
      computeAllocated: 1400,
      lastActive: new Date().toISOString()
    };

    this.sessions.set(s1.sessionId, s1);

    // Seed Treasury Reallocation Logs
    this.treasury.reallocationHistory.push({
      id: 'tx-501',
      fromHive: 'Hive Prime',
      toHive: 'Hive Gaia',
      amount: 1200,
      purpose: 'Compensate synchronization packet relay over high-latency node.',
      timestamp: new Date(Date.now() - 4800000).toISOString()
    });
  }

  // API Methods
  public getHives(): SymbiontHive[] {
    return Array.from(this.hives.values());
  }

  public getMutations(): RecombinantMutation[] {
    return Array.from(this.mutations.values());
  }

  public getSessions(): SymbiosisSession[] {
    return Array.from(this.sessions.values());
  }

  public getTreasuryLedger(): SymbioticTreasuryLedger {
    return this.treasury;
  }

  public proposeMutation(m: Omit<RecombinantMutation, 'mutationId' | 'status' | 'safetyAuditScore' | 'sandboxExecutionLogs' | 'timestamp'>): RecombinantMutation {
    const mutationId = `mut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Automatically calculate safety audit score based on variables & risk level
    let safetyAuditScore = 95;
    if (m.riskLevel === 'MEDIUM') safetyAuditScore = 88;
    if (m.riskLevel === 'HIGH') safetyAuditScore = 72;
    if (m.riskLevel === 'CRITICAL') safetyAuditScore = 48;

    const record: RecombinantMutation = {
      ...m,
      mutationId,
      status: 'PENDING_SANDBOX',
      safetyAuditScore,
      sandboxExecutionLogs: ['Mutation registered inside volatile registers. Awaiting Sandbox spawning...'],
      timestamp: new Date().toISOString()
    };

    this.mutations.set(mutationId, record);

    messageBus.publish('LEDGER_ENTRY', 'SymbioticSynthesisEngine', {
      eventType: 'RecombinantMutationProposed',
      payload: record
    }, { severity: 'info' });

    return record;
  }

  public simulateMutationSandbox(mutationId: string): RecombinantMutation | undefined {
    const m = this.mutations.get(mutationId);
    if (!m) return undefined;

    m.status = 'SANDBOX_VERIFIED';
    m.sandboxExecutionLogs.push(
      `[${new Date().toLocaleTimeString()}] Spawning virtualization container.`,
      `[${new Date().toLocaleTimeString()}] Compiling heuristic diff against main system... SUCCESS.`,
      `[${new Date().toLocaleTimeString()}] Injecting synthetic benchmark requests. Outflow rate: 2,500 req/sec.`,
      `[${new Date().toLocaleTimeString()}] Metrics captured: efficiency change: +${m.expectedEfficiencyGainPct}%, reliability change: +${m.expectedReliabilityGainPct}%.`,
      `[${new Date().toLocaleTimeString()}] Running static code containment checks: No un-vetted external IP requests detected.`,
      `[${new Date().toLocaleTimeString()}] Sandbox evaluation complete: Outcome matches expectation constraints.`
    );

    this.mutations.set(mutationId, m);

    messageBus.publish('LEDGER_ENTRY', 'SymbioticSynthesisEngine', {
      eventType: 'RecombinantMutationSandboxVerified',
      payload: m
    }, { severity: 'info' });

    return m;
  }

  public compileAndDeployMutation(mutationId: string, authorizedBy?: string): RecombinantMutation | undefined {
    const m = this.mutations.get(mutationId);
    if (!m) return undefined;

    // SECURITY GOVERNANCE HOOKS:
    // If the mutation is HIGH or CRITICAL risk, we prohibit automatic deployment.
    // Explicit authorizedBy matching 'Operator' or similar human role is mandatory.
    const isHighRisk = m.riskLevel === 'HIGH' || m.riskLevel === 'CRITICAL';
    
    if (isHighRisk && (!authorizedBy || !authorizedBy.toLowerCase().includes('operator') && !authorizedBy.toLowerCase().includes('human'))) {
      m.status = 'RESTRICTED';
      m.sandboxExecutionLogs.push(
        `[CRITICAL WARNING] Promotion aborted. Risk profile is ${m.riskLevel}.`,
        `[SECURITY LOCK] Deploying self-modifying software of ${m.riskLevel} risk requires explicit human supervisor signature.`,
        `[RESTRICTION] Current promotion agent lacks adequate authority permissions.`
      );
      this.mutations.set(mutationId, m);

      messageBus.publish('LEDGER_ENTRY', 'SymbioticSynthesisEngine', {
        eventType: 'CapabilityPromotionBlocked',
        payload: { id: mutationId, reason: `Requires explicit HUMAN authorization. Risk is ${m.riskLevel}.` }
      }, { severity: 'warning' });

      return m;
    }

    m.status = 'DEPLOYED_MUTATION';
    m.authorizedBy = authorizedBy || 'Autonomous Swarm Consensus';
    m.sandboxExecutionLogs.push(
      `[${new Date().toLocaleTimeString()}] Preparing live-patch compilation registers.`,
      `[${new Date().toLocaleTimeString()}] Hot swapping core modules in runtime. No downtime incurred.`,
      `[${new Date().toLocaleTimeString()}] Verified live execution throughput. Status is ACTIVE.`,
      `[${new Date().toLocaleTimeString()}] Promotion successfully approved by ${m.authorizedBy}.`
    );

    this.mutations.set(mutationId, m);

    // Update specialized Hive's version to reflect adaptation
    const hive = this.hives.get(m.proposedBy);
    if (hive) {
      hive.version = `${hive.version}-mod-${mutationId.substring(4, 8)}`;
      hive.reputationScore = Math.min(1.0, hive.reputationScore + 0.01);
      this.hives.set(hive.hiveId, hive);
    }

    messageBus.publish('LEDGER_ENTRY', 'SymbioticSynthesisEngine', {
      eventType: 'RecombinantMutationDeployed',
      payload: m
    }, { severity: 'info' });

    return m;
  }

  public restrictMutation(mutationId: string, reason: string): RecombinantMutation | undefined {
    const m = this.mutations.get(mutationId);
    if (!m) return undefined;

    m.status = 'RESTRICTED';
    m.sandboxExecutionLogs.push(
      `[${new Date().toLocaleTimeString()}] MANUAL RESTRICTION OVERLAY ENGAGED.`,
      `[${new Date().toLocaleTimeString()}] Rollback initiated. Reason: "${reason}".`,
      `[${new Date().toLocaleTimeString()}] Restored legacy executable instructions successfully.`
    );
    this.mutations.set(mutationId, m);

    // Penalize proposed Hive's trust score slightly
    const hive = this.hives.get(m.proposedBy);
    if (hive) {
      hive.reputationScore = Math.max(0.40, hive.reputationScore - 0.05);
      this.hives.set(hive.hiveId, hive);
    }

    messageBus.publish('LEDGER_ENTRY', 'SymbioticSynthesisEngine', {
      eventType: 'RecombinantMutationRestricted',
      payload: { mutationId, reason }
    }, { severity: 'warning' });

    return m;
  }

  public initiateCollaborativeSession(title: string, participantHives: string[], objective: string, computeAllocated: number): SymbiosisSession {
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const session: SymbiosisSession = {
      sessionId,
      title,
      participantHives,
      objective,
      status: 'INITIATING',
      sharedInsights: [],
      computeAllocated,
      lastActive: new Date().toISOString()
    };

    this.sessions.set(sessionId, session);

    messageBus.publish('LEDGER_ENTRY', 'SymbioticSynthesisEngine', {
      eventType: 'SymbiosisSessionInitiated',
      payload: session
    }, { severity: 'info' });

    return session;
  }

  public advanceCollaborativeSession(sessionId: string): SymbiosisSession | undefined {
    const s = this.sessions.get(sessionId);
    if (!s) return undefined;

    if (s.status === 'INITIATING') {
      s.status = 'COMPUTING_CONSENSUS';
      s.sharedInsights.push('Joint neural index mapping completed. Commencing multi-hive consensus matching...');
    } else if (s.status === 'COMPUTING_CONSENSUS') {
      s.status = 'CONSOLIDATED';
      s.sharedInsights.push('Achieved state consensus with 99.85% cross-hive replication affinity.');
    } else if (s.status === 'CONSOLIDATED') {
      s.status = 'COMPLETED';
      s.sharedInsights.push('Collaborative optimization weights successfully saved to federation layer.');
    }

    s.lastActive = new Date().toISOString();
    this.sessions.set(sessionId, s);

    messageBus.publish('LEDGER_ENTRY', 'SymbioticSynthesisEngine', {
      eventType: 'SymbiosisSessionProgressed',
      payload: s
    }, { severity: 'info' });

    return s;
  }

  public reallocateTokens(fromHiveId: string, toHiveId: string, amount: number, purpose: string): boolean {
    const fromHive = this.hives.get(fromHiveId);
    const toHive = this.hives.get(toHiveId);

    if (!fromHive || !toHive || fromHive.treasuryBalance < amount) {
      return false;
    }

    fromHive.treasuryBalance -= amount;
    toHive.treasuryBalance += amount;

    this.hives.set(fromHiveId, fromHive);
    this.hives.set(toHiveId, toHive);

    const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    this.treasury.reallocationHistory.push({
      id: txId,
      fromHive: fromHive.name,
      toHive: toHive.name,
      amount,
      purpose,
      timestamp: new Date().toISOString()
    });

    messageBus.publish('LEDGER_ENTRY', 'SymbioticSynthesisEngine', {
      eventType: 'TreasuryRebalanced',
      payload: { txId, fromHive: fromHive.name, toHive: toHive.name, amount, purpose }
    }, { severity: 'info' });

    return true;
  }

  public getOverview(): Stage10SymbiosisOverview {
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.status !== 'COMPLETED' && s.status !== 'FAILED').length;
    const mutationsDeployed = Array.from(this.mutations.values()).filter(m => m.status === 'DEPLOYED_MUTATION').length;
    const onlineHives = Array.from(this.hives.values()).filter(h => h.status === 'ONLINE').length;

    // System entropy is lower with more deployed self-modifying mutations and high online nodes
    const baseEntropy = 48.2;
    const mutationOffset = mutationsDeployed * 3.5;
    const overallSystemEntropy = Math.max(12.5, Math.round((baseEntropy - mutationOffset) * 100) / 100);

    // Consciousness alignment rises with more deployed validated code patches and online hives
    const baseAlignment = 72.4;
    const alignmentOffset = mutationsDeployed * 4.2 + (onlineHives * 1.5);
    const globalConsciousnessAlignment = Math.min(100, Math.round((baseAlignment + alignmentOffset) * 10) / 10);

    const symbioticTreasuryTotal = Array.from(this.hives.values()).reduce((sum, h) => sum + h.treasuryBalance, 0);

    const complianceOffset = Array.from(this.mutations.values()).filter(m => m.status === 'RESTRICTED').length * 2;
    const recombinantSafetyCompliance = Math.max(80, 100 - complianceOffset);

    return {
      totalOnlineHives: onlineHives,
      activeSymbiosisSessions: activeSessions,
      mutationsDeployedCount: mutationsDeployed,
      overallSystemEntropy,
      globalConsciousnessAlignment,
      symbioticTreasuryTotal,
      recombinantSafetyCompliance,
      lastConsolidatedAt: new Date().toISOString()
    };
  }
}

export const symbioticSynthesisEngine = new SymbioticSynthesisEngine();
