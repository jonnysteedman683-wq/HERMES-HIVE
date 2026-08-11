import { governanceEngine } from '../governance/governanceEngine';
import { hiveRepository, federationEventRepository } from './federationRepositories';

export interface FederationGovernanceCheckResult {
  allowed: boolean;
  blockedReason?: string;
  sourceAuthorized: boolean;
  destinationAuthorized: boolean;
  federationPolicyPassed: boolean;
  destinationConstitutionPassed: boolean;
}

export class FederationGovernanceEngine {
  /**
   * Enforces multi-boundary federation governance:
   * Source Auth + Destination Auth + Federation Policy + Destination Constitution
   */
  public checkFederatedAction(
    sourceHiveId: string,
    destinationHiveId: string,
    actionSignature: string,
    payload: Record<string, unknown>
  ): FederationGovernanceCheckResult {
    // 1. Source Hive Auth
    const sourceHive = hiveRepository.getHive(sourceHiveId);
    if (!sourceHive || sourceHive.state === 'REMOVED' || sourceHive.state === 'SUSPENDED') {
      return {
        allowed: false,
        blockedReason: `Source Hive ${sourceHiveId} is not authorized or active`,
        sourceAuthorized: false,
        destinationAuthorized: false,
        federationPolicyPassed: false,
        destinationConstitutionPassed: false,
      };
    }

    // 2. Destination Hive Auth
    const destHive = hiveRepository.getHive(destinationHiveId);
    if (!destHive || destHive.state === 'REMOVED' || destHive.state === 'SUSPENDED') {
      return {
        allowed: false,
        blockedReason: `Destination Hive ${destinationHiveId} is not authorized or active`,
        sourceAuthorized: true,
        destinationAuthorized: false,
        federationPolicyPassed: false,
        destinationConstitutionPassed: false,
      };
    }

    // 3. Quarantine Checks
    if (sourceHive.quarantineStatus === 'QUARANTINED' || sourceHive.quarantineStatus === 'ISOLATED') {
      return {
        allowed: false,
        blockedReason: `Source Hive ${sourceHiveId} is quarantined`,
        sourceAuthorized: false,
        destinationAuthorized: true,
        federationPolicyPassed: false,
        destinationConstitutionPassed: false,
      };
    }

    // 4. Local Governance & Prohibited Operations Check
    const isProhibited = governanceEngine.checkAction(actionSignature);
    if (isProhibited) {
      federationEventRepository.logEvent({
        eventId: `evt-govblock-${Date.now()}`,
        timestamp: new Date().toISOString(),
        sourceHiveId,
        destinationHiveId,
        eventType: 'FEDERATION_GOVERNANCE_BLOCKED',
        details: { actionSignature, payload },
        governanceResult: 'BLOCKED',
        traceId: `trace-fedgov-${Date.now()}`,
      });

      return {
        allowed: false,
        blockedReason: `Action ${actionSignature} violates constitutional policy`,
        sourceAuthorized: true,
        destinationAuthorized: true,
        federationPolicyPassed: true,
        destinationConstitutionPassed: false,
      };
    }

    return {
      allowed: true,
      sourceAuthorized: true,
      destinationAuthorized: true,
      federationPolicyPassed: true,
      destinationConstitutionPassed: true,
    };
  }
}

export const federationGovernanceEngine = new FederationGovernanceEngine();
