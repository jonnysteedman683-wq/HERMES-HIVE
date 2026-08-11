import { CapabilityGene } from '../../shared/types';

export class CapabilityGenome {
  private genome: Map<string, CapabilityGene> = new Map();

  constructor() {
    this.seedGenome();
  }

  private seedGenome(): void {
    const genes: CapabilityGene[] = [
      {
        capabilityId: 'gene-exec-cognition',
        category: 'EXECUTIVE_STRATEGY',
        dependencies: ['governance-engine', 'self-model-graph'],
        requiredTools: ['rpc_action', 'schedule'],
        requiredAgents: ['hermes-executive-prime'],
        requiredModels: ['gemini-3.6-flash'],
        performancePct: 98.5,
        reliabilityPct: 99.8,
        costTokensPerOp: 1500,
        state: 'MATURE',
        confidenceScore: 0.99,
      },
      {
        capabilityId: 'gene-digital-twin',
        category: 'SIMULATION_SANDBOX',
        dependencies: ['digitalTwin', 'scenarioEngine'],
        requiredTools: ['compile_applet'],
        requiredAgents: ['simulator-agent'],
        requiredModels: ['gemini-3.6-flash'],
        performancePct: 97.2,
        reliabilityPct: 99.1,
        costTokensPerOp: 2200,
        state: 'VALIDATED',
        confidenceScore: 0.97,
      },
      {
        capabilityId: 'gene-pqc-attestation',
        category: 'POST_QUANTUM_SECURITY',
        dependencies: ['crypto-attestation-hsm'],
        requiredTools: ['verify_signature'],
        requiredAgents: ['auditor-gamma'],
        requiredModels: ['gemini-3.6-flash'],
        performancePct: 89.0,
        reliabilityPct: 95.0,
        costTokensPerOp: 4200,
        state: 'EMERGING',
        confidenceScore: 0.88,
      },
      {
        capabilityId: 'gene-autonomous-genesis',
        category: 'CAPABILITY_GENESIS',
        dependencies: ['hypothesisEngine', 'experimentEngine'],
        requiredTools: ['install_applet_package', 'edit_file'],
        requiredAgents: ['coder-beta'],
        requiredModels: ['gemini-3.6-flash'],
        performancePct: 94.0,
        reliabilityPct: 96.5,
        costTokensPerOp: 3800,
        state: 'EXPERIMENTAL',
        confidenceScore: 0.93,
      },
    ];

    for (const g of genes) {
      this.genome.set(g.capabilityId, g);
    }
  }

  public getGenome(): CapabilityGene[] {
    return Array.from(this.genome.values());
  }
}

export const capabilityGenome = new CapabilityGenome();
