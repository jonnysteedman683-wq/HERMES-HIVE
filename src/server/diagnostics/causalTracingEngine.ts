import { CausalTraceSpan, ErrorEnvelope } from '../../shared/types';

class CausalTracingEngine {
  private spans: CausalTraceSpan[] = [];
  private maxSpans = 2000;

  public recordSpan(spanData: Omit<CausalTraceSpan, 'spanId' | 'timestamp'>): CausalTraceSpan {
    const span: CausalTraceSpan = {
      spanId: `span_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...spanData,
    };

    this.spans.unshift(span);
    if (this.spans.length > this.maxSpans) {
      this.spans.pop();
    }

    return span;
  }

  public getSpansByTraceId(traceId: string): CausalTraceSpan[] {
    return this.spans
      .filter((s) => s.traceId === traceId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public getSpans(filters?: {
    component?: string;
    actor?: string;
    status?: string;
    limit?: number;
  }): CausalTraceSpan[] {
    let result = [...this.spans];
    if (filters?.component) {
      result = result.filter((s) => s.component === filters.component);
    }
    if (filters?.actor) {
      result = result.filter((s) => s.actor === filters.actor);
    }
    if (filters?.status) {
      result = result.filter((s) => s.status === filters.status);
    }

    return result.slice(0, filters?.limit || 100);
  }

  public reconstructCausalChain(traceId: string): CausalTraceSpan[] {
    const traceSpans = this.getSpansByTraceId(traceId);
    if (traceSpans.length === 0) return [];

    // Order by parent-child causal relationships
    const spanMap = new Map<string, CausalTraceSpan>();
    traceSpans.forEach((s) => spanMap.set(s.spanId, s));

    return traceSpans;
  }

  public getTraceSummary(traceId: string) {
    const chain = this.getSpansByTraceId(traceId);
    const failedSpans = chain.filter((s) => s.status === 'FAILED');
    const componentsUsed = Array.from(new Set(chain.map((s) => s.component)));
    const totalDuration = chain.reduce((acc, s) => acc + s.durationMs, 0);

    return {
      traceId,
      spanCount: chain.length,
      failedSpanCount: failedSpans.length,
      componentsUsed,
      totalDurationMs: totalDuration,
      earliestTimestamp: chain[0]?.timestamp,
      latestTimestamp: chain[chain.length - 1]?.timestamp,
    };
  }
}

export const causalTracingEngine = new CausalTracingEngine();
