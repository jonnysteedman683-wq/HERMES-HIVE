import { TrustLevel, RiskAssessment } from '../../shared/types';
import { trustEngine } from './trustEngine';
import { riskEngine } from '../governance/riskEngine';

export interface FederationAuthCheck {
  allowed: boolean;
  reason: string;
  riskAssessment: RiskAssessment;
  requiresHumanApproval: boolean;
}

export class FederationGovernance {
  public validateCrossHiveRequest(params: {
    requestingHiveId: string;
    targetHiveId: string;
    actionType: string;
    targetResource?: string;
  }): FederationAuthCheck {
    const trustRec = trustEngine.getTrustRecord(params.requestingHiveId);
    const trustLevel: TrustLevel = trustRec ? trustRec.trustLevel : 'UNKNOWN';

    // 1. Quarantined hives are blocked immediately
    if (trustLevel === 'QUARANTINED') {
      return {
        allowed: false,
        reason: `Hive '${params.requestingHiveId}' is currently QUARANTINED due to low trust score`,
        riskAssessment: {
          id: `risk-quarantine-${Date.now()}`,
          actionType: params.actionType,
          targetResource: params.targetResource,
          riskLevel: 'CRITICAL',
          score: 100,
          factors: { impact: 100, uncertainty: 100, reversibility: 100, privilege: 100, externality: 100, securitySensitivity: 100, resourceCost: 100 },
          requiredApproval: 'EXPLICIT_HUMAN_AUTHORIZATION',
          timestamp: new Date().toISOString(),
        },
        requiresHumanApproval: true,
      };
    }

    // 2. Evaluate risk
    const risk = riskEngine.evaluateRisk({
      actionType: params.actionType,
      targetResource: params.targetResource,
    });

    if (risk.riskLevel === 'CRITICAL') {
      return {
        allowed: false,
        reason: 'CRITICAL risk operation requires explicit human authorization before execution',
        riskAssessment: risk,
        requiresHumanApproval: true,
      };
    }

    return {
      allowed: true,
      reason: `Federated request authorized under trust level ${trustLevel}`,
      riskAssessment: risk,
      requiresHumanApproval: false,
    };
  }
}

export const federationGovernance = new FederationGovernance();
