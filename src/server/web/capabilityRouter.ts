import {
  CapabilityRequest,
  CapabilityResponse,
  ErrorEnvelope,
  CapabilityDescriptor,
} from '../../shared/types';
import { capabilityRegistry } from './capabilityRegistry';
import { policyAndAuthorizationEngine } from './policyAndAuthorizationEngine';
import { connectorRuntime } from './connectorRuntime';
import { verificationEngine } from './verificationEngine';
import { auditLogger } from './auditLogger';

export class CapabilityRouter {
  public async routeRequest(request: CapabilityRequest): Promise<CapabilityResponse> {
    const receivedAt = new Date().toISOString();
    const startMs = Date.now();

    // 1. Idempotency Check
    if (request.idempotencyKey) {
      const cached = policyAndAuthorizationEngine.checkIdempotency(request.idempotencyKey, request.executionMode);
      if (cached) {
        return cached;
      }
    }

    // 2. Policy & Authorization Check
    const policyDecision = policyAndAuthorizationEngine.evaluateRequest(request);
    const cap = capabilityRegistry.getCapability(request.capabilityId);

    // If Policy Denies
    if (policyDecision.decision === 'DENY') {
      const durationMs = Date.now() - startMs;
      const errorEnv: ErrorEnvelope = {
        code: 'POLICY_DENIED',
        message: policyDecision.reason,
        category: 'POLICY_DENIED',
        retryable: false,
        severity: 'HIGH',
        requestId: request.requestId,
        timestamp: new Date().toISOString(),
      };

      const response: CapabilityResponse = {
        requestId: request.requestId,
        executionId: `exec_denied_${Date.now()}`,
        status: 'REJECTED',
        executionStatus: 'FAILED',
        verificationStatus: 'FAILED',
        policyDecision,
        result: null,
        error: errorEnv,
        warnings: [policyDecision.reason],
        timing: {
          receivedAt,
          completedAt: new Date().toISOString(),
          durationMs,
        },
        executionMetadata: {
          providerUsed: cap?.provider || 'unknown',
          capabilityVersion: cap?.version || '1.0.0',
          executionMode: request.executionMode,
          traceId: request.traceId,
          correlationId: request.correlationId,
        },
      };

      auditLogger.log({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        traceId: request.traceId,
        correlationId: request.correlationId,
        requestId: request.requestId,
        executionId: response.executionId,
        timestamp: receivedAt,
        serviceIdentity: request.authorizationContext.serviceIdentity,
        agentId: request.agentId,
        agentName: request.agentName,
        capabilityId: request.capabilityId,
        operation: request.operation,
        executionMode: request.executionMode,
        riskLevel: cap?.riskLevel || 'LOW',
        policyDecision: 'DENY',
        executionStatus: 'FAILED',
        verificationStatus: 'FAILED',
        durationMs,
        provider: cap?.provider || 'unknown',
        success: false,
        errorDetails: policyDecision.reason,
      });

      return response;
    }

    // If Policy Requires Human/Policy Approval
    if (policyDecision.decision === 'REQUIRE_APPROVAL') {
      const durationMs = Date.now() - startMs;
      const response: CapabilityResponse = {
        requestId: request.requestId,
        executionId: `exec_pending_appr_${Date.now()}`,
        status: 'APPROVAL_REQUIRED',
        executionStatus: 'PENDING',
        verificationStatus: 'PENDING',
        policyDecision,
        result: {
          message: 'Operation queued pending policy approval.',
          approvalId: policyDecision.approvalId,
        },
        warnings: ['Execution suspended awaiting approval for high risk capability.'],
        timing: {
          receivedAt,
          completedAt: new Date().toISOString(),
          durationMs,
        },
        executionMetadata: {
          providerUsed: cap?.provider || 'unknown',
          capabilityVersion: cap?.version || '1.0.0',
          executionMode: request.executionMode,
          traceId: request.traceId,
          correlationId: request.correlationId,
        },
      };

      auditLogger.log({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        traceId: request.traceId,
        correlationId: request.correlationId,
        requestId: request.requestId,
        executionId: response.executionId,
        timestamp: receivedAt,
        serviceIdentity: request.authorizationContext.serviceIdentity,
        agentId: request.agentId,
        agentName: request.agentName,
        capabilityId: request.capabilityId,
        operation: request.operation,
        executionMode: request.executionMode,
        riskLevel: cap?.riskLevel || 'HIGH',
        policyDecision: 'REQUIRE_APPROVAL',
        executionStatus: 'PENDING',
        verificationStatus: 'PENDING',
        durationMs,
        provider: cap?.provider || 'unknown',
        success: true,
      });

      return response;
    }

    // 3. Handle SIMULATE Execution Mode
    if (request.executionMode === 'SIMULATE') {
      const durationMs = Date.now() - startMs;
      const simulatedSideEffects = [
        `Target Capability: ${cap?.name || request.capabilityId}`,
        `Operation: ${request.operation}`,
        `Evaluated Risk Level: ${cap?.riskLevel}`,
        `Estimated Resource Tokens: 15`,
        `Expected Side Effects: Non-persistent dry run simulation. No external data mutated.`,
      ];

      const response: CapabilityResponse = {
        requestId: request.requestId,
        executionId: `exec_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        status: 'REQUEST_SUCCESS',
        executionStatus: 'SIMULATED',
        verificationStatus: 'VERIFIED',
        policyDecision,
        result: {
          simulated: true,
          capabilityId: request.capabilityId,
          operation: request.operation,
          parametersReceived: request.parameters,
          expectedOutputSchema: cap?.outputSchema || {},
          simulationNote: 'Dry-run completed successfully. Ready for live execution upon approval.',
        },
        timing: {
          receivedAt,
          startedAt: receivedAt,
          completedAt: new Date().toISOString(),
          durationMs,
        },
        executionMetadata: {
          providerUsed: cap?.provider || 'hermes-web-simulation-runtime',
          capabilityVersion: cap?.version || '1.0.0',
          executionMode: 'SIMULATE',
          simulatedSideEffects,
          costEstimateTokens: 15,
          traceId: request.traceId,
          correlationId: request.correlationId,
        },
      };

      if (request.idempotencyKey) {
        policyAndAuthorizationEngine.recordIdempotency(request.idempotencyKey, response, request.executionMode);
      }

      auditLogger.log({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        traceId: request.traceId,
        correlationId: request.correlationId,
        requestId: request.requestId,
        executionId: response.executionId,
        timestamp: receivedAt,
        serviceIdentity: request.authorizationContext.serviceIdentity,
        agentId: request.agentId,
        agentName: request.agentName,
        capabilityId: request.capabilityId,
        operation: request.operation,
        executionMode: 'SIMULATE',
        riskLevel: cap?.riskLevel || 'LOW',
        policyDecision: 'ALLOW',
        executionStatus: 'SIMULATED',
        verificationStatus: 'VERIFIED',
        durationMs,
        provider: cap?.provider || 'unknown',
        success: true,
      });

      return response;
    }

    // 4. Handle Live EXECUTE Execution Mode
    const startedAt = new Date().toISOString();
    const executionId = `exec_live_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      const rawResult = await connectorRuntime.executeConnector(
        cap!,
        request.operation,
        request.parameters,
        request.timeoutMs || 30000
      );

      // Post-Execution Verification
      const verifyRes = await verificationEngine.verifyResult(cap!, request.operation, request.parameters, rawResult);
      const durationMs = Date.now() - startMs;

      const response: CapabilityResponse = {
        requestId: request.requestId,
        executionId,
        status: 'REQUEST_SUCCESS',
        executionStatus: 'COMPLETED',
        verificationStatus: verifyRes.status,
        policyDecision,
        result: rawResult,
        warnings: verifyRes.warnings || [],
        timing: {
          receivedAt,
          startedAt,
          completedAt: new Date().toISOString(),
          durationMs,
        },
        executionMetadata: {
          providerUsed: cap!.provider,
          capabilityVersion: cap!.version,
          executionMode: 'EXECUTE',
          costEstimateTokens: 42,
          traceId: request.traceId,
          correlationId: request.correlationId,
        },
      };

      if (request.idempotencyKey) {
        policyAndAuthorizationEngine.recordIdempotency(request.idempotencyKey, response, request.executionMode);
      }

      auditLogger.log({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        traceId: request.traceId,
        correlationId: request.correlationId,
        requestId: request.requestId,
        executionId,
        timestamp: receivedAt,
        serviceIdentity: request.authorizationContext.serviceIdentity,
        agentId: request.agentId,
        agentName: request.agentName,
        capabilityId: request.capabilityId,
        operation: request.operation,
        executionMode: 'EXECUTE',
        riskLevel: cap!.riskLevel,
        policyDecision: 'ALLOW',
        executionStatus: 'COMPLETED',
        verificationStatus: verifyRes.status,
        durationMs,
        provider: cap!.provider,
        success: true,
      });

      return response;
    } catch (err) {
      const durationMs = Date.now() - startMs;
      const errMsg = err instanceof Error ? err.message : String(err);

      const errorEnv: ErrorEnvelope = {
        code: 'EXECUTION_ERROR',
        message: errMsg,
        category: 'EXECUTION_ERROR',
        retryable: true,
        severity: cap?.riskLevel || 'MEDIUM',
        requestId: request.requestId,
        executionId,
        provider: cap?.provider,
        timestamp: new Date().toISOString(),
      };

      const response: CapabilityResponse = {
        requestId: request.requestId,
        executionId,
        status: 'FAILED',
        executionStatus: 'FAILED',
        verificationStatus: 'FAILED',
        policyDecision,
        result: null,
        error: errorEnv,
        timing: {
          receivedAt,
          startedAt,
          completedAt: new Date().toISOString(),
          durationMs,
        },
        executionMetadata: {
          providerUsed: cap?.provider || 'unknown',
          capabilityVersion: cap?.version || '1.0.0',
          executionMode: 'EXECUTE',
          traceId: request.traceId,
          correlationId: request.correlationId,
        },
      };

      auditLogger.log({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        traceId: request.traceId,
        correlationId: request.correlationId,
        requestId: request.requestId,
        executionId,
        timestamp: receivedAt,
        serviceIdentity: request.authorizationContext.serviceIdentity,
        agentId: request.agentId,
        agentName: request.agentName,
        capabilityId: request.capabilityId,
        operation: request.operation,
        executionMode: 'EXECUTE',
        riskLevel: cap?.riskLevel || 'MEDIUM',
        policyDecision: 'ALLOW',
        executionStatus: 'FAILED',
        verificationStatus: 'FAILED',
        durationMs,
        provider: cap?.provider || 'unknown',
        success: false,
        errorDetails: errMsg,
      });

      return response;
    }
  }
}

export const capabilityRouter = new CapabilityRouter();
