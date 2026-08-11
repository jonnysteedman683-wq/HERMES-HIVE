import { CapabilityItem, CapabilityGap } from '../../shared/types';
import { agentRegistry } from '../registry/agentRegistry';
import { hiveRegistry } from '../federation/hiveRegistry';

export class CapabilityInventory {
  private capabilities: Map<string, CapabilityItem> = new Map();
  private gaps: Map<string, CapabilityGap> = new Map();

  constructor() {
    this.seedCapabilities();
    this.seedGaps();
  }

  private seedCapabilities(): void {
    const agents = agentRegistry.getAllAgents();
    const hives = hiveRegistry.getAllHives();

    const initialCaps: CapabilityItem[] = [
      {
        id: 'cap-exec-decisions',
        name: 'Executive Cognition & Strategy Selection',
        owner: 'Hermes Executive Prime',
        assignedAgents: agents.filter(a => a.role === 'Executive').map(a => a.id),
        assignedHives: ['hive-hermes-prime'],
        classification: 'CORE',
        confidenceScore: 0.98,
        historicalPerformancePct: 98.5,
        availabilityPct: 99.9,
        costTokensPerOp: 1500,
        riskLevel: 'LOW',
      },
      {
        id: 'cap-constitutional-audit',
        name: 'Constitutional Policy & Zero-Trust Auditing',
        owner: 'Governance Engine & Security Gamma Hive',
        assignedAgents: agents.filter(a => a.role === 'SecurityAgent').map(a => a.id),
        assignedHives: ['hive-security-gamma'],
        classification: 'CORE',
        confidenceScore: 0.99,
        historicalPerformancePct: 99.8,
        availabilityPct: 100,
        costTokensPerOp: 800,
        riskLevel: 'LOW',
      },
      {
        id: 'cap-deep-research',
        name: 'Deep Research & Literature Synthesis',
        owner: 'Research Alpha Hive',
        assignedAgents: agents.filter(a => a.role === 'Researcher').map(a => a.id),
        assignedHives: ['hive-research-alpha'],
        classification: 'SPECIALIZED',
        confidenceScore: 0.94,
        historicalPerformancePct: 94.2,
        availabilityPct: 98.0,
        costTokensPerOp: 2500,
        riskLevel: 'LOW',
      },
      {
        id: 'cap-fullstack-build',
        name: 'Autonomous Software Architecture & Build',
        owner: 'Engineering Beta Hive',
        assignedAgents: agents.filter(a => a.role === 'Developer').map(a => a.id),
        assignedHives: ['hive-engineering-beta'],
        classification: 'SPECIALIZED',
        confidenceScore: 0.96,
        historicalPerformancePct: 96.8,
        availabilityPct: 99.2,
        costTokensPerOp: 3200,
        riskLevel: 'MEDIUM',
      },
      {
        id: 'cap-pqc-encryption',
        name: 'Lattice-Based Post-Quantum Cryptography',
        owner: 'Security Gamma Hive',
        assignedAgents: [],
        assignedHives: ['hive-security-gamma'],
        classification: 'EMERGING',
        confidenceScore: 0.88,
        historicalPerformancePct: 89.0,
        availabilityPct: 95.0,
        costTokensPerOp: 4500,
        riskLevel: 'MEDIUM',
      },
      {
        id: 'cap-autonomous-healing',
        name: 'Cross-Hive Swarm Self-Healing',
        owner: 'Operations Division',
        assignedAgents: agents.filter(a => a.role === 'Reviewer').map(a => a.id),
        assignedHives: ['hive-hermes-prime', 'hive-engineering-beta'],
        classification: 'CORE',
        confidenceScore: 0.95,
        historicalPerformancePct: 95.5,
        availabilityPct: 99.5,
        costTokensPerOp: 1200,
        riskLevel: 'LOW',
      },
    ];

    for (const c of initialCaps) {
      this.capabilities.set(c.id, c);
    }
  }

  private seedGaps(): void {
    const gap1: CapabilityGap = {
      gapId: 'gap-001',
      title: 'Real-time Cross-Cloud Relational Failover',
      description: 'Lack of automated single-second database failover across multi-region Cloud SQL instances.',
      severity: 'MEDIUM',
      affectedSystems: ['cloudsql-setup', 'hiveRegistry'],
      recommendedAction: 'Propose automated read-replica promotion protocol in Stage 5B',
    };

    const gap2: CapabilityGap = {
      gapId: 'gap-002',
      title: 'Automated Live Hardware-Attested Key Rotation',
      description: 'HSM attestation key rotation currently relies on scheduled cron trigger rather than event-driven rotation.',
      severity: 'LOW',
      affectedSystems: ['federationProtocol', 'trustEngine'],
      recommendedAction: 'Integrate HSM hardware attestation hook into trustEngine',
    };

    this.gaps.set(gap1.gapId, gap1);
    this.gaps.set(gap2.gapId, gap2);
  }

  public getAllCapabilities(): CapabilityItem[] {
    return Array.from(this.capabilities.values());
  }

  public getAllGaps(): CapabilityGap[] {
    return Array.from(this.gaps.values());
  }
}

export const capabilityInventory = new CapabilityInventory();
