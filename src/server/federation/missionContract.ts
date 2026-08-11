import { MissionContract, RiskLevel, ContractStatus } from '../../shared/types';

export class MissionContractManager {
  private contracts: Map<string, MissionContract> = new Map();

  constructor() {
    // Seed initial contract example
    const now = new Date().toISOString();
    const sampleContract: MissionContract = {
      contractId: 'contract-fed-001',
      requestingHive: 'hive-hermes-prime',
      executingHive: 'hive-research-alpha',
      objective: 'Deep cryptographic vulnerability analysis of federated communication layer',
      successCriteria: [
        'Identify potential message injection vectors',
        'Verify zero-trust token signature validation',
        'Provide post-quantum mitigation report',
      ],
      resourceBudget: {
        maxTokens: 45000,
        maxApiCalls: 120,
      },
      deadline: new Date(Date.now() + 86400000).toISOString(),
      riskLevel: 'LOW',
      verificationRequirements: ['INDEPENDENT_AUDIT', 'SIGNATURE_VERIFICATION'],
      permissions: ['READ_FEDERATION_MESSAGES', 'ANALYZE_SECURITY'],
      deliverables: ['Vulnerability_Report.pdf', 'Mitigation_Patch.ts'],
      rollbackPolicy: 'AUTOMATIC_STATE_RESTORE',
      status: 'ACTIVE',
      createdAt: now,
    };

    this.contracts.set(sampleContract.contractId, sampleContract);
  }

  public getAllContracts(): MissionContract[] {
    return Array.from(this.contracts.values());
  }

  public getContractById(id: string): MissionContract | undefined {
    return this.contracts.get(id);
  }

  public createContract(params: {
    requestingHive: string;
    executingHive: string;
    objective: string;
    successCriteria: string[];
    maxTokens: number;
    deadlineHours?: number;
    riskLevel?: RiskLevel;
  }): MissionContract {
    const id = `contract-fed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const deadlineHours = params.deadlineHours || 24;

    const contract: MissionContract = {
      contractId: id,
      requestingHive: params.requestingHive,
      executingHive: params.executingHive,
      objective: params.objective,
      successCriteria: params.successCriteria,
      resourceBudget: {
        maxTokens: params.maxTokens,
        maxApiCalls: Math.round(params.maxTokens / 500),
      },
      deadline: new Date(Date.now() + deadlineHours * 3600000).toISOString(),
      riskLevel: params.riskLevel || 'MEDIUM',
      verificationRequirements: ['FEDERATION_VERIFICATION_PASS'],
      permissions: ['EXECUTE_REMOTE_TASK'],
      deliverables: ['EXECUTION_LOG', 'RESULT_ARTIFACT'],
      rollbackPolicy: 'STATE_ROLLBACK_ON_FAILURE',
      status: 'NEGOTIATING',
      createdAt: now,
    };

    this.contracts.set(id, contract);
    return contract;
  }

  public updateStatus(contractId: string, status: ContractStatus): boolean {
    const c = this.contracts.get(contractId);
    if (!c) return false;
    c.status = status;
    return true;
  }
}

export const missionContractManager = new MissionContractManager();
