import { hiveRepository, federationEventRepository } from './federationRepositories';

export interface HiveMarketAllocation {
  hiveId: string;
  tokensAllocated: number;
  tokensUsed: number;
  marketSharePct: number;
  starvationProtected: boolean;
  lastUpdated: string;
}

export class FederatedEconomicsEngine {
  private allocations = new Map<string, HiveMarketAllocation>();

  constructor() {
    this.seedMarketAllocations();
  }

  private seedMarketAllocations() {
    const hives = hiveRepository.getAllHives();
    const totalCap = 1000000;
    const share = Math.floor(totalCap / Math.max(1, hives.length));

    for (const h of hives) {
      this.allocations.set(h.identity.hiveId, {
        hiveId: h.identity.hiveId,
        tokensAllocated: share,
        tokensUsed: Math.floor(share * 0.2),
        marketSharePct: Math.round((share / totalCap) * 100),
        starvationProtected: true,
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  /**
   * Recalculates market allocations with anti-starvation token floor
   */
  public calculateMarketClearing(): HiveMarketAllocation[] {
    const hives = hiveRepository.getAllHives();
    const totalPool = 2000000; // Total Federation Token Pool
    const minFloorPerHive = 100000; // Anti-starvation minimum floor

    const activeHives = hives.filter((h) => h.state === 'ACTIVE' || h.state === 'DEGRADED');
    const reservedTokens = activeHives.length * minFloorPerHive;
    const remainingPool = Math.max(0, totalPool - reservedTokens);

    let totalWeight = 0;
    for (const h of activeHives) {
      totalWeight += h.reputationScore + h.trustScore;
    }

    const updated: HiveMarketAllocation[] = [];

    for (const h of activeHives) {
      const weight = h.reputationScore + h.trustScore;
      const weightRatio = totalWeight > 0 ? weight / totalWeight : 1 / activeHives.length;
      const bonusTokens = Math.floor(remainingPool * weightRatio);
      const totalTokens = minFloorPerHive + bonusTokens;

      const current = this.allocations.get(h.identity.hiveId) || {
        hiveId: h.identity.hiveId,
        tokensAllocated: totalTokens,
        tokensUsed: 0,
        marketSharePct: 0,
        starvationProtected: true,
        lastUpdated: new Date().toISOString(),
      };

      current.tokensAllocated = totalTokens;
      current.marketSharePct = Math.round((totalTokens / totalPool) * 100);
      current.starvationProtected = true;
      current.lastUpdated = new Date().toISOString();

      this.allocations.set(h.identity.hiveId, current);
      updated.push(current);
    }

    federationEventRepository.logEvent({
      eventId: `evt-market-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: 'hive-hermes-prime',
      eventType: 'FEDERATED_MARKET_CLEARED',
      details: { activeHivesCount: activeHives.length, totalPool },
      governanceResult: 'ALLOWED',
      traceId: `trace-mkt-${Date.now()}`,
    });

    return updated;
  }

  public transferTokens(fromHiveId: string, toHiveId: string, amount: number, reason: string): boolean {
    const fromAlloc = this.allocations.get(fromHiveId);
    const toAlloc = this.allocations.get(toHiveId);
    
    if (!fromAlloc || !toAlloc) return false;
    if (fromAlloc.tokensAllocated - fromAlloc.tokensUsed < amount) return false;
    
    fromAlloc.tokensUsed += amount;
    toAlloc.tokensAllocated += amount; // Assuming receiving tokens increases allocated limit
    
    federationEventRepository.logEvent({
      eventId: `evt-transfer-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceHiveId: fromHiveId,
      destinationHiveId: toHiveId,
      eventType: 'FEDERATED_MARKET_CLEARED', // Using existing type
      details: { amount, reason },
      governanceResult: 'ALLOWED',
      traceId: `trace-transfer-${Date.now()}`
    });
    
    return true;
  }

  public getAllocations(): HiveMarketAllocation[] {
    return Array.from(this.allocations.values());
  }

  public getAllocation(hiveId: string): HiveMarketAllocation | undefined {
    return this.allocations.get(hiveId);
  }
}

export const federatedEconomicsEngine = new FederatedEconomicsEngine();
