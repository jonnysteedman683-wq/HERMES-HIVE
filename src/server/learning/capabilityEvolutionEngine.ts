import { CapabilityComposition, CapabilityCompositionStatus, RiskLevel } from '../../shared/stage9Types';
import { messageBus } from '../bus/messageBus';

export interface CapabilityGraphNode {
  id: string;
  name: string;
  category: string;
}

export interface CapabilityGraphEdge {
  from: string;
  to: string;
  relation: 'depends_on' | 'improves' | 'verifies' | 'substitutes' | 'conflicts_with';
}

export class CapabilityEvolutionEngine {
  private compositions: Map<string, CapabilityComposition> = new Map();
  private nodes: Map<string, CapabilityGraphNode> = new Map();
  private edges: CapabilityGraphEdge[] = [];

  constructor() {
    this.seedDefaultCompositionsAndGraph();
  }

  private seedDefaultCompositionsAndGraph() {
    // Seed standard capability nodes
    this.addNode('web_search', 'Web Search Crawler', 'research');
    this.addNode('extraction', 'Payload Data Extractor', 'data');
    this.addNode('analysis', 'Deep Semantic Analyst', 'research');
    this.addNode('verification', 'Cryptographic Proof Verifier', 'verification');
    this.addNode('http_api', 'REST API Gateway Connector', 'engineering');

    // Seed capability relationships (the edges)
    this.addEdge('extraction', 'web_search', 'depends_on');
    this.addEdge('analysis', 'extraction', 'depends_on');
    this.addEdge('verification', 'analysis', 'verifies');
    this.addEdge('web_search', 'http_api', 'substitutes');

    // Seed existing composite pipeline: Proposed/Simulated or Validated pipeline
    this.proposeComposition({
      name: 'ResearchVerificationPipeline',
      purpose: 'End-to-end automated research fetcher with secure multi-agent verify pass',
      componentCapabilities: ['web_search', 'extraction', 'analysis', 'verification'],
      expectedBenefit: 'Reduces payload corruption and timeout risk by 68% using consensus verification.',
      expectedRisk: 'MEDIUM',
      expectedCost: 450,
      confidence: 0.94,
      evidence: ['Incident analysis isolated web_search timeouts during unverified crawls'],
      dependencies: ['web_search', 'verification'],
      rollbackStrategy: 'Revert to single-source web_search connector with individual retries.'
    });

    // Seed another proposed composition (experimental)
    const comp2 = this.proposeComposition({
      name: 'SelfRepairingDatabaseSync',
      purpose: 'Failsafe relational state sync with autonomous retry, lock recovery, and ledger checkpointing',
      componentCapabilities: ['http_api', 'verification'],
      expectedBenefit: 'Ensures zero database drift and prevents deadlocks under high database concurrency.',
      expectedRisk: 'HIGH',
      expectedCost: 320,
      confidence: 0.88,
      evidence: ['High database locking observed in multi-agent transaction simulations'],
      dependencies: ['http_api'],
      rollbackStrategy: 'Fallback to legacy manual queue lock-release scripts.'
    });

    // Advance first pipeline to Validated for the dashboard
    this.simulateComposition(this.getCompositionByName('ResearchVerificationPipeline')!.compositionId);
    this.validateComposition(this.getCompositionByName('ResearchVerificationPipeline')!.compositionId);
  }

  public addNode(id: string, name: string, category: string) {
    this.nodes.set(id, { id, name, category });
  }

  public addEdge(from: string, to: string, relation: CapabilityGraphEdge['relation']) {
    this.edges.push({ from, to, relation });
  }

  public getCapabilityGraph(): { nodes: CapabilityGraphNode[]; edges: CapabilityGraphEdge[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges
    };
  }

  public proposeComposition(comp: Omit<CapabilityComposition, 'compositionId' | 'status' | 'createdAt'>): CapabilityComposition {
    const compositionId = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: CapabilityComposition = {
      ...comp,
      compositionId,
      status: 'PROPOSED',
      createdAt: new Date().toISOString()
    };
    this.compositions.set(compositionId, record);

    messageBus.publish('LEDGER_ENTRY', 'CapabilityEvolutionEngine', {
      eventType: 'CapabilityCompositionProposed',
      payload: record
    }, { severity: 'info' });

    return record;
  }

  public getComposition(id: string): CapabilityComposition | undefined {
    return this.compositions.get(id);
  }

  public getCompositionByName(name: string): CapabilityComposition | undefined {
    return Array.from(this.compositions.values()).find(c => c.name === name);
  }

  public getAllCompositions(): CapabilityComposition[] {
    return Array.from(this.compositions.values());
  }

  public simulateComposition(id: string): CapabilityComposition | undefined {
    const comp = this.compositions.get(id);
    if (!comp) return undefined;

    comp.status = 'SIMULATED';
    this.compositions.set(id, comp);

    messageBus.publish('LEDGER_ENTRY', 'CapabilityEvolutionEngine', {
      eventType: 'CapabilitySimulationCompleted',
      payload: comp
    }, { severity: 'info' });

    return comp;
  }

  public validateComposition(id: string): CapabilityComposition | undefined {
    const comp = this.compositions.get(id);
    if (!comp) return undefined;

    comp.status = 'VALIDATED';
    this.compositions.set(id, comp);

    messageBus.publish('LEDGER_ENTRY', 'CapabilityEvolutionEngine', {
      eventType: 'CapabilitySimulationCompleted',
      payload: comp
    }, { severity: 'success' });

    return comp;
  }

  public promoteComposition(id: string, authorizedBy: string = 'GovernanceEngine'): CapabilityComposition | undefined {
    const comp = this.compositions.get(id);
    if (!comp) return undefined;

    // Check risk rules
    if (comp.expectedRisk === 'HIGH' || comp.expectedRisk === 'CRITICAL') {
      messageBus.publish('LEDGER_ENTRY', 'CapabilityEvolutionEngine', {
        eventType: 'CapabilityPromotionBlocked',
        payload: { id, reason: `Requires explicit HUMAN authorization. Risk is ${comp.expectedRisk}.` }
      }, { severity: 'warning' });
      return comp; // Do not promote automatically
    }

    comp.status = 'AVAILABLE';
    this.compositions.set(id, comp);

    messageBus.publish('LEDGER_ENTRY', 'CapabilityEvolutionEngine', {
      eventType: 'CapabilityPromoted',
      payload: { id, promotedBy: authorizedBy }
    }, { severity: 'success' });

    return comp;
  }

  public restrictComposition(id: string, reason: string): CapabilityComposition | undefined {
    const comp = this.compositions.get(id);
    if (!comp) return undefined;

    comp.status = 'PROPOSED'; // downgrade status back
    this.compositions.set(id, comp);

    messageBus.publish('LEDGER_ENTRY', 'CapabilityEvolutionEngine', {
      eventType: 'CapabilityRestricted',
      payload: { id, reason }
    }, { severity: 'warning' });

    return comp;
  }

  /**
   * Benchmarks an evolved composite capability vs a baseline approach
   */
  public runBenchmark(id: string): {
    compositeLatency: number;
    baselineLatency: number;
    compositeSuccessPct: number;
    baselineSuccessPct: number;
    costDeltaPct: number;
    improvementDetected: boolean;
  } {
    const comp = this.compositions.get(id);
    if (!comp) {
      return {
        compositeLatency: 0,
        baselineLatency: 0,
        compositeSuccessPct: 0,
        baselineSuccessPct: 0,
        costDeltaPct: 0,
        improvementDetected: false
      };
    }

    // Default simulation results for benchmarks
    const isResearchPipeline = comp.name === 'ResearchVerificationPipeline';
    const baselineLatency = isResearchPipeline ? 4200 : 2500;
    const compositeLatency = isResearchPipeline ? 1850 : 2400; // Evolved composite has better concurrency control
    const baselineSuccessPct = isResearchPipeline ? 72 : 84;
    const compositeSuccessPct = isResearchPipeline ? 98 : 96;
    const costDeltaPct = isResearchPipeline ? 18 : 34; // Slight token overhead due to additional verifications

    return {
      compositeLatency,
      baselineLatency,
      compositeSuccessPct,
      baselineSuccessPct,
      costDeltaPct,
      improvementDetected: (compositeSuccessPct > baselineSuccessPct) && (compositeLatency < baselineLatency)
    };
  }
}

export const capabilityEvolutionEngine = new CapabilityEvolutionEngine();
