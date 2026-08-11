import { selfModelService } from '../selfmodel/selfModelService';
import { capabilityInventory } from '../selfmodel/capabilityInventory';
import { organisationHealthService } from '../selfmodel/organisationHealth';

export interface DigitalTwinSnapshot {
  snapshotId: string;
  simulatedAt: string;
  selfModel: ReturnType<typeof selfModelService.getSelfModel>;
  capabilitiesCount: number;
  healthMetrics: ReturnType<typeof organisationHealthService.calculateHealth>;
  isolatedState: {
    productionConnected: false;
    readOnlyBoundary: true;
  };
}

export class DigitalTwin {
  public createSnapshot(): DigitalTwinSnapshot {
    const now = new Date().toISOString();
    return {
      snapshotId: `twin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      simulatedAt: now,
      selfModel: selfModelService.getSelfModel(),
      capabilitiesCount: capabilityInventory.getAllCapabilities().length,
      healthMetrics: organisationHealthService.calculateHealth(),
      isolatedState: {
        productionConnected: false,
        readOnlyBoundary: true,
      },
    };
  }
}

export const digitalTwin = new DigitalTwin();
