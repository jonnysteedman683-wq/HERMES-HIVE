import { HermesWebAuditLog } from '../../shared/types';

class AuditLogger {
  private logs: HermesWebAuditLog[] = [];
  private maxLogs: number = 500;

  public log(entry: HermesWebAuditLog): void {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  public getLogs(limit: number = 50, filter?: {
    agentId?: string;
    capabilityId?: string;
    traceId?: string;
    riskLevel?: string;
    successOnly?: boolean;
  }): HermesWebAuditLog[] {
    let result = this.logs;
    if (filter) {
      if (filter.agentId) {
        result = result.filter((l) => l.agentId === filter.agentId);
      }
      if (filter.capabilityId) {
        result = result.filter((l) => l.capabilityId === filter.capabilityId);
      }
      if (filter.traceId) {
        result = result.filter((l) => l.traceId === filter.traceId || l.correlationId === filter.traceId);
      }
      if (filter.riskLevel) {
        result = result.filter((l) => l.riskLevel === filter.riskLevel);
      }
      if (filter.successOnly !== undefined) {
        result = result.filter((l) => l.success === filter.successOnly);
      }
    }
    return result.slice(0, limit);
  }

  public getStats(): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    avgDurationMs: number;
  } {
    const totalExecutions = this.logs.length;
    const successfulExecutions = this.logs.filter((l) => l.success).length;
    const failedExecutions = totalExecutions - successfulExecutions;
    const totalDuration = this.logs.reduce((acc, l) => acc + (l.durationMs || 0), 0);
    const avgDurationMs = totalExecutions > 0 ? Math.round(totalDuration / totalExecutions) : 0;

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      avgDurationMs,
    };
  }
}

export const auditLogger = new AuditLogger();
