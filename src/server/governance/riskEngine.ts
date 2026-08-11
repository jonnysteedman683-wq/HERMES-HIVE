import { RiskAssessment, RiskFactors, RiskLevel } from '../../shared/types';
import { messageBus } from '../bus/messageBus';

export interface EvaluateRiskOptions {
  actionType: string;
  targetResource?: string;
  agentId?: string;
  missionId?: string;
  factorsOverride?: Partial<RiskFactors>;
}

export class RiskEngine {
  private thresholdMedium = 30;
  private thresholdHigh = 60;
  private thresholdCritical = 85;

  /**
   * Assess risk for any operational action
   */
  public evaluateRisk(options: EvaluateRiskOptions): RiskAssessment {
    const factors = this.computeFactors(options);

    // Score formula based on weighted sum of factors
    const score = Math.round(
      factors.impact * 1.5 +
      factors.uncertainty * 1.2 +
      factors.reversibility * 1.8 +
      factors.privilege * 1.5 +
      factors.externality * 1.2 +
      factors.securitySensitivity * 1.8 +
      factors.resourceCost * 1.0
    );

    const normalizedScore = Math.min(100, Math.max(0, Math.round((score / 100) * 100)));

    let riskLevel: RiskLevel = 'LOW';
    let requiredApproval: RiskAssessment['requiredApproval'] = 'AUTONOMOUS';

    if (normalizedScore >= this.thresholdCritical) {
      riskLevel = 'CRITICAL';
      requiredApproval = 'EXPLICIT_HUMAN_AUTHORIZATION';
    } else if (normalizedScore >= this.thresholdHigh) {
      riskLevel = 'HIGH';
      requiredApproval = 'MULTI_AGENT_APPROVAL';
    } else if (normalizedScore >= this.thresholdMedium) {
      riskLevel = 'MEDIUM';
      requiredApproval = 'VERIFICATION_REQUIRED';
    } else {
      riskLevel = 'LOW';
      requiredApproval = 'AUTONOMOUS';
    }

    const assessment: RiskAssessment = {
      id: `risk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actionType: options.actionType,
      targetResource: options.targetResource,
      agentId: options.agentId,
      riskLevel,
      score: normalizedScore,
      factors,
      requiredApproval,
      timestamp: new Date().toISOString(),
    };

    messageBus.publish('RISK_ASSESSED', 'RiskEngine', {
      assessment,
    }, {
      agentId: options.agentId,
      missionId: options.missionId,
      severity: riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'warning' : 'info',
    });

    return assessment;
  }

  private computeFactors(options: EvaluateRiskOptions): RiskFactors {
    const actionLower = options.actionType.toLowerCase();

    const defaults: RiskFactors = {
      impact: 3,
      uncertainty: 3,
      reversibility: 2,
      privilege: 3,
      externality: 2,
      securitySensitivity: 3,
      resourceCost: 2,
    };

    if (actionLower.includes('delete') || actionLower.includes('drop') || actionLower.includes('purge')) {
      defaults.impact = 9;
      defaults.reversibility = 9;
      defaults.privilege = 8;
    }

    if (actionLower.includes('deploy') || actionLower.includes('publish') || actionLower.includes('exec')) {
      defaults.impact = 8;
      defaults.externality = 8;
      defaults.uncertainty = 6;
      defaults.securitySensitivity = 8;
    }

    if (actionLower.includes('crypto') || actionLower.includes('auth') || actionLower.includes('security')) {
      defaults.securitySensitivity = 9;
      defaults.impact = 8;
      defaults.privilege = 8;
    }

    if (options.factorsOverride) {
      Object.assign(defaults, options.factorsOverride);
    }

    return defaults;
  }
}

export const riskEngine = new RiskEngine();
