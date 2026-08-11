import { PortfolioItem } from '../../shared/types';

export class PortfolioManager {
  private projects: Map<string, PortfolioItem> = new Map();

  constructor() {
    this.seedPortfolio();
  }

  private seedPortfolio(): void {
    const items: PortfolioItem[] = [
      {
        projectId: 'proj-001',
        name: 'Stage 5A Executive Self-Model & Digital Twin',
        description: 'Organizational self-graph, isolated digital twin scenario engine, and foresight forecasting.',
        strategicValue: 98,
        urgency: 'CRITICAL',
        costTokensBudget: 250000,
        costTokensConsumed: 180000,
        riskLevel: 'LOW',
        status: 'COMPLETED',
        progressPct: 100,
        dependencies: ['governanceEngine', 'hiveRegistry'],
        assignedHiveId: 'hive-hermes-prime',
        updatedAt: new Date().toISOString(),
      },
      {
        projectId: 'proj-002',
        name: 'Stage 5B Autonomous Evolution & Capability Genesis',
        description: 'Controlled evolution pipeline, experiment engine, capability genome, and portfolio manager.',
        strategicValue: 99,
        urgency: 'CRITICAL',
        costTokensBudget: 300000,
        costTokensConsumed: 210000,
        riskLevel: 'LOW',
        status: 'ACTIVE',
        progressPct: 90,
        dependencies: ['proj-001', 'digitalTwin'],
        assignedHiveId: 'hive-hermes-prime',
        updatedAt: new Date().toISOString(),
      },
      {
        projectId: 'proj-003',
        name: 'Cross-Hive Lattice Encryption Attestation Upgrade',
        description: 'Deploy hardware HSM post-quantum signature verification hooks across all remote Hives.',
        strategicValue: 88,
        urgency: 'MEDIUM',
        costTokensBudget: 150000,
        costTokensConsumed: 45000,
        riskLevel: 'MEDIUM',
        status: 'ACTIVE',
        progressPct: 35,
        dependencies: ['hive-security-gamma'],
        assignedHiveId: 'hive-security-gamma',
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const item of items) {
      this.projects.set(item.projectId, item);
    }
  }

  public getAllProjects(): PortfolioItem[] {
    return Array.from(this.projects.values()).sort((a, b) => b.strategicValue - a.strategicValue);
  }

  public updateProjectStatus(projectId: string, status: PortfolioItem['status']): PortfolioItem | null {
    const proj = this.projects.get(projectId);
    if (!proj) return null;
    proj.status = status;
    proj.updatedAt = new Date().toISOString();
    return proj;
  }
}

export const portfolioManager = new PortfolioManager();
