import { Mission, MissionEvaluation } from '../../shared/types';
import { messageBus } from '../bus/messageBus';

export class SelfEvaluationEngine {
  private evaluations: Map<string, MissionEvaluation> = new Map();

  /**
   * Post-mission self-evaluation pass
   */
  public evaluateMission(mission: Mission): MissionEvaluation {
    const totalTasks = mission.tasks.length;
    const completedTasks = mission.tasks.filter((t) => t.status === 'completed').length;
    const failedTasks = mission.tasks.filter((t) => t.status === 'failed').length;

    const isSuccess = mission.status === 'completed' && completedTasks === totalTasks;
    const inefficiencies: string[] = [];
    const lessons: string[] = [];
    const recommendations: string[] = [];

    if (failedTasks > 0) {
      inefficiencies.push(`${failedTasks} task failures required supervisor intervention or retries.`);
      lessons.push('Agent capability matching should prioritize high-verification score specialists.');
      recommendations.push('Spawn dynamic specialist agents earlier in the mission planning stage.');
    } else {
      lessons.push('Sequential staged verification reduced overall bug leakage to zero.');
      recommendations.push('Retain current agent assignment strategy for similar security objectives.');
    }

    const score = Math.round((completedTasks / totalTasks) * 100 - failedTasks * 10);
    const normalizedScore = Math.max(0, Math.min(100, score));

    const evaluation: MissionEvaluation = {
      id: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      missionId: mission.id,
      score: normalizedScore,
      success: isSuccess,
      failuresCount: failedTasks,
      inefficienciesDetected: inefficiencies,
      lessonsLearned: lessons,
      recommendations,
      confidence: 0.96,
      evaluatedAt: new Date().toISOString(),
    };

    this.evaluations.set(mission.id, evaluation);

    messageBus.publish('EVALUATION_COMPLETED', 'SelfEvaluationEngine', {
      evaluation,
    }, {
      missionId: mission.id,
      severity: isSuccess ? 'success' : 'warning',
    });

    return evaluation;
  }

  public getEvaluation(missionId: string): MissionEvaluation | undefined {
    return this.evaluations.get(missionId);
  }

  public getAllEvaluations(): MissionEvaluation[] {
    return Array.from(this.evaluations.values());
  }
}

export const selfEvaluationEngine = new SelfEvaluationEngine();
