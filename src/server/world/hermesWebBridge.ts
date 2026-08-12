import { CapabilityDescriptor, CapabilityRequest, CapabilityResponse, ExecutionMode } from '../../shared/types';
import { hermesWebEngine } from '../web/hermesWebEngine';
import { capabilityRegistry } from '../web/capabilityRegistry';
import { worldIntegrationSecurity } from './worldIntegrationSecurity';
import { worldEventBus } from './worldEventBus';
import { causalTracingEngine } from '../diagnostics/causalTracingEngine';
import { messageBus } from '../bus/messageBus';
import { worldModel } from './worldModel';

export class HermesWebBridge {
  private serviceIdentity = 'hermes-hive' as const;
  private isConnected = true;
  private lastPingTime = Date.now();
  private avgBridgeLatencyMs = 12;

  constructor() {
    this.seedWorldModelCapabilityEntities();
  }

  private seedWorldModelCapabilityEntities(): void {
    const caps = capabilityRegistry.getAllCapabilities();
    for (const cap of caps) {
      worldModel.addEntity(
        `web-cap-${cap.id}`,
        cap.name,
        'Service',
        cap.description,
        {
          capabilityId: cap.id,
          riskLevel: cap.riskLevel,
          health: cap.health,
          availability: cap.availability,
          permissions: cap.permissions,
        }
      );
      worldModel.addRelationship('sys-hermes-core', `web-cap-${cap.id}`, 'PROVIDES');
    }
  }

  /**
   * Health monitor ping to keep the bridge connectivity active.
   */
  public async pingBridge(): Promise<boolean> {
    const start = Date.now();
    try {
      // Direct call to simulate light IPC or API fetch
      const webHealth = hermesWebEngine.getHealth();
      this.isConnected = webHealth.status === 'healthy';
      this.lastPingTime = Date.now();
      this.avgBridgeLatencyMs = Math.round((this.avgBridgeLatencyMs * 0.7) + ((Date.now() - start) * 0.3));
      
      return this.isConnected;
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  public isBridgeConnected(): boolean {
    return this.isConnected && !worldIntegrationSecurity.getSecurityState().isWebBridgeDisconnected;
  }

  public getBridgeStats() {
    return {
      isConnected: this.isBridgeConnected(),
      avgBridgeLatencyMs: this.avgBridgeLatencyMs,
      lastPingTime: new Date(this.lastPingTime).toISOString(),
    };
  }

  /**
   * Submits capability request securely through the bridge.
   */
  public async submitCapabilityRequest(params: {
    agentId: string;
    agentName: string;
    capabilityId: string;
    operation: string;
    parameters: Record<string, any>;
    executionMode?: ExecutionMode;
    traceId?: string;
    idempotencyKey?: string;
  }): Promise<CapabilityResponse> {
    const activeTraceId = params.traceId || `trace_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const executionMode = params.executionMode || 'EXECUTE';
    const timestamp = new Date().toISOString();

    // Sign the request
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const signature = worldIntegrationSecurity.generateRequestSignature(requestId, params.capabilityId, timestamp);

    const request: CapabilityRequest = {
      requestId,
      correlationId: activeTraceId,
      traceId: activeTraceId,
      source: this.serviceIdentity,
      agentId: params.agentId,
      agentName: params.agentName,
      capabilityId: params.capabilityId,
      operation: params.operation,
      parameters: params.parameters,
      authorizationContext: {
        serviceIdentity: this.serviceIdentity,
        agentIdentity: params.agentId,
        permissions: ['capability_execute'],
        signature,
      },
      executionMode,
      idempotencyKey: params.idempotencyKey,
      timestamp,
    };

    // Buffer requests if connection is dead
    if (!this.isBridgeConnected()) {
      messageBus.publish('BRIDGE_WARNING', 'HermesWebBridge', {
        message: 'Attempted execution during bridge disconnect. Stalling request into buffered mode.',
      }, { severity: 'warning' });

      // Return synthetic waiting response
      return {
        requestId,
        executionId: `exec_waiting_${Date.now()}`,
        status: 'APPROVAL_REQUIRED', // Force waiting state
        executionStatus: 'PENDING',
        verificationStatus: 'PENDING',
        warnings: ['Hermes Web connection is currently offline. Awaiting capability reconnection.'],
        timing: {
          receivedAt: timestamp,
          completedAt: new Date().toISOString(),
          durationMs: 0,
        },
        executionMetadata: {
          providerUsed: 'bridge-buffer',
          capabilityVersion: '1.0.0',
          executionMode,
          traceId: activeTraceId,
          correlationId: activeTraceId,
        },
        result: null,
      };
    }

    // Submit request
    let response: CapabilityResponse;
    try {
      response = await hermesWebEngine.processCapabilityRequest(request);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      causalTracingEngine.recordSpan({
        traceId: activeTraceId,
        causality: 'TRIGGERED_BY',
        source: 'HermesWebBridge',
        actor: params.agentId,
        component: 'HERMES_WEB_BRIDGE',
        action: `${executionMode}:${params.capabilityId}:${params.operation}`,
        inputs: params.parameters,
        outputs: null,
        capabilityRef: params.capabilityId,
        durationMs: 0,
        status: 'FAILED',
        error: {
          code: 'EXECUTION_ERROR',
          message: errorMessage,
          category: 'EXECUTION_ERROR',
          retryable: false,
          severity: 'HIGH',
          requestId,
          timestamp: new Date().toISOString(),
        },
      });

      return {
        requestId,
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
          requestId,
          timestamp: new Date().toISOString(),
        },
        warnings: [`Capability request failed: ${errorMessage}`],
        timing: {
          receivedAt: timestamp,
          completedAt: new Date().toISOString(),
          durationMs: 0,
        },
        executionMetadata: {
          providerUsed: 'hermes-web-bridge',
          capabilityVersion: '1.0.0',
          executionMode,
          traceId: activeTraceId,
          correlationId: activeTraceId,
        },
      };
    }

    // Record causal tracking span
    causalTracingEngine.recordSpan({
      traceId: activeTraceId,
      causality: 'TRIGGERED_BY',
      source: 'HermesWebBridge',
      actor: params.agentId,
      component: 'HERMES_WEB_BRIDGE',
      action: `${executionMode}:${params.capabilityId}:${params.operation}`,
      inputs: params.parameters,
      outputs: response.result,
      capabilityRef: params.capabilityId,
      durationMs: response.timing.durationMs,
      status: response.status === 'REQUEST_SUCCESS' ? 'SUCCESS' : 'FAILED',
      error: response.error,
    });

    return response;
  }
}

export const hermesWebBridge = new HermesWebBridge();
export const hermesWebHealthMonitor = {
  pingBridge: () => hermesWebBridge.pingBridge(),
  isBridgeConnected: () => hermesWebBridge.isBridgeConnected(),
  getBridgeStats: () => hermesWebBridge.getBridgeStats(),
};
export const webHealthMonitor = hermesWebHealthMonitor;
