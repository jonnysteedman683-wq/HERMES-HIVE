import { CapabilityDescriptor } from '../../shared/types';
import { capabilityRegistry } from '../web/capabilityRegistry';
import { capabilityReputationEngine } from './capabilityReputation';
import { messageBus } from '../bus/messageBus';

export class CapabilityDiscoveryEngine {
  /**
   * Discover available capabilities filtered by various constraints.
   */
  public discoverCapabilities(filter?: {
    category?: string;
    maxRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    availability?: 'online' | 'degraded' | 'offline';
  }): CapabilityDescriptor[] {
    const caps = capabilityRegistry.getAllCapabilities(filter);
    
    // Sort based on risk policy
    if (filter?.maxRiskLevel) {
      const riskRanks = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
      const maxRank = riskRanks[filter.maxRiskLevel];
      return caps.filter(c => riskRanks[c.riskLevel] <= maxRank);
    }

    return caps;
  }

  /**
   * Evaluates and selects the single best capability for a specific objective.
   * Weighs reliability, risk, cost, and availability dynamically.
   */
  public selectBestCapability(params: {
    category: string;
    maxRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    maxBudget?: number;
    optimizeFor?: 'reliability' | 'cost' | 'latency';
  }): CapabilityDescriptor | null {
    const candidates = this.discoverCapabilities({
      category: params.category,
      maxRiskLevel: params.maxRiskLevel,
      availability: 'online',
    });

    if (candidates.length === 0) {
      // Fallback to degraded capabilities if no fully online ones exist
      const degradedCandidates = this.discoverCapabilities({
        category: params.category,
        maxRiskLevel: params.maxRiskLevel,
      }).filter(c => c.availability !== 'offline');
      if (degradedCandidates.length > 0) {
        candidates.push(...degradedCandidates);
      } else {
        return null;
      }
    }

    let bestCandidate: CapabilityDescriptor | null = null;
    let bestScore = -Infinity;

    for (const cand of candidates) {
      const rep = capabilityReputationEngine.getReputation(cand.id);

      // Exceeds budget constraint
      if (params.maxBudget !== undefined && rep.costPerUse > params.maxBudget) {
        continue;
      }

      // Calculate a combined score
      let score = 0;

      // Base weights
      score += rep.reliabilityScore * 1.5; // Reliability is paramount
      score -= rep.costPerUse * 2.0;       // Cost penalty
      score -= (rep.avgLatencyMs / 100);   // Latency penalty

      // Custom optimizations
      if (params.optimizeFor === 'reliability') {
        score += rep.reliabilityScore * 3.0;
      } else if (params.optimizeFor === 'cost') {
        score -= rep.costPerUse * 5.0;
      } else if (params.optimizeFor === 'latency') {
        score -= (rep.avgLatencyMs / 50);
      }

      // Risk penalty (we prefer lower risk, all else equal)
      const riskPenalties = { LOW: 0, MEDIUM: 20, HIGH: 50, CRITICAL: 100 };
      score -= riskPenalties[cand.riskLevel];

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = cand;
      }
    }

    if (bestCandidate) {
      messageBus.publish('CAPABILITY_DISCOVERED', 'CapabilityDiscoveryEngine', {
        category: params.category,
        selectedId: bestCandidate.id,
        score: bestScore,
      }, { severity: 'info' });
    }

    return bestCandidate;
  }

  /**
   * Semantic matching for an intent string.
   */
  public queryByIntent(intent: string): CapabilityDescriptor[] {
    const query = intent.toLowerCase();
    const all = capabilityRegistry.getAllCapabilities();

    return all.filter((c) => {
      return (
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query) ||
        c.operations.some(op => op.toLowerCase().includes(query))
      );
    });
  }
}

export const capabilityDiscoveryEngine = new CapabilityDiscoveryEngine();
export const capabilityDiscovery = capabilityDiscoveryEngine;
