import { CapabilityDescriptor, CapabilityRiskLevel, CapabilityRequest } from '../../shared/types';
import { WorldRiskAssessment } from './worldIntegrationTypes';
import { policyAndAuthorizationEngine } from '../web/policyAndAuthorizationEngine';
import { capabilityReputationEngine } from './capabilityReputation';
import { worldIntegrationSecurity } from './worldIntegrationSecurity';
import { messageBus } from '../bus/messageBus';

export class ActionAuthorizationEngine {
  /**
   * Action levels:
   * LEVEL 0: Internal reasoning. No external action.
   * LEVEL 1: Read-only external observation (web search, public api, public repo read).
   * LEVEL 2: Low-impact external operations (sending non-consequential API notifications).
   * LEVEL 3: Meaningful external state changes (database mutation, SaaS mutation, repository writes).
   * LEVEL 4: High-impact or irreversible operations (system command exec, critical state changes).
   */
  public determineActionLevel(capability: CapabilityDescriptor, operation: string): number {
    if (capability.riskLevel === 'LOW' && (capability.category === 'web_search' || capability.category === 'repository')) {
      return 1; // Level 1
    }

    if (capability.riskLevel === 'LOW') {
      return 2; // Level 2
    }

    if (capability.riskLevel === 'MEDIUM') {
      return 3; // Level 3
    }

    if (capability.riskLevel === 'HIGH' || capability.riskLevel === 'CRITICAL') {
      return 4; // Level 4
    }

    return 0; // Default: safe / level 0
  }

  /**
   * Evaluates if an action is authorized based on risk levels, policies, security state, and human approval constraints.
   */
  public authorizeAction(params: {
    capability: CapabilityDescriptor;
    operation: string;
    parameters: Record<string, any>;
    requestingHiveId?: string;
    requestingAgentId: string;
  }): {
    isAuthorized: boolean;
    actionLevel: number;
    approvalId?: string;
    reason: string;
  } {
    const capability = params.capability;
    const actionLevel = this.determineActionLevel(capability, params.operation);

    // 1. Check world integration security boundaries
    const secCheck = worldIntegrationSecurity.isCapabilityExecutionAllowed(capability.id, capability.category, params.requestingHiveId);
    if (!secCheck.allowed) {
      return {
        isAuthorized: false,
        actionLevel,
        reason: `SECURITY_BLOCKED: ${secCheck.reason}`,
      };
    }

    // 2. Evaluate according to Risk Levels
    if (actionLevel === 1) {
      return {
        isAuthorized: true,
        actionLevel,
        reason: 'Authorized automatically. Read-only level 1 external observation.',
      };
    }

    if (actionLevel === 2) {
      // Automatic but tracked
      return {
        isAuthorized: true,
        actionLevel,
        reason: 'Authorized. Low-impact level 2 external operation.',
      };
    }

    // 3. Level 3 & Level 4 require check against policy engine
    // Create a mock capability request for evaluation
    const mockRequest: CapabilityRequest = {
      requestId: `req_eval_${Date.now()}`,
      correlationId: `eval_${Date.now()}`,
      traceId: `eval_${Date.now()}`,
      source: 'hermes-hive',
      agentId: params.requestingAgentId,
      agentName: 'Evaluator Agent',
      capabilityId: capability.id,
      operation: params.operation,
      parameters: params.parameters,
      authorizationContext: {
        serviceIdentity: 'hermes-hive',
        permissions: ['capability_execute'],
      },
      executionMode: 'EXECUTE',
      timestamp: new Date().toISOString(),
    };

    const policyDecision = policyAndAuthorizationEngine.evaluateRequest(mockRequest);

    if (policyDecision.decision === 'ALLOW') {
      return {
        isAuthorized: true,
        actionLevel,
        reason: 'Authorized. Passed policy engine validation.',
      };
    }

    if (policyDecision.decision === 'REQUIRE_APPROVAL') {
      return {
        isAuthorized: false,
        actionLevel,
        approvalId: policyDecision.approvalId,
        reason: `PENDING_APPROVAL: Action level ${actionLevel} requires explicit human operator confirmation. Approval ID: ${policyDecision.approvalId}`,
      };
    }

    return {
      isAuthorized: false,
      actionLevel,
      reason: `DENIED: Policy engine evaluation rejected: ${policyDecision.reason}`,
    };
  }
}

export class WorldActionSimulator {
  /**
   * Simulates an action to evaluate its potential side effects and risks.
   */
  public simulateAction(
    capability: CapabilityDescriptor,
    operation: string,
    parameters: Record<string, any>
  ): WorldRiskAssessment {
    const rep = capabilityReputationEngine.getReputation(capability.id);
    const reversibilityMap: Record<CapabilityRiskLevel, 'EASY' | 'COMPLEX' | 'IRREVERSIBLE'> = {
      LOW: 'EASY',
      MEDIUM: 'COMPLEX',
      HIGH: 'IRREVERSIBLE',
      CRITICAL: 'IRREVERSIBLE',
    };

    const reversibility = reversibilityMap[capability.riskLevel];
    const reliability = rep.reliabilityScore / 100;
    const informationUncertainty = 1.0 - reliability;

    // Calculate dynamic risk score (1-100)
    let baseScore = capability.riskLevel === 'LOW' ? 10 : capability.riskLevel === 'MEDIUM' ? 35 : capability.riskLevel === 'HIGH' ? 70 : 95;
    
    // Adjust based on reputation and uncertainty
    baseScore += Math.round(informationUncertainty * 15);
    baseScore = Math.max(1, Math.min(100, baseScore));

    const cascadingFailureRisk = Math.round(baseScore * 0.4 + (rep.unexpectedBehaviorsCount * 10));

    let actionRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (baseScore > 85) actionRisk = 'CRITICAL';
    else if (baseScore > 60) actionRisk = 'HIGH';
    else if (baseScore > 30) actionRisk = 'MEDIUM';

    // Formulate a mitigation plan
    let mitigationPlan = 'Ensure proper logs are maintained.';
    if (actionRisk === 'CRITICAL') {
      mitigationPlan = 'Requires full dry-run simulation, sandboxed validation, and explicit dual-signature authorization before live run.';
    } else if (actionRisk === 'HIGH') {
      mitigationPlan = 'Perform pre-execution safety scans, rate-limit concurrent steps, and register clear rollback checkpoints.';
    } else if (actionRisk === 'MEDIUM') {
      mitigationPlan = 'Validate input parameters against JSON schema; confirm target service is responding to pings.';
    }

    const assessment: WorldRiskAssessment = {
      riskScore: baseScore,
      actionRisk,
      informationUncertainty,
      capabilityReliability: reliability,
      cascadingFailureRisk,
      mitigationPlan,
      reversibility,
      humanApprovalRequired: actionRisk === 'HIGH' || actionRisk === 'CRITICAL',
    };

    messageBus.publish('RISK_ASSESSED', 'WorldActionSimulator', {
      capabilityId: capability.id,
      operation,
      riskScore: assessment.riskScore,
      actionRisk: assessment.actionRisk,
    }, { severity: 'info' });

    return assessment;
  }
}

export const actionAuthorizationEngine = new ActionAuthorizationEngine();
export const actionAuthorization = actionAuthorizationEngine;

export const worldActionSimulator = new WorldActionSimulator();
export const actionSimulator = worldActionSimulator;
