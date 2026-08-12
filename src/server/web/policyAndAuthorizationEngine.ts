import {
  CapabilityRequest,
  PolicyDecision,
  CapabilityApprovalRequest,
  CapabilityDescriptor,
} from '../../shared/types';
import { capabilityRegistry } from './capabilityRegistry';

class PolicyAndAuthorizationEngine {
  private approvalQueue: Map<string, CapabilityApprovalRequest> = new Map();
  private idempotencyCache: Map<string, any> = new Map();
  private rateLimitTracker: Map<string, { count: number; windowResetTime: number }> = new Map();

  public evaluateRequest(request: CapabilityRequest): PolicyDecision {
    const timestamp = new Date().toISOString();
    const evaluatedRules: string[] = [];

    // 1. Service Identity Check
    evaluatedRules.push('RULE_1_SERVICE_IDENTITY');
    if (request.authorizationContext.serviceIdentity !== 'hermes-hive') {
      return {
        decision: 'DENY',
        reason: 'Untrusted service identity. Request must originate from authenticated "hermes-hive".',
        evaluatedRules,
        timestamp,
      };
    }

    // 2. Capability Existence & Availability Check
    evaluatedRules.push('RULE_2_CAPABILITY_AVAILABILITY');
    const cap = capabilityRegistry.getCapability(request.capabilityId);
    if (!cap) {
      return {
        decision: 'DENY',
        reason: `Capability "${request.capabilityId}" is not registered in Hermes Web capability fabric.`,
        evaluatedRules,
        timestamp,
      };
    }

    if (cap.availability === 'offline') {
      return {
        decision: 'DENY',
        reason: `Capability "${cap.name}" is currently offline for maintenance.`,
        evaluatedRules,
        timestamp,
      };
    }

    // 3. Operation Support Check
    evaluatedRules.push('RULE_3_OPERATION_VALIDATION');
    if (!cap.operations.includes(request.operation)) {
      return {
        decision: 'DENY',
        reason: `Operation "${request.operation}" is not supported by capability "${cap.id}". Supported: [${cap.operations.join(', ')}]`,
        evaluatedRules,
        timestamp,
      };
    }

    // 4. Simulation Mode Check (Simulation is ALWAYS allowed if capability supports it)
    if (request.executionMode === 'SIMULATE') {
      evaluatedRules.push('RULE_4_SIMULATION_ALLOW');
      return {
        decision: 'ALLOW',
        reason: 'Simulation request authorized for risk estimation and side-effect dry run.',
        evaluatedRules,
        timestamp,
      };
    }

    // 5. Rate Limit Check (live executions only — simulations bypass the quota)
    evaluatedRules.push('RULE_5_RATE_LIMIT');
    const key = `${request.authorizationContext.serviceIdentity}:${request.capabilityId}`;
    const now = Date.now();
    const tracker = this.rateLimitTracker.get(key) || { count: 0, windowResetTime: now + 60000 };

    if (now >= tracker.windowResetTime) {
      tracker.count = 0;
      tracker.windowResetTime = now + 60000;
    }

    if (tracker.count >= cap.rateLimits.maxRequestsPerMin) {
      return {
        decision: 'DENY',
        reason: `Rate limit exceeded for capability "${cap.name}". Max ${cap.rateLimits.maxRequestsPerMin} req/min.`,
        evaluatedRules,
        timestamp,
      };
    }
    tracker.count += 1;
    this.rateLimitTracker.set(key, tracker);

    // 6. Risk Level & Human/Policy Approval Check
    evaluatedRules.push('RULE_6_RISK_POLICY_EVALUATION');
    const effectiveRisk = cap.riskLevel;

    if (effectiveRisk === 'HIGH' || effectiveRisk === 'CRITICAL') {
      // Create pending approval request
      const approvalId = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const approvalReq: CapabilityApprovalRequest = {
        approvalId,
        executionId: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        requestId: request.requestId,
        capabilityId: request.capabilityId,
        operation: request.operation,
        requestingAgentId: request.agentId,
        requestingAgentName: request.agentName,
        riskLevel: effectiveRisk,
        parameters: request.parameters,
        reason: `Capability action requires explicit approval due to ${effectiveRisk} risk level.`,
        status: 'PENDING',
        createdAt: timestamp,
      };

      this.approvalQueue.set(approvalId, approvalReq);

      return {
        decision: 'REQUIRE_APPROVAL',
        reason: `Operation requires approval due to ${effectiveRisk} risk level. Approval ID generated: ${approvalId}`,
        approvalId,
        evaluatedRules,
        timestamp,
      };
    }

    // Default Allow for LOW and MEDIUM risk execution
    evaluatedRules.push('RULE_7_DEFAULT_ALLOW');
    return {
      decision: 'ALLOW',
      reason: 'Request passed all policy, authorization, and rate limit checks.',
      evaluatedRules,
      timestamp,
    };
  }

  public checkIdempotency(key?: string, executionMode?: string): any | null {
    if (!key) return null;
    return this.idempotencyCache.get(this.idempotencyCacheKey(key, executionMode)) || null;
  }

  public recordIdempotency(key: string, result: any, executionMode?: string): void {
    if (key) {
      this.idempotencyCache.set(this.idempotencyCacheKey(key, executionMode), result);
    }
  }

  /**
   * Idempotency results are cached per (key, executionMode). A SIMULATE dry-run
   * is a different operation from a live EXECUTE even when the client reuses
   * the same idempotency key, so the cache must not serve a simulation result
   * back to a caller that has since asked for real execution.
   */
  private idempotencyCacheKey(key: string, executionMode?: string): string {
    return `${key}::${executionMode ?? 'UNSPECIFIED'}`;
  }

  public getPendingApprovals(): CapabilityApprovalRequest[] {
    return Array.from(this.approvalQueue.values()).filter((a) => a.status === 'PENDING');
  }

  public resolveApproval(approvalId: string, approved: boolean, resolvedBy: string = 'Operator'): CapabilityApprovalRequest | null {
    const appr = this.approvalQueue.get(approvalId);
    if (!appr) return null;

    appr.status = approved ? 'APPROVED' : 'REJECTED';
    appr.resolvedAt = new Date().toISOString();
    appr.resolvedBy = resolvedBy;
    return appr;
  }

  public getApproval(approvalId: string): CapabilityApprovalRequest | undefined {
    return this.approvalQueue.get(approvalId);
  }
}

export const policyAndAuthorizationEngine = new PolicyAndAuthorizationEngine();
