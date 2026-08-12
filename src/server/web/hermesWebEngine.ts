import {
  CapabilityEventEnvelope,
  CapabilityEventType,
  CapabilityRequest,
  CapabilityResponse,
  CapabilityApprovalRequest,
} from '../../shared/types';
import { capabilityRegistry } from './capabilityRegistry';
import { capabilityRouter } from './capabilityRouter';
import { policyAndAuthorizationEngine } from './policyAndAuthorizationEngine';
import { auditLogger } from './auditLogger';

class HermesWebEngine {
  private events: CapabilityEventEnvelope[] = [];
  private activeExecutions: Map<string, CapabilityResponse> = new Map();

  constructor() {
    this.emitEvent({
      eventId: `evt_${Date.now()}_init`,
      eventType: 'capability.available',
      schemaVersion: '1.0',
      timestamp: new Date().toISOString(),
      source: 'hermes-web',
      correlationId: 'sys_boot',
      traceId: 'sys_boot',
      payload: {
        message: 'HERMES WEB capability execution fabric booted and operational.',
        registeredCapabilitiesCount: capabilityRegistry.getAllCapabilities().length,
      },
    });
  }

  public emitEvent(evt: CapabilityEventEnvelope): void {
    this.events.unshift(evt);
    if (this.events.length > 200) {
      this.events = this.events.slice(0, 200);
    }
  }

  public getEvents(limit: number = 50, traceId?: string): CapabilityEventEnvelope[] {
    if (traceId) {
      return this.events.filter((e) => e.traceId === traceId || e.correlationId === traceId).slice(0, limit);
    }
    return this.events.slice(0, limit);
  }

  public async processCapabilityRequest(request: CapabilityRequest): Promise<CapabilityResponse> {
    // 1. Emit request event
    this.emitEvent({
      eventId: `evt_${Date.now()}_req`,
      eventType: 'execution.requested',
      schemaVersion: '1.0',
      timestamp: new Date().toISOString(),
      source: 'hermes-hive',
      correlationId: request.correlationId,
      traceId: request.traceId,
      requestId: request.requestId,
      agentId: request.agentId,
      capabilityId: request.capabilityId,
      payload: {
        operation: request.operation,
        executionMode: request.executionMode,
        serviceIdentity: request.authorizationContext.serviceIdentity,
      },
    });

    // 2. Route request through router
    let response: CapabilityResponse;
    try {
      response = await capabilityRouter.routeRequest(request);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.emitEvent({
        eventId: `evt_${Date.now()}_res`,
        eventType: 'execution.failed',
        schemaVersion: '1.0',
        timestamp: new Date().toISOString(),
        source: 'hermes-web',
        correlationId: request.correlationId,
        traceId: request.traceId,
        requestId: request.requestId,
        agentId: request.agentId,
        capabilityId: request.capabilityId,
        payload: {
          status: 'FAILED',
          executionStatus: 'FAILED',
          error: errorMessage,
        },
      });

      response = {
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
          providerUsed: 'hermes-web',
          executionMode: request.executionMode,
          traceId: request.traceId,
          correlationId: request.correlationId,
        },
      };
    }
    this.activeExecutions.set(response.executionId, response);

    // 3. Emit completed / status event
    let eventType: CapabilityEventType = 'execution.completed';
    if (response.status === 'REJECTED' || response.status === 'FAILED') eventType = 'execution.failed';
    if (response.status === 'APPROVAL_REQUIRED') eventType = 'approval.required';

    this.emitEvent({
      eventId: `evt_${Date.now()}_res`,
      eventType,
      schemaVersion: '1.0',
      timestamp: new Date().toISOString(),
      source: 'hermes-web',
      correlationId: request.correlationId,
      traceId: request.traceId,
      requestId: request.requestId,
      executionId: response.executionId,
      agentId: request.agentId,
      capabilityId: request.capabilityId,
      payload: {
        status: response.status,
        executionStatus: response.executionStatus,
        verificationStatus: response.verificationStatus,
        durationMs: response.timing.durationMs,
      },
    });

    return response;
  }

  public getExecution(executionId: string): CapabilityResponse | undefined {
    return this.activeExecutions.get(executionId);
  }

  public resolveApproval(approvalId: string, approved: boolean, resolvedBy: string = 'Operator'): CapabilityApprovalRequest | null {
    const appr = policyAndAuthorizationEngine.resolveApproval(approvalId, approved, resolvedBy);
    if (appr) {
      this.emitEvent({
        eventId: `evt_${Date.now()}_appr`,
        eventType: approved ? 'execution.authorized' : 'execution.failed',
        schemaVersion: '1.0',
        timestamp: new Date().toISOString(),
        source: 'hermes-web',
        correlationId: appr.requestId,
        traceId: appr.requestId,
        requestId: appr.requestId,
        executionId: appr.executionId,
        payload: {
          approvalId,
          status: appr.status,
          resolvedBy,
        },
      });
    }
    return appr;
  }

  public getHealth(): {
    status: 'healthy' | 'degraded';
    capabilitiesCount: number;
    pendingApprovalsCount: number;
    activeExecutionsCount: number;
    auditStats: any;
    uptimeSeconds: number;
  } {
    const allCaps = capabilityRegistry.getAllCapabilities();
    const pendingApprovals = policyAndAuthorizationEngine.getPendingApprovals();
    const auditStats = auditLogger.getStats();

    return {
      status: 'healthy',
      capabilitiesCount: allCaps.length,
      pendingApprovalsCount: pendingApprovals.length,
      activeExecutionsCount: this.activeExecutions.size,
      auditStats,
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}

export const hermesWebEngine = new HermesWebEngine();
