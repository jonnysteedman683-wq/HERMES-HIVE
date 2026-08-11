import { ResearchProgram } from '../../shared/types';

export class ResearchProgramEngine {
  private programs: Map<string, ResearchProgram> = new Map();

  constructor() {
    this.seedPrograms();
  }

  private seedPrograms(): void {
    const prog1: ResearchProgram = {
      programId: 'res-prog-001',
      title: 'Autonomous Swarm Protocol Efficiency & Zero-Trust Governance',
      domain: 'Multi-Agent Consensus & Cryptographic Auditing',
      questions: [
        'How can cross-Hive contract validation latency be reduced below 100ms without sacrificing PQC signature rigor?',
        'What dynamic token allocation schedule minimizes cost while maintaining 99.9% mission completion rate?',
      ],
      researchMissionsCount: 14,
      activeExperimentsCount: 3,
      confidenceScore: 0.97,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    this.programs.set(prog1.programId, prog1);
  }

  public getAllPrograms(): ResearchProgram[] {
    return Array.from(this.programs.values());
  }
}

export const researchProgramEngine = new ResearchProgramEngine();
