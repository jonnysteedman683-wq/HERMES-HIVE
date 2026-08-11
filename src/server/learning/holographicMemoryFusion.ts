import { HolographicNode, SuperHologram } from '../../shared/stage10Types';
import { messageBus } from '../bus/messageBus';

export class HolographicMemoryFusion {
  private nodes: Map<string, HolographicNode> = new Map();
  private alignmentPct: number = 88.5;
  private entropy: number = 24.3;

  constructor() {
    this.seedDefaultHologramData();
  }

  private seedDefaultHologramData() {
    // Seed high-dimensional holographic nodes representing deep fused wisdom
    const n1: HolographicNode = {
      id: 'hn-101',
      label: 'Zero-Drift Ledger Synchronization Heuristic',
      dimensionVector: [0.85, -0.12, 0.44, 0.95, -0.32],
      associatedInsight: 'Cryptographic lock timeouts should be dynamically mapped against temporal delay offsets to completely eliminate microsecond block drift.',
      sourceHive: 'Hive Chronos',
      importanceScore: 0.94,
      connections: ['hn-102', 'hn-103'],
      timestamp: new Date(Date.now() - 48000000).toISOString()
    };

    const n2: HolographicNode = {
      id: 'hn-102',
      label: 'Adaptive Thread Throttling Protocol',
      dimensionVector: [-0.41, 0.62, 0.78, -0.11, 0.55],
      associatedInsight: 'Provider socket timeouts under peak multi-threading are best handled by a temporary adaptive queue throttling multiplier of 0.75.',
      sourceHive: 'Hive Nexus',
      importanceScore: 0.88,
      connections: ['hn-101', 'hn-104'],
      timestamp: new Date(Date.now() - 24000000).toISOString()
    };

    const n3: HolographicNode = {
      id: 'hn-103',
      label: 'Cognitive Synergy Balance Constraint',
      dimensionVector: [0.15, 0.88, -0.21, 0.63, 0.12],
      associatedInsight: 'Decentrally routing work based on historic latency accuracy is 4.5x more resource efficient than routing strictly by trust coefficients.',
      sourceHive: 'Hive Gaia',
      importanceScore: 0.91,
      connections: ['hn-101', 'hn-105'],
      timestamp: new Date(Date.now() - 12000000).toISOString()
    };

    const n4: HolographicNode = {
      id: 'hn-104',
      label: 'Recursive Safety Boundaries Sandboxing',
      dimensionVector: [0.98, -0.92, 0.11, -0.45, 0.73],
      associatedInsight: 'Self-mutating code blocks must undergo complete offline virtualization with synthetic query depths before dynamic hot hotswap.',
      sourceHive: 'Hive Hephaestus',
      importanceScore: 0.97,
      connections: ['hn-102', 'hn-105'],
      timestamp: new Date(Date.now() - 6000000).toISOString()
    };

    const n5: HolographicNode = {
      id: 'hn-105',
      label: 'Symbiotic Energy Token Redistribution',
      dimensionVector: [-0.22, -0.15, 0.92, 0.38, -0.84],
      associatedInsight: 'Energy reallocations from Primary Strategists to remote high-latency worker hives optimizes total swarm throughput by 14.8%.',
      sourceHive: 'Hive Prime',
      importanceScore: 0.96,
      connections: ['hn-103', 'hn-104'],
      timestamp: new Date().toISOString()
    };

    this.nodes.set(n1.id, n1);
    this.nodes.set(n2.id, n2);
    this.nodes.set(n3.id, n3);
    this.nodes.set(n4.id, n4);
    this.nodes.set(n5.id, n5);
  }

  public getHologram(): SuperHologram {
    const nodesArray = Array.from(this.nodes.values());
    
    // Dynamic consciousness alignment calculation
    const avgImportance = nodesArray.reduce((sum, node) => sum + node.importanceScore, 0) / (nodesArray.length || 1);
    this.alignmentPct = Math.min(100, Math.round((75 + avgImportance * 22) * 10) / 10);

    // Knowledge entropy drops as average connections and importance scores rise
    const avgConnections = nodesArray.reduce((sum, node) => sum + node.connections.length, 0) / (nodesArray.length || 1);
    this.entropy = Math.max(5.0, Math.round((45 - (avgConnections * 4) - (avgImportance * 15)) * 10) / 10);

    return {
      lastUpdated: new Date().toISOString(),
      globalConsciousnessAlignmentPct: this.alignmentPct,
      knowledgeEntropy: this.entropy,
      nodes: nodesArray
    };
  }

  public recordInsightNode(
    label: string,
    dimensionVector: number[],
    associatedInsight: string,
    sourceHive: string,
    importanceScore: number,
    initialConnections: string[] = []
  ): HolographicNode {
    const id = `hn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: HolographicNode = {
      id,
      label,
      dimensionVector,
      associatedInsight,
      sourceHive,
      importanceScore,
      connections: initialConnections,
      timestamp: new Date().toISOString()
    };

    this.nodes.set(id, record);

    // Bidirectionally attach initial connections
    for (const connId of initialConnections) {
      const parentNode = this.nodes.get(connId);
      if (parentNode && !parentNode.connections.includes(id)) {
        parentNode.connections.push(id);
        this.nodes.set(connId, parentNode);
      }
    }

    messageBus.publish('LEDGER_ENTRY', 'HolographicMemoryFusion', {
      eventType: 'HolographicInsightFused',
      payload: record
    }, { severity: 'info' });

    return record;
  }

  public connectNodes(nodeId1: string, nodeId2: string): boolean {
    const node1 = this.nodes.get(nodeId1);
    const node2 = this.nodes.get(nodeId2);

    if (!node1 || !node2) return false;

    if (!node1.connections.includes(nodeId2)) {
      node1.connections.push(nodeId2);
      this.nodes.set(nodeId1, node1);
    }
    if (!node2.connections.includes(nodeId1)) {
      node2.connections.push(nodeId1);
      this.nodes.set(nodeId2, node2);
    }

    messageBus.publish('LEDGER_ENTRY', 'HolographicMemoryFusion', {
      eventType: 'HolographicConnectionEstablished',
      payload: { nodeId1, nodeId2 }
    }, { severity: 'info' });

    return true;
  }
}

export const holographicMemoryFusion = new HolographicMemoryFusion();
