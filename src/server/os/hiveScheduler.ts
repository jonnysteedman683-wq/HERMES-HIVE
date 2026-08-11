import { HiveOSStatus, OperatingMode } from '../../shared/types';
import { hiveRegistry } from '../federation/hiveRegistry';
import { missionContractManager } from '../federation/missionContract';
import { autonomousLoop } from '../hermes/autonomousLoop';

export class HiveScheduler {
  private schedulerState: 'IDLE' | 'SCHEDULING' | 'EXECUTING' = 'IDLE';

  public getOSStatus(): HiveOSStatus {
    const hives = hiveRegistry.getAllHives();
    const contracts = missionContractManager.getAllContracts();
    const activeContracts = contracts.filter(c => c.status === 'ACTIVE' || c.status === 'NEGOTIATING');

    const totalTokens = hives.reduce((acc, h) => acc + ((h as any).resourceCapacity?.maxTokensPerMin || 500000), 0);

    return {
      operatingMode: autonomousLoop.getOperatingMode(),
      schedulerState: this.schedulerState,
      activeHivesCount: hives.length,
      activeContractsCount: activeContracts.length,
      totalResourceTokensAvailable: totalTokens,
      systemHealth: 99.4,
    };
  }

  public setOperatingMode(mode: OperatingMode): void {
    autonomousLoop.setOperatingMode(mode);
  }
}

export const hiveScheduler = new HiveScheduler();
