import { SystemStateSnapshot } from '../../shared/types';
import { agentRegistry } from '../registry/agentRegistry';
import { missionEngine } from '../missions/missionEngine';
import { worldModel } from '../world/worldModel';
import { memoryService } from '../memory/memoryService';
import { capabilityRegistry } from '../web/capabilityRegistry';

class StateSnapshotEngine {
  private snapshots: SystemStateSnapshot[] = [];
  private maxSnapshots = 100;

  public takeSnapshot(triggerReason = 'Scheduled Checkpoint'): SystemStateSnapshot {
    const agents = agentRegistry.getAllAgents();
    const missions = missionEngine.getAllMissions();
    const entities = worldModel.queryEntities();
    const capabilities = capabilityRegistry.getAllCapabilities();

    const healthyCount = agents.filter((a) => a.health === 'healthy').length;
    const degradedCount = agents.filter((a) => a.health === 'degraded').length;
    const failedCount = agents.filter((a) => a.status === 'failed' || a.health === 'unresponsive').length;

    const capHealthMap: Record<string, any> = {};
    capabilities.forEach((c) => {
      capHealthMap[c.id] = c.health;
    });

    const snapshot: SystemStateSnapshot = {
      snapshotId: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      triggerReason,
      activeAgentsCount: agents.filter((a) => a.status === 'working').length,
      activeMissionsCount: missions.filter((m) => m.status === 'in_progress' || m.status === 'planning').length,
      activeHivesCount: 3,
      worldEntitiesCount: entities.length,
      capabilityHealthMap: capHealthMap,
      memoryStats: {
        totalRecords: memoryService.count(),
        activeCacheKeys: 42,
      },
      agentHealthSummary: {
        healthy: healthyCount,
        degraded: degradedCount,
        failed: failedCount,
      },
      federationStatus: 'FEDERATED_STABLE',
      rawStateData: {
        agentIds: agents.map((a) => a.id),
        missionIds: missions.map((m) => m.id),
      },
    };

    this.snapshots.unshift(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.pop();
    }

    return snapshot;
  }

  public getSnapshots(limit = 20): SystemStateSnapshot[] {
    return this.snapshots.slice(0, limit);
  }

  public getSnapshotById(snapshotId: string): SystemStateSnapshot | undefined {
    return this.snapshots.find((s) => s.snapshotId === snapshotId);
  }

  public diffSnapshots(snapshotId1: string, snapshotId2: string) {
    const s1 = this.getSnapshotById(snapshotId1);
    const s2 = this.getSnapshotById(snapshotId2);

    if (!s1 || !s2) {
      return { error: 'One or both snapshots not found' };
    }

    return {
      timeDeltaSec: Math.abs(
        (new Date(s2.timestamp).getTime() - new Date(s1.timestamp).getTime()) / 1000
      ),
      agentDelta: s2.activeAgentsCount - s1.activeAgentsCount,
      missionDelta: s2.activeMissionsCount - s1.activeMissionsCount,
      worldEntitiesDelta: s2.worldEntitiesCount - s1.worldEntitiesCount,
      memoryRecordsDelta: s2.memoryStats.totalRecords - s1.memoryStats.totalRecords,
      agentHealthDelta: {
        healthyDelta: s2.agentHealthSummary.healthy - s1.agentHealthSummary.healthy,
        failedDelta: s2.agentHealthSummary.failed - s1.agentHealthSummary.failed,
      },
    };
  }
}

export const stateSnapshotEngine = new StateSnapshotEngine();
