import { MarketAsk, FederatedTaskBid, SLAContract } from '../../shared/types';
import { federatedTaskEngine } from './federatedTaskEngine';
import { slaEnforcementEngine } from './federationSLAEngine';
import { federationEventRepository } from './federationRepositories';

export class FederationBiddingMarket {
  private asks: Map<string, MarketAsk> = new Map();

  public publishAsk(
    hiveId: string,
    capabilityId: string,
    minPriceTokens: number,
    maxLatencyMs: number,
    reliabilityPct: number
  ): MarketAsk {
    const ask: MarketAsk = {
      askId: `ask-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      hiveId,
      capabilityId,
      minPriceTokens,
      maxLatencyMs,
      reliabilityPct,
      timestamp: new Date().toISOString(),
    };
    this.asks.set(ask.askId, ask);

    federationEventRepository.logEvent({
      eventId: `evt-ask-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: hiveId,
      eventType: 'FEDERATED_TASK_PUBLISHED',
      details: { askId: ask.askId, capabilityId },
      governanceResult: 'ALLOWED',
      traceId: `trace-ask-${ask.askId}`,
    });

    return ask;
  }

  public findMatchingAsks(capabilityId: string, budget: number, maxLatencyMs: number): MarketAsk[] {
    return Array.from(this.asks.values()).filter(
      (ask) =>
        ask.capabilityId === capabilityId &&
        ask.minPriceTokens <= budget &&
        ask.maxLatencyMs <= maxLatencyMs
    );
  }

  public acceptBidWithSLA(
    taskId: string,
    winningBid: FederatedTaskBid,
    agreedLatencyMs: number,
    penaltyTokens: number
  ): SLAContract {
    // 1. Assign task
    federatedTaskEngine.assignTask(taskId, winningBid);

    const task = federatedTaskEngine.getTask(taskId);
    if (!task) throw new Error('Task not found');

    // 2. Create SLA contract
    const sla = slaEnforcementEngine.createSLA(
      taskId,
      winningBid.biddingHiveId,
      task.originatorHiveId,
      agreedLatencyMs,
      99.9, // Default agreed reliability
      penaltyTokens
    );

    return sla;
  }
}

export const federationBiddingMarket = new FederationBiddingMarket();
