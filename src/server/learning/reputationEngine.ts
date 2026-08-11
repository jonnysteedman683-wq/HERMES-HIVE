import { ProviderReputation, CapabilityReputation } from '../../shared/stage9Types';
import { messageBus } from '../bus/messageBus';

export class ReputationEngine {
  private providerReputations: Map<string, ProviderReputation> = new Map();
  private capabilityReputations: Map<string, CapabilityReputation> = new Map();

  constructor() {
    this.seedDefaultReputations();
  }

  private seedDefaultReputations() {
    // Seed Provider Alpha: Decent but highly variable under high load
    this.providerReputations.set('Provider Alpha', {
      provider: 'Provider Alpha',
      reliability: 0.81,
      latency: 2850,
      costAccuracy: 0.88,
      quality: 0.79,
      availability: 0.94,
      failureRate: 0.12,
      securityHistory: ['Minor SSL certificate warnings resolved in April'],
      verificationSuccessPct: 88,
      predictionAccuracyPct: 74,
      environmentalSensitivity: ['Highly sensitive to concurrent scheduling threads > 10'],
      confidence: 0.84,
      lastEvaluatedAt: new Date().toISOString()
    });

    // Seed Provider Beta: Stable, mid-tier
    this.providerReputations.set('Provider Beta', {
      provider: 'Provider Beta',
      reliability: 0.91,
      latency: 1450,
      costAccuracy: 0.94,
      quality: 0.88,
      availability: 0.98,
      failureRate: 0.05,
      securityHistory: [],
      verificationSuccessPct: 96,
      predictionAccuracyPct: 89,
      environmentalSensitivity: ['Slight latency spikes under heavy region-B load'],
      confidence: 0.91,
      lastEvaluatedAt: new Date().toISOString()
    });

    // Seed Provider Gamma: Premium, high performance
    this.providerReputations.set('Provider Gamma', {
      provider: 'Provider Gamma',
      reliability: 0.99,
      latency: 680,
      costAccuracy: 0.99,
      quality: 0.98,
      availability: 0.999,
      failureRate: 0.01,
      securityHistory: [],
      verificationSuccessPct: 100,
      predictionAccuracyPct: 98,
      environmentalSensitivity: ['Extremely stable under peak concurrency'],
      confidence: 0.97,
      lastEvaluatedAt: new Date().toISOString()
    });

    // Seed Capability Reputations (Provider specific)
    this.setCapabilityReputation('web_search', 'Provider Alpha', 0.84, 2100, 0.90, 0.82, 0.95);
    this.setCapabilityReputation('web_search', 'Provider Beta', 0.92, 1300, 0.94, 0.89, 0.98);
    this.setCapabilityReputation('http_api', 'Provider Alpha', 0.78, 3200, 0.85, 0.75, 0.92);
    this.setCapabilityReputation('http_api', 'Provider Beta', 0.90, 1600, 0.93, 0.87, 0.97);
    this.setCapabilityReputation('saas_integration', 'Provider Gamma', 0.99, 650, 0.99, 0.98, 0.99);
  }

  public getProviderReputation(provider: string): ProviderReputation | undefined {
    return this.providerReputations.get(provider);
  }

  public getAllProviderReputations(): ProviderReputation[] {
    return Array.from(this.providerReputations.values());
  }

  public getCapabilityReputations(): CapabilityReputation[] {
    return Array.from(this.capabilityReputations.values());
  }

  public setCapabilityReputation(
    capabilityId: string,
    provider: string,
    reliability: number,
    latency: number,
    costAccuracy: number,
    quality: number,
    availability: number
  ): CapabilityReputation {
    const key = `${capabilityId}::${provider}`;
    const rep: CapabilityReputation = {
      capabilityId,
      provider,
      reliability,
      latency,
      costAccuracy,
      quality,
      availability,
      lastEvaluatedAt: new Date().toISOString()
    };
    this.capabilityReputations.set(key, rep);
    return rep;
  }

  public updateReputationFromOutcome(provider: string, details: {
    reliability: number;
    latency: number;
    success: boolean;
    costMatches: boolean;
    isSecurityIncident?: boolean;
  }) {
    const rep = this.providerReputations.get(provider);
    if (!rep) return;

    // Apply learning factor (reputation updates gently, with 0.1 learning weight)
    const lr = 0.15;
    
    // Smooth averages
    rep.reliability = rep.reliability * (1 - lr) + details.reliability * lr;
    rep.latency = rep.latency * (1 - lr) + details.latency * lr;
    rep.costAccuracy = rep.costAccuracy * (1 - lr) + (details.costMatches ? 1 : 0) * lr;
    rep.failureRate = rep.failureRate * (1 - lr) + (details.success ? 0 : 1) * lr;
    
    if (details.isSecurityIncident) {
      rep.securityHistory.push(`Critical incident reported at ${new Date().toISOString()}`);
      // Security drops reputation sharply and remains heavily weighted
      rep.reliability = Math.max(0, rep.reliability - 0.40);
      rep.confidence = Math.max(0, rep.confidence - 0.30);
    } else {
      // Small boost to confidence upon feedback integration
      rep.confidence = Math.min(1.0, rep.confidence + 0.01);
    }

    rep.lastEvaluatedAt = new Date().toISOString();
    this.providerReputations.set(provider, rep);

    messageBus.publish('LEDGER_ENTRY', 'ReputationEngine', {
      eventType: 'ProviderReputationUpdated',
      payload: { provider, reputation: rep }
    }, { severity: details.isSecurityIncident ? 'error' : 'info' });
  }

  /**
   * Applies temporal decay. Old reputation reverts slightly to neutral expectations (0.85)
   * unless security incidents exist.
   */
  public applyDecay(decayRate: number = 0.05) {
    for (const [provider, rep] of this.providerReputations.entries()) {
      // Security incidents block normal fully positive decay recovery, or stay heavily weighted
      const hasSecurityPenalty = rep.securityHistory.length > 0;
      const targetReliability = hasSecurityPenalty ? 0.60 : 0.85;

      // Move slightly towards neutral expectations
      rep.reliability = rep.reliability * (1 - decayRate) + targetReliability * decayRate;
      rep.lastEvaluatedAt = new Date().toISOString();
      this.providerReputations.set(provider, rep);
    }

    messageBus.publish('LEDGER_ENTRY', 'ReputationEngine', {
      eventType: 'ReputationDecayApplied',
      payload: { timestamp: new Date().toISOString() }
    }, { severity: 'info' });
  }
}

export const reputationEngine = new ReputationEngine();
