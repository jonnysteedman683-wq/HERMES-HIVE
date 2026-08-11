import { SLAContract, SLAEnforcementRecord } from '../../shared/types';
import { federationEventRepository } from './federationRepositories';
import { federatedEconomicsEngine } from './federatedEconomicsEngine';
import { hiveTrustEngine } from './hiveTrustEngine';

export class SLAEnforcementEngine {
  private slas: Map<string, SLAContract> = new Map();
  private enforcementRecords: Map<string, SLAEnforcementRecord> = new Map();

  public createSLA(
    taskId: string,
    providerHiveId: string,
    consumerHiveId: string,
    agreedLatencyMs: number,
    agreedReliabilityPct: number,
    penaltyTokens: number
  ): SLAContract {
    const sla: SLAContract = {
      slaId: `sla-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      taskId,
      providerHiveId,
      consumerHiveId,
      agreedLatencyMs,
      agreedReliabilityPct,
      penaltyTokens,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.slas.set(sla.slaId, sla);
    
    federationEventRepository.logEvent({
      eventId: `evt-sla-create-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: consumerHiveId,
      destinationHiveId: providerHiveId,
      eventType: 'FEDERATED_TASK_ASSIGNED', // Reuse existing
      details: { taskId, slaId: sla.slaId, penaltyTokens },
      governanceResult: 'ALLOWED',
      traceId: `trace-sla-${sla.slaId}`,
    });

    return sla;
  }

  public evaluateTaskCompletion(
    taskId: string,
    actualLatencyMs: number,
    isSuccessful: boolean
  ): SLAEnforcementRecord | null {
    // Find SLA for task
    const sla = Array.from(this.slas.values()).find((s) => s.taskId === taskId && s.status === 'ACTIVE');
    if (!sla) return null;

    let violationDetected = false;
    let penaltyApplied = 0;
    let details = '';

    if (!isSuccessful) {
      violationDetected = true;
      penaltyApplied = sla.penaltyTokens;
      details = 'Task failed to complete successfully.';
    } else if (actualLatencyMs > sla.agreedLatencyMs) {
      violationDetected = true;
      // Penalty proportional to delay, up to max penaltyTokens
      const delayRatio = (actualLatencyMs - sla.agreedLatencyMs) / sla.agreedLatencyMs;
      penaltyApplied = Math.min(sla.penaltyTokens, Math.floor(sla.penaltyTokens * delayRatio));
      details = `Latency exceeded SLA by ${actualLatencyMs - sla.agreedLatencyMs}ms.`;
    }

    sla.status = violationDetected ? 'VIOLATED' : 'MET';
    sla.resolvedAt = new Date().toISOString();

    const record: SLAEnforcementRecord = {
      recordId: `sla-enf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      slaId: sla.slaId,
      taskId,
      violationDetected,
      actualLatencyMs,
      penaltyApplied,
      timestamp: new Date().toISOString(),
      details,
    };
    this.enforcementRecords.set(record.recordId, record);

    if (violationDetected && penaltyApplied > 0) {
      // Execute penalty transfer
      federatedEconomicsEngine.transferTokens(
        sla.providerHiveId,
        sla.consumerHiveId,
        penaltyApplied,
        `SLA Violation Penalty: ${sla.slaId}`
      );
      // Reduce trust score
      hiveTrustEngine.evaluateTrust(
        sla.providerHiveId,
        `SLA Violation: ${sla.slaId} (${actualLatencyMs}ms)`,
        -5, // reliability delta
        0   // policy compliance delta
      );
    } else if (!violationDetected) {
        // Increase trust score on success
        hiveTrustEngine.evaluateTrust(
          sla.providerHiveId,
          `SLA Met: ${sla.slaId}`,
          1,  // reliability delta
          0   // policy compliance delta
        );
    }

    federationEventRepository.logEvent({
      eventId: `evt-sla-enf-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: 'system',
      destinationHiveId: sla.providerHiveId,
      eventType: 'FEDERATED_TASK_SETTLED', // Reuse existing
      details: { taskId, slaId: sla.slaId, violationDetected, penaltyApplied },
      governanceResult: 'ALLOWED',
      traceId: `trace-sla-enf-${record.recordId}`,
    });

    return record;
  }

  public getSLA(slaId: string): SLAContract | undefined {
    return this.slas.get(slaId);
  }
}

export const slaEnforcementEngine = new SLAEnforcementEngine();
