import { Mission, SimulationResult } from '../../shared/types';
import { messageBus } from '../bus/messageBus';
import { riskEngine } from '../governance/riskEngine';

export class SimulationEngine {
  /**
   * Run a dry-run mission simulation prior to live execution
   */
  public simulateMission(mission: Mission): SimulationResult {
    const taskCount = mission.tasks.length;
    let maxTaskRiskScore = 0;
    let totalEstimatedTokens = taskCount * 3500;
    let totalEstimatedDurationMs = taskCount * 4500;
    const potentialSideEffects: string[] = [];

    // Analyze tasks
    mission.tasks.forEach((t) => {
      const risk = riskEngine.evaluateRisk({
        actionType: t.title,
        targetResource: t.description,
      });

      if (risk.score > maxTaskRiskScore) {
        maxTaskRiskScore = risk.score;
      }

      if (t.title.toLowerCase().includes('delete') || t.title.toLowerCase().includes('refactor')) {
        potentialSideEffects.push(`Code base modification in task '${t.title}' may introduce breaking changes.`);
      }
      if (t.title.toLowerCase().includes('crypto') || t.title.toLowerCase().includes('security')) {
        potentialSideEffects.push(`Security migration in task '${t.title}' requires regression testing.`);
      }
    });

    if (potentialSideEffects.length === 0) {
      potentialSideEffects.push('No critical destructive side-effects detected in dry-run pass.');
    }

    // Determine predicted metrics based on task complexity and risk
    const predictedSuccessProbability = Number(Math.max(0.70, 0.99 - (maxTaskRiskScore / 400)).toFixed(2));
    const confidenceScore = Number((0.92 + (taskCount * 0.01)).toFixed(2));

    const title = mission.title || mission.objective;
    const description = mission.description || mission.objective;

    const overallRisk = riskEngine.evaluateRisk({
      actionType: title,
      targetResource: description,
    });

    const rollbackDifficulty = overallRisk.score > 70 ? 'HARD' : overallRisk.score > 40 ? 'MEDIUM' : 'EASY';
    const securityImpact = overallRisk.score > 60 ? 'HIGH' : overallRisk.score > 30 ? 'MEDIUM' : 'LOW';

    const result: SimulationResult = {
      id: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      missionId: mission.id,
      missionTitle: title,
      predictedSuccessProbability,
      riskLevel: overallRisk.riskLevel,
      estimatedCostTokens: totalEstimatedTokens,
      estimatedDurationMs: totalEstimatedDurationMs,
      potentialSideEffects,
      rollbackDifficulty,
      securityImpact,
      confidenceScore: Math.min(0.99, confidenceScore),
      verificationRequired: overallRisk.riskLevel !== 'LOW',
      humanApprovalRequired: overallRisk.riskLevel === 'CRITICAL',
      simulatedAt: new Date().toISOString(),
    };

    messageBus.publish('SIMULATION_COMPLETED', 'SimulationEngine', {
      simulation: result,
    }, {
      missionId: mission.id,
      severity: result.riskLevel === 'CRITICAL' || result.riskLevel === 'HIGH' ? 'warning' : 'info',
    });

    return result;
  }
}

export const simulationEngine = new SimulationEngine();
