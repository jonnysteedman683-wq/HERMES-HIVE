import { MissionReplayRecord, Mission, CausalTraceSpan } from '../../shared/types';
import { missionEngine } from '../missions/missionEngine';
import { causalTracingEngine } from './causalTracingEngine';

class MissionReplayEngine {
  public reconstructMissionReplay(missionId: string): MissionReplayRecord | null {
    const mission = missionEngine.getMission(missionId);
    if (!mission) return null;

    const causalChain = causalTracingEngine.getSpans({ limit: 100 })
      .filter((span) => span.inputs?.missionId === missionId || span.outputs?.missionId === missionId);

    const m = mission as any;

    const chronologicalEvents = (m.decisions || []).map((d: any) => ({
      timestamp: d.timestamp,
      stage: 'DECISION',
      actor: d.decisionBy || 'Mission Lead',
      description: d.description,
      payload: d,
    }));

    (mission.tasks || []).forEach((t) => {
      chronologicalEvents.push({
        timestamp: (t as any).assignedAt || mission.createdAt,
        stage: t.assignedAgentId || 'Orchestrator',
        actor: t.assignedAgentId || 'Orchestrator',
        description: `Task: ${t.description} (${t.status})`,
        payload: t,
      });
    });

    chronologicalEvents.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const failures = (mission.tasks || [])
      .filter((t) => t.status === 'failed')
      .map((t) => ({
        code: 'TASK_FAILURE',
        message: `Task ${t.id} failed during execution`,
        category: 'EXECUTION_ERROR' as const,
        retryable: true,
        severity: 'MEDIUM' as const,
        timestamp: new Date().toISOString(),
      }));

    const capabilitiesInvoked = Array.from(
      new Set(causalChain.map((span) => span.capabilityRef).filter((c): c is string => Boolean(c)))
    );

    return {
      missionId: mission.id,
      objective: mission.objective,
      startTime: mission.createdAt,
      endTime: mission.updatedAt,
      status: mission.status,
      chronologicalEvents,
      causalChain,
      decisionsMade: (m.decisions || []).map((d: any) => d.description),
      capabilitiesInvoked,
      failuresEncountered: failures,
      finalOutcomeSummary: `Mission state is currently ${mission.status} with progress at ${mission.progress}%.`,
    };
  }
}

export const missionReplayEngine = new MissionReplayEngine();
