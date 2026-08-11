import { OrganizationDivision } from '../../shared/types';

export class OrganizationFactory {
  private divisions: Map<string, OrganizationDivision> = new Map();

  constructor() {
    this.seedDivisions();
  }

  private seedDivisions(): void {
    const divs: OrganizationDivision[] = [
      {
        id: 'div-research',
        name: 'Research & Intelligence Division',
        description: 'Advanced cognitive modeling, pattern mining, and literature synthesis',
        leadAgentId: 'agent-researcher-01',
        budgetTokens: 500000,
        currentProjectsCount: 2,
        kpis: { researchVelocity: 94, accuracyScore: 98 },
      },
      {
        id: 'div-engineering',
        name: 'Autonomous Systems & Engineering Division',
        description: 'Full-stack software architecture, CI/CD pipelines, and app synthesis',
        leadAgentId: 'agent-coder-01',
        budgetTokens: 750000,
        currentProjectsCount: 4,
        kpis: { buildSuccessRatePct: 99, avgBuildTimeSec: 18 },
      },
      {
        id: 'div-security',
        name: 'Governance & Cybersecurity Division',
        description: 'Constitutional safety policy enforcement, zero-trust auditing & risk analysis',
        leadAgentId: 'agent-auditor-01',
        budgetTokens: 350000,
        currentProjectsCount: 1,
        kpis: { zeroTrustCompliancePct: 100, riskMitigationRatePct: 99.5 },
      },
      {
        id: 'div-operations',
        name: 'Swarm Operations & Resilience Division',
        description: 'Self-healing, token budget allocation, and cluster health monitoring',
        leadAgentId: 'agent-operations-01',
        budgetTokens: 400000,
        currentProjectsCount: 3,
        kpis: { swarmUptimePct: 99.9, selfHealingSuccessRatePct: 96 },
      },
    ];

    for (const d of divs) {
      this.divisions.set(d.id, d);
    }
  }

  public getAllDivisions(): OrganizationDivision[] {
    return Array.from(this.divisions.values());
  }

  public getDivisionById(id: string): OrganizationDivision | undefined {
    return this.divisions.get(id);
  }
}

export const organizationFactory = new OrganizationFactory();
