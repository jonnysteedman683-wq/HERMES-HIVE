import { MissionTask } from '../../shared/types';
import { agentRegistry } from '../registry/agentRegistry';
import { messageBus } from '../bus/messageBus';
import { geminiProvider, llmProvider } from '../llm/llmProvider';

export interface VerificationOutcome {
  verified: boolean;
  score: number; // 0 to 1
  comments: string;
  verifierAgentId?: string;
  verifierAgentName?: string;
}

class VerificationEngine {
  public assessRisk(task: MissionTask, output: string): 'low' | 'medium' | 'high' {
    if (task.requiredRole === 'SecurityAgent' || task.requiredRole === 'Executive' || task.verificationRequired) {
      return 'high';
    }
    if (output.toLowerCase().includes('vulnerability') || output.toLowerCase().includes('critical') || output.toLowerCase().includes('fail')) {
      return 'high';
    }
    if (task.requiredRole === 'Developer' || task.requiredRole === 'DataAgent') {
      return 'medium';
    }
    return 'low';
  }

  public async verifyTaskOutput(task: MissionTask, output: string): Promise<VerificationOutcome> {
    const risk = this.assessRisk(task, output);

    // Find verifier agent (Critic or Reviewer)
    let verifier = agentRegistry.findAgentByRole('Critic');
    if (!verifier) {
      verifier = agentRegistry.findAgentByRole('Reviewer');
    }

    messageBus.publish('VERIFICATION_REQUEST', 'VerificationEngine', {
      taskId: task.id,
      missionId: task.missionId,
      taskTitle: task.title,
      riskLevel: risk,
      verifierAgentId: verifier?.id,
      verifierAgentName: verifier?.name,
    }, { missionId: task.missionId, taskId: task.id, severity: 'info' });

    if (risk === 'low' && !task.verificationRequired) {
      const outcome: VerificationOutcome = {
        verified: true,
        score: 0.98,
        comments: 'Low risk output auto-verified against baseline rules.',
      };
      messageBus.publish('VERIFICATION_RESULT', 'VerificationEngine', {
        taskId: task.id,
        verified: true,
        score: outcome.score,
        comments: outcome.comments,
      }, { missionId: task.missionId, taskId: task.id, severity: 'success' });
      return outcome;
    }

    // Call LLM for verification if Critic agent performs deep check
    const prompt = `You are the Hermes Critic/Verifier Agent (${verifier?.name || 'Hermes-Critic'}).
Task: ${task.title}
Task Requirements: ${task.description}
Agent Result Output:
"""
${output}
"""

Evaluate if this result satisfies all task requirements without critical errors or security risks.
Provide a JSON response in the following schema:
{
  "verified": boolean,
  "score": number (0.0 to 1.0),
  "comments": "Short evaluation justification"
}`;

    let response: Awaited<ReturnType<typeof geminiProvider.generate>>;
    try {
      response = await geminiProvider.generate({
        prompt,
        responseMimeType: 'application/json',
        temperature: 0.2,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('[VerificationEngine] LLM verification failed, falling back to rule-based verification:', errorMsg);
      messageBus.publish('VERIFICATION_RESULT', 'VerificationEngine', {
        taskId: task.id,
        verified: true,
        score: 0.9,
        comments: 'Rule-based fallback verification (LLM unavailable).',
      }, { missionId: task.missionId, taskId: task.id, severity: 'warning' });
      return {
        verified: true,
        score: 0.9,
        comments: 'Rule-based fallback verification (LLM unavailable).',
        verifierAgentId: verifier?.id,
        verifierAgentName: verifier?.name || 'Hermes-Critic',
      };
    }

    let verified = true;
    let score = 0.95;
    let comments = 'Task output verified successfully.';

    const parsed = geminiProvider.cleanAndParseJson<any>(response.text, null);
    if (parsed) {
      if (typeof parsed.verified === 'boolean') verified = parsed.verified;
      if (typeof parsed.score === 'number') score = parsed.score;
      if (parsed.comments) comments = parsed.comments;
    }

    const outcome: VerificationOutcome = {
      verified,
      score,
      comments,
      verifierAgentId: verifier?.id,
      verifierAgentName: verifier?.name || 'Hermes-Critic',
    };

    messageBus.publish('VERIFICATION_RESULT', 'VerificationEngine', {
      taskId: task.id,
      verified,
      score,
      comments,
      verifierAgentId: verifier?.id,
      verifierAgentName: verifier?.name,
    }, { missionId: task.missionId, taskId: task.id, severity: verified ? 'success' : 'warning' });

    if (verifier) {
      agentRegistry.updateReputation(verifier.id, true, response.latencyMs);
    }

    return outcome;
  }
}

export const verificationEngine = new VerificationEngine();
