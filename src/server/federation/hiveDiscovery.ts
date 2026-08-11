import { FederatedHiveIdentity, FederatedHiveRecord } from '../../shared/types';
import { hiveRegistry } from './hiveRegistry';

export class HiveDiscovery {
  public findHivesByCapability(capability: string): FederatedHiveRecord[] {
    return hiveRegistry.getAllHives().filter(h =>
      h.state !== 'UNREACHABLE' &&
      h.state !== 'QUARANTINED' &&
      h.capabilities.some(c => c.toLowerCase().includes(capability.toLowerCase()))
    );
  }

  public findHivesBySpecialization(spec: string): FederatedHiveRecord[] {
    return hiveRegistry.getAllHives().filter(h =>
      h.state !== 'UNREACHABLE' &&
      h.state !== 'QUARANTINED' &&
      h.capabilities.some(s => s.toLowerCase().includes(spec.toLowerCase()))
    );
  }

  public getOptimalHiveForTask(requiredCap: string): FederatedHiveRecord | undefined {
    const candidateHives = this.findHivesByCapability(requiredCap);
    if (candidateHives.length === 0) return undefined;

    // Rank candidate hives by reputation
    candidateHives.sort((a, b) => b.reputationScore - a.reputationScore);
    return candidateHives[0];
  }
}

export const hiveDiscovery = new HiveDiscovery();
