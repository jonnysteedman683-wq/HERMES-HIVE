import { DiagnosticsMetrics } from '../../shared/types';
import { agentRegistry } from '../registry/agentRegistry';
import { missionEngine } from '../missions/missionEngine';
import { geminiProvider, llmProvider } from '../llm/llmProvider';
import { memoryService } from '../memory/memoryService';
import { messageBus } from '../bus/messageBus';
import { healingSupervisor } from '../healing/healingSupervisor';

class DiagnosticsService {
  private startTime = Date.now();

  public getMetrics(): DiagnosticsMetrics {
    const agents = agentRegistry.getAllAgents();
    const missions = missionEngine.getAllMissions();
    const events = messageBus.getEvents({ limit: 100 });

    const totalAgents = agents.length;
    const activeAgents = agents.filter((a) => a.status === 'working');
    const idleAgents = agents.filter((a) => a.status === 'idle');
    const failedAgents = agents.filter((a) => a.status === 'failed' || a.health === 'unresponsive');
    const healthyAgents = agents.filter((a) => a.health === 'healthy');

    const agentHealthPct = totalAgents > 0 ? Math.round((healthyAgents.length / totalAgents) * 100) : 100;

    const completedMissions = missions.filter((m) => m.status === 'completed').length;
    const failedMissions = missions.filter((m) => m.status === 'failed').length;
    const totalFinishedMissions = completedMissions + failedMissions;
    const missionSuccessRatePct = totalFinishedMissions > 0 ? Math.round((completedMissions / totalFinishedMissions) * 100) : 100;

    let totalTasks = 0;
    let failedTasks = 0;
    missions.forEach((m) => {
      totalTasks += m.tasks.length;
      failedTasks += m.tasks.filter((t) => t.status === 'failed').length;
    });
    const taskFailureRatePct = totalTasks > 0 ? Math.round((failedTasks / totalTasks) * 100) : 0;

    const hiveHealthPct = Math.round((agentHealthPct * 0.5) + (missionSuccessRatePct * 0.5));
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    const avgAiLatencyMs = llmProvider.totalRequests > 0
      ? Math.round(llmProvider.totalLatencyMs / llmProvider.totalRequests)
      : 320;

    return {
      hiveHealthPct,
      agentHealthPct,
      missionSuccessRatePct,
      taskFailureRatePct,
      avgTaskDurationSec: 4.2,
      activeAgentsCount: activeAgents.length,
      idleAgentsCount: idleAgents.length,
      failedAgentsCount: failedAgents.length,
      messageThroughputPerMin: Math.min(180, events.length * 3),
      memoryRecordsCount: memoryService.count(),
      totalAiRequests: llmProvider.totalRequests,
      totalTokensUsed: llmProvider.totalTokensUsed,
      avgAiLatencyMs,
      recoveryCount: healingSupervisor.totalRecoveries,
      uptimeSeconds,
      providerName: (llmProvider as any).providerName || 'gemini',
    };
  }
}

export const diagnosticsService = new DiagnosticsService();
