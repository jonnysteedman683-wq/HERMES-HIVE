import { Agent, GovernancePolicy, RiskAssessment } from '../../shared/types';
import { messageBus } from '../bus/messageBus';
import { riskEngine } from './riskEngine';

export interface GovernanceDecision {
  allowed: boolean;
  reason: string;
  riskAssessment: RiskAssessment;
  requiresHumanApproval: boolean;
  approvalRequestId?: string;
}

export interface ApprovalRequest {
  id: string;
  agentId: string;
  agentName: string;
  actionType: string;
  targetResource?: string;
  riskAssessment: RiskAssessment;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

export class GovernanceEngine {
  private policies: Map<string, GovernancePolicy> = new Map();
  private pendingApprovals: Map<string, ApprovalRequest> = new Map();

  constructor() {
    this.registerDefaultPolicies();
  }

  private registerDefaultPolicies() {
    const defaults: GovernancePolicy[] = [
      {
        id: 'pol-prohibited-ops',
        name: 'Prohibited Unsafe System Commands',
        description: 'Strictly forbids un-sanitized destructive file or credential bypass operations.',
        category: 'prohibited',
        enabled: true,
        prohibitedOperations: [
          'rm -rf /',
          'drop database',
          'bypass_auth',
          'eval_untrusted_code',
          'exfiltrate_secrets',
        ],
      },
      {
        id: 'pol-human-gate',
        name: 'Critical Risk Human Gate',
        description: 'Requires explicit human authorization for all actions evaluated as CRITICAL risk.',
        category: 'autonomy',
        enabled: true,
        requireHumanApprovalAboveRisk: 'CRITICAL',
      },
      {
        id: 'pol-resource-ceiling',
        name: 'Token & Resource Ceiling',
        description: 'Cap maximum per-task token consumption to prevent run-away loops.',
        category: 'resource',
        enabled: true,
        maxResourceLimit: 100000,
      },
    ];

    defaults.forEach((p) => this.policies.set(p.id, p));
  }

  /**
   * Evaluate whether an action is authorized under governance policies and risk thresholds
   */
  public evaluateAction(
    agent: Agent,
    actionType: string,
    targetResource?: string,
    parameters?: Record<string, unknown>
  ): GovernanceDecision {
    // 1. Check for prohibited operations
    const actionLower = `${actionType} ${targetResource || ''} ${JSON.stringify(parameters || {})}`.toLowerCase();
    for (const policy of this.policies.values()) {
      if (policy.enabled && policy.prohibitedOperations) {
        for (const op of policy.prohibitedOperations) {
          if (actionLower.includes(op.toLowerCase())) {
            const decision: GovernanceDecision = {
              allowed: false,
              reason: `Governance Violation [${policy.name}]: Operation contains prohibited signature '${op}'.`,
              riskAssessment: riskEngine.evaluateRisk({ actionType, targetResource, agentId: agent.id }),
              requiresHumanApproval: false,
            };

            messageBus.publish('GOVERNANCE_CHECK', 'GovernanceEngine', {
              allowed: false,
              decision,
            }, { agentId: agent.id, severity: 'error' });

            return decision;
          }
        }
      }
    }

    // 2. Perform Risk Evaluation
    const riskAssessment = riskEngine.evaluateRisk({
      actionType,
      targetResource,
      agentId: agent.id,
    });

    // 3. Check for Critical Risk Human Gate
    if (riskAssessment.riskLevel === 'CRITICAL' || riskAssessment.requiredApproval === 'EXPLICIT_HUMAN_AUTHORIZATION') {
      const approvalReq = this.createApprovalRequest(
        agent,
        actionType,
        targetResource,
        riskAssessment,
        `Action evaluated with CRITICAL risk score (${riskAssessment.score}/100). Explicit human authorization required.`
      );

      const decision: GovernanceDecision = {
        allowed: false,
        reason: `Governance Gate: CRITICAL risk detected (${riskAssessment.score}/100). Approval request ${approvalReq.id} pending human review.`,
        riskAssessment,
        requiresHumanApproval: true,
        approvalRequestId: approvalReq.id,
      };

      messageBus.publish('GOVERNANCE_CHECK', 'GovernanceEngine', {
        allowed: false,
        decision,
      }, { agentId: agent.id, severity: 'warning' });

      return decision;
    }

    // 4. Action Approved
    const decision: GovernanceDecision = {
      allowed: true,
      reason: `Authorized under governance policies. Risk Level: ${riskAssessment.riskLevel}.`,
      riskAssessment,
      requiresHumanApproval: false,
    };

    messageBus.publish('GOVERNANCE_CHECK', 'GovernanceEngine', {
      allowed: true,
      decision,
    }, { agentId: agent.id, severity: 'info' });

    return decision;
  }

  /**
   * Create pending human approval request
   */
  private createApprovalRequest(
    agent: Agent,
    actionType: string,
    targetResource: string | undefined,
    riskAssessment: RiskAssessment,
    reason: string
  ): ApprovalRequest {
    const id = `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const req: ApprovalRequest = {
      id,
      agentId: agent.id,
      agentName: agent.name,
      actionType,
      targetResource,
      riskAssessment,
      reason,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.pendingApprovals.set(id, req);
    return req;
  }

  /**
   * Approve a pending approval request
   */
  public approveRequest(requestId: string, decidedBy: string = 'HumanOperator'): boolean {
    const req = this.pendingApprovals.get(requestId);
    if (!req || req.status !== 'PENDING') return false;

    req.status = 'APPROVED';
    req.decidedAt = new Date().toISOString();
    req.decidedBy = decidedBy;

    messageBus.publish('GOVERNANCE_CHECK', 'GovernanceEngine', {
      approvalRequestId: requestId,
      status: 'APPROVED',
      decidedBy,
    }, { agentId: req.agentId, severity: 'success' });

    return true;
  }

  /**
   * Deny a pending approval request
   */
  public denyRequest(requestId: string, decidedBy: string = 'HumanOperator'): boolean {
    const req = this.pendingApprovals.get(requestId);
    if (!req || req.status !== 'PENDING') return false;

    req.status = 'DENIED';
    req.decidedAt = new Date().toISOString();
    req.decidedBy = decidedBy;

    messageBus.publish('GOVERNANCE_CHECK', 'GovernanceEngine', {
      approvalRequestId: requestId,
      status: 'DENIED',
      decidedBy,
    }, { agentId: req.agentId, severity: 'warning' });

    return true;
  }

  public getPendingApprovals(): ApprovalRequest[] {
    return Array.from(this.pendingApprovals.values()).filter((r) => r.status === 'PENDING');
  }

  /**
   * Check if an action signature violates prohibited operation policies
   */
  public checkAction(actionSignature: string): boolean {
    const sigLower = actionSignature.toLowerCase();
    for (const policy of this.policies.values()) {
      if (policy.enabled && policy.prohibitedOperations) {
        for (const op of policy.prohibitedOperations) {
          if (sigLower.includes(op.toLowerCase()) || op.toLowerCase().includes(sigLower)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  public getAllPolicies(): GovernancePolicy[] {
    return Array.from(this.policies.values());
  }
}

export const governanceEngine = new GovernanceEngine();
