import { Project } from '../../shared/types';
import { opportunityEngine } from '../innovation/opportunityEngine';

export class ProjectEngine {
  private projects: Map<string, Project> = new Map();

  constructor() {
    this.seedProjects();
  }

  private seedProjects(): void {
    const now = new Date().toISOString();

    const proj1: Project = {
      id: 'proj-001',
      title: 'Hermes Stage 4 Federation Operating System',
      description: 'Full integration of cross-Hive registry, contracts, trust model, and resource economy',
      opportunityId: 'opp-001',
      divisionId: 'div-engineering',
      missionsCount: 3,
      status: 'ACTIVE',
      createdAt: now,
    };

    const proj2: Project = {
      id: 'proj-002',
      title: 'Cognitive Debate Consensus Engine Upgrade',
      description: 'Enhance multi-agent strategy synthesis with independent verification gates',
      divisionId: 'div-research',
      missionsCount: 2,
      status: 'COMPLETED',
      createdAt: now,
    };

    this.projects.set(proj1.id, proj1);
    this.projects.set(proj2.id, proj2);
  }

  public getAllProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  public convertOpportunityToProject(opportunityId: string, divisionId?: string): Project | undefined {
    const opps = opportunityEngine.getAllProposals();
    const opp = opps.find(o => o.proposalId === opportunityId);
    if (!opp) return undefined;

    opportunityEngine.approveProposal(opportunityId);

    const proj: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: opp.title,
      description: opp.description,
      opportunityId: opp.proposalId,
      divisionId: divisionId || 'div-engineering',
      missionsCount: 1,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    this.projects.set(proj.id, proj);
    return proj;
  }
}

export const projectEngine = new ProjectEngine();
