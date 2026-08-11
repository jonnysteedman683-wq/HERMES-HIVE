import { collectiveMemoryEngine } from './collectiveMemoryEngine';

export interface ObjectiveOutcomeAnalysis {
  analysisId: string;
  objective: string;
  expectedOutcome: string;
  actualOutcome: string;
  variancePct: number;
  contributingAgents: string[];
  extractedLessons: {
    fact: string;
    inference: string;
    hypothesis: string;
    promotedKnowledge?: string;
  }[];
  confidenceScore: number;
  evaluatedAt: string;
}

export class CollectiveLearningEngine {
  private analyses: Map<string, ObjectiveOutcomeAnalysis> = new Map();

  constructor() {
    this.seedLearningRecords();
  }

  private seedLearningRecords(): void {
    const l1: ObjectiveOutcomeAnalysis = {
      analysisId: 'learn-001',
      objective: 'Stage 5B Capability Genesis & Sandbox Validation',
      expectedOutcome: '100% test coverage and sandbox experiment isolation.',
      actualOutcome: 'Achieved 100% sandbox isolation with 31% RPC latency reduction.',
      variancePct: +31.0,
      contributingAgents: ['agent-executive-prime', 'agent-perf-analyst', 'agent-sec-auditor'],
      extractedLessons: [
        {
          fact: 'Sandbox execution prevented cross-Hive side effects during experiment exp-001.',
          inference: 'Isolation levels SIMULATION and SANDBOX are sufficient for pre-flight verification.',
          hypothesis: 'Live production promotion can safely occur within 10 seconds post-verification.',
          promotedKnowledge: 'Pre-flight verification protocol promoted to Institutional Knowledge.',
        },
      ],
      confidenceScore: 0.98,
      evaluatedAt: new Date(Date.now() - 3600000).toISOString(),
    };

    this.analyses.set(l1.analysisId, l1);
  }

  public getAllAnalyses(): ObjectiveOutcomeAnalysis[] {
    return Array.from(this.analyses.values());
  }

  public analyzeOutcome(
    objective: string,
    expectedOutcome: string,
    actualOutcome: string,
    variancePct: number,
    contributingAgents: string[],
    fact: string,
    inference: string,
    hypothesis: string,
    promotedKnowledge?: string
  ): ObjectiveOutcomeAnalysis {
    const analysisId = `learn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const analysis: ObjectiveOutcomeAnalysis = {
      analysisId,
      objective,
      expectedOutcome,
      actualOutcome,
      variancePct,
      contributingAgents,
      extractedLessons: [
        {
          fact,
          inference,
          hypothesis,
          promotedKnowledge,
        },
      ],
      confidenceScore: 0.96,
      evaluatedAt: new Date().toISOString(),
    };

    this.analyses.set(analysisId, analysis);

    if (promotedKnowledge) {
      collectiveMemoryEngine.addMemoryRecord(
        'LESSON_LEARNED',
        promotedKnowledge,
        contributingAgents,
        `Post-objective evaluation analysis ${analysisId}`,
        0.96,
        ['COLLECTIVE_LEARNING', 'OUTCOME_ANALYSIS']
      );
    }

    return analysis;
  }
}

export const collectiveLearningEngine = new CollectiveLearningEngine();
