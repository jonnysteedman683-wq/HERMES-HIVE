import {
  CapabilityDescriptor,
  CapabilityRequest,
  CapabilityResponse,
  ExecutionMode,
} from '../../shared/types';
import { capabilityRegistry } from '../web/capabilityRegistry';
import { hermesWebEngine } from '../web/hermesWebEngine';
import { toolRegistry } from '../tools/toolRegistry';
import { causalTracingEngine } from '../diagnostics/causalTracingEngine';

export class WebCapabilityClient {
  private serviceIdentity = 'hermes-hive' as const;

  constructor() {
    this.bindWebCapabilitiesToHiveTools();
  }

  public async discoverCapabilities(filter?: {
    category?: string;
    riskLevel?: string;
  }): Promise<CapabilityDescriptor[]> {
    return capabilityRegistry.getAllCapabilities(filter);
  }

  public async simulateCapability(
    agentId: string,
    agentName: string,
    capabilityId: string,
    operation: string,
    parameters: Record<string, any>,
    traceId?: string
  ): Promise<CapabilityResponse> {
    const activeTraceId = traceId || `trace_${Date.now()}`;
    const request: CapabilityRequest = {
      requestId: `req_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      correlationId: activeTraceId,
      traceId: activeTraceId,
      source: this.serviceIdentity,
      agentId,
      agentName,
      capabilityId,
      operation,
      parameters,
      authorizationContext: {
        serviceIdentity: this.serviceIdentity,
        agentIdentity: agentId,
        permissions: ['capability_execute'],
      },
      executionMode: 'SIMULATE',
      timestamp: new Date().toISOString(),
    };

    let response: CapabilityResponse;
    try {
      response = await hermesWebEngine.processCapabilityRequest(request);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      causalTracingEngine.recordSpan({
        traceId: activeTraceId,
        causality: 'TRIGGERED_BY',
        source: 'WebCapabilityClient',
        actor: agentId,
        component: 'CAPABILITY',
        action: `SIMULATE:${capabilityId}:${operation}`,
        inputs: parameters,
        outputs: null,
        capabilityRef: capabilityId,
        durationMs: 0,
        status: 'FAILED',
        error: {
          code: 'EXECUTION_ERROR',
          message: errorMessage,
          category: 'EXECUTION_ERROR',
          retryable: false,
          severity: 'HIGH',
          requestId: request.requestId,
          timestamp: new Date().toISOString(),
        },
      });

      return {
        requestId: request.requestId,
        executionId: `exec_failed_${Date.now()}`,
        status: 'FAILED',
        executionStatus: 'FAILED',
        verificationStatus: 'SKIPPED',
        result: null,
        error: {
          code: 'EXECUTION_ERROR',
          message: errorMessage,
          category: 'EXECUTION_ERROR',
          retryable: false,
          severity: 'HIGH',
          requestId: request.requestId,
          timestamp: new Date().toISOString(),
        },
        warnings: ['Capability simulation failed before completion.'],
        timing: {
          receivedAt: request.timestamp,
          completedAt: new Date().toISOString(),
          durationMs: 0,
        },
        executionMetadata: {
          providerUsed: 'hermes-hive',
          executionMode: 'SIMULATE',
          traceId: activeTraceId,
          correlationId: activeTraceId,
        },
      };
    }

    causalTracingEngine.recordSpan({
      traceId: activeTraceId,
      causality: 'TRIGGERED_BY',
      source: 'WebCapabilityClient',
      actor: agentId,
      component: 'CAPABILITY',
      action: `SIMULATE:${capabilityId}:${operation}`,
      inputs: parameters,
      outputs: response.result,
      capabilityRef: capabilityId,
      durationMs: response.timing.durationMs,
      status: response.status === 'REQUEST_SUCCESS' ? 'SUCCESS' : 'FAILED',
      error: response.error,
    });

    return response;
  }

  public async executeCapability(
    agentId: string,
    agentName: string,
    capabilityId: string,
    operation: string,
    parameters: Record<string, any>,
    executionMode: ExecutionMode = 'EXECUTE',
    idempotencyKey?: string,
    traceId?: string
  ): Promise<CapabilityResponse> {
    const activeTraceId = traceId || `trace_${Date.now()}`;
    const request: CapabilityRequest = {
      requestId: `req_exec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      correlationId: activeTraceId,
      traceId: activeTraceId,
      source: this.serviceIdentity,
      agentId,
      agentName,
      capabilityId,
      operation,
      parameters,
      authorizationContext: {
        serviceIdentity: this.serviceIdentity,
        agentIdentity: agentId,
        permissions: ['capability_execute'],
      },
      executionMode,
      idempotencyKey,
      timestamp: new Date().toISOString(),
    };

    let response: CapabilityResponse;
    try {
      response = await hermesWebEngine.processCapabilityRequest(request);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      causalTracingEngine.recordSpan({
        traceId: activeTraceId,
        causality: 'TRIGGERED_BY',
        source: 'WebCapabilityClient',
        actor: agentId,
        component: 'HERMES_WEB',
        action: `EXECUTE:${capabilityId}:${operation}`,
        inputs: parameters,
        outputs: null,
        capabilityRef: capabilityId,
        durationMs: 0,
        status: 'FAILED',
        error: {
          code: 'EXECUTION_ERROR',
          message: errorMessage,
          category: 'EXECUTION_ERROR',
          retryable: false,
          severity: 'HIGH',
          requestId: request.requestId,
          timestamp: new Date().toISOString(),
        },
      });

      return {
        requestId: request.requestId,
        executionId: `exec_failed_${Date.now()}`,
        status: 'FAILED',
        executionStatus: 'FAILED',
        verificationStatus: 'SKIPPED',
        result: null,
        error: {
          code: 'EXECUTION_ERROR',
          message: errorMessage,
          category: 'EXECUTION_ERROR',
          retryable: false,
          severity: 'HIGH',
          requestId: request.requestId,
          timestamp: new Date().toISOString(),
        },
        warnings: ['Capability execution failed before completion.'],
        timing: {
          receivedAt: request.timestamp,
          completedAt: new Date().toISOString(),
          durationMs: 0,
        },
        executionMetadata: {
          providerUsed: 'hermes-hive',
          executionMode,
          traceId: activeTraceId,
          correlationId: activeTraceId,
        },
      };
    }

    causalTracingEngine.recordSpan({
      traceId: activeTraceId,
      causality: 'TRIGGERED_BY',
      source: 'WebCapabilityClient',
      actor: agentId,
      component: 'HERMES_WEB',
      action: `EXECUTE:${capabilityId}:${operation}`,
      inputs: parameters,
      outputs: response.result,
      capabilityRef: capabilityId,
      durationMs: response.timing.durationMs,
      status: response.status === 'REQUEST_SUCCESS' ? 'SUCCESS' : 'FAILED',
      error: response.error,
    });

    return response;
  }

  public bindWebCapabilitiesToHiveTools(): void {
    const caps = capabilityRegistry.getAllCapabilities();
    for (const cap of caps) {
      toolRegistry.registerTool({
        name: `web_${cap.id.replace(/\./g, '_')}`,
        description: `[HERMES WEB CAPABILITY] ${cap.description}`,
        permissions: cap.permissions,
        execute: async (input: any, context: any) => {
          const start = Date.now();
          const op = input.operation || cap.operations[0] || 'execute';
          const agentId = context?.agentId || 'hermes_prime_executive';
          const agentName = context?.agentName || 'Hermes Prime';

          const res = await this.executeCapability(agentId, agentName, cap.id, op, input);

          if (res.status === 'REQUEST_SUCCESS') {
            return {
              success: true,
              output: res.result,
              executionTimeMs: Date.now() - start,
            };
          } else if (res.status === 'APPROVAL_REQUIRED') {
            return {
              success: false,
              output: null,
              error: `Action suspended: Policy approval required for ${cap.riskLevel} risk capability. Approval ID: ${res.policyDecision?.approvalId}`,
              executionTimeMs: Date.now() - start,
            };
          } else {
            return {
              success: false,
              output: null,
              error: res.error?.message || 'Web capability execution rejected by Hermes Web Policy Engine',
              executionTimeMs: Date.now() - start,
            };
          }
        },
      });
    }
  }
}

export const webCapabilityClient = new WebCapabilityClient();
