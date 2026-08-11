import { HermesDecision, HermesDecisionType } from '../../shared/types';
import { geminiProvider } from '../gemini/geminiProvider';
import { agentRegistry } from '../registry/agentRegistry';
import { missionEngine } from '../missions/missionEngine';
import { messageBus } from '../bus/messageBus';
import { memoryService } from '../memory/memoryService';

class HermesEngine {
  private recentDecisions: HermesDecision[] = [];

  public async processHumanCommand(command: string): Promise<{
    decision: HermesDecision;
    responseMessage: string;
    missionId?: string;
  }> {
    const activeAgents = agentRegistry.getAllAgents();
    const activeMissions = missionEngine.getAllMissions();
    const memoryContext = memoryService.query({ limit: 5 }).map((m) => `${m.key}: ${m.content}`).join('\n');

    const systemPrompt = `You are HERMES, the Executive Intelligence Agent of the HERMES HIVE multi-agent swarm platform.
Your responsibilities:
1. Interpret human operator objectives.
2. Decompose objectives into clear tasks with role specifications (Researcher, Analyst, Planner, Developer, Tester, Debugger, SecurityAgent, DataAgent, Reviewer, Critic, Writer, Explorer, Coordinator).
3. Select or create specialized agents for tasks.
4. Establish dependencies between tasks.
5. Monitor swarm health and make executive decisions.

Available Swarm Agents (${activeAgents.length}):
${activeAgents.map((a) => `- ${a.name} [Role: ${a.role}, Status: ${a.status}, Health: ${a.health}, Cluster: ${a.clusterId}]`).join('\n')}

Active Missions (${activeMissions.length}):
${activeMissions.slice(0, 3).map((m) => `- ${m.id} [Objective: ${m.objective}, Status: ${m.status}, Progress: ${m.progress}%]`).join('\n')}

Recent Memory Context:
${memoryContext || 'None'}

You must respond with a strict valid JSON object in this schema:
{
  "type": "CREATE_MISSION" | "CREATE_AGENT" | "ASSIGN_TASK" | "RETRY_TASK" | "REBALANCE_SWARM" | "ESCALATE",
  "reasoningSummary": "Clear executive reasoning behind this swarm operation.",
  "confidence": 0.95,
  "responseMessage": "Direct human-facing explanation from Hermes to the operator.",
  "actions": [
    {
      "actionType": "CREATE_MISSION",
      "details": {
        "title": "Mission title",
        "priority": 4,
        "tasks": [
          {
            "title": "Task title",
            "description": "Task details",
            "requiredRole": "RoleName",
            "requiredCapabilities": ["capability1"],
            "dependencies": ["Task title of dependency if any"]
          }
        ]
      }
    }
  ]
}`;

    const llmRes = await geminiProvider.generate({
      prompt: `Human Operator Command: "${command}"`,
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      temperature: 0.2,
    });

    let decisionType: HermesDecisionType = 'CREATE_MISSION';
    let reasoningSummary = 'Hermes executive reasoning formulated task graph and swarm assignment.';
    let confidence = 0.95;
    let responseMessage = 'I have received your objective and initiated the swarm mission.';
    let actions: import('../../shared/types').HermesAction[] = [];

    const parsed = geminiProvider.cleanAndParseJson<any>(llmRes.text, null);
    if (parsed) {
      if (parsed.type) decisionType = parsed.type;
      if (parsed.reasoningSummary) reasoningSummary = parsed.reasoningSummary;
      if (typeof parsed.confidence === 'number') confidence = parsed.confidence;
      if (parsed.responseMessage) responseMessage = parsed.responseMessage;
      if (Array.isArray(parsed.actions)) actions = parsed.actions;
    }

    if (!actions || actions.length === 0) {
      actions = [
        {
          actionType: 'CREATE_MISSION',
          details: {
            title: `Mission: ${command.slice(0, 40)}`,
            priority: 4,
            tasks: [
              {
                title: 'Initial Investigation & System Discovery',
                description: `Examine environment and requirements for: ${command}`,
                requiredRole: 'Explorer',
                requiredCapabilities: ['repository_analysis'],
                dependencies: [],
              },
              {
                title: 'Core Implementation & Architectural Execution',
                description: `Execute core requirements for: ${command}`,
                requiredRole: 'Developer',
                requiredCapabilities: ['code_generation'],
                dependencies: ['Initial Investigation & System Discovery'],
              },
              {
                title: 'Independent Verification & Policy Audit',
                description: 'Verify execution against security standards.',
                requiredRole: 'Critic',
                requiredCapabilities: ['verification'],
                dependencies: ['Core Implementation & Architectural Execution'],
              },
            ],
          },
        },
      ];
    }

    const decision: HermesDecision = {
      id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: decisionType,
      reasoningSummary,
      actions,
      confidence,
      timestamp: new Date().toISOString(),
    };

    this.recentDecisions.unshift(decision);
    if (this.recentDecisions.length > 50) this.recentDecisions.pop();

    messageBus.publish('HERMES_DECISION', 'HermesEngine', {
      decisionId: decision.id,
      type: decision.type,
      reasoningSummary: decision.reasoningSummary,
      actionCount: decision.actions.length,
      confidence: decision.confidence,
    }, { severity: 'info' });

    let createdMissionId: string | undefined;

    // Execute Decision Actions
    for (const action of decision.actions) {
      if (action.actionType === 'CREATE_MISSION') {
        const details = action.details as {
          title?: string;
          priority?: number;
          tasks: {
            title: string;
            description: string;
            requiredRole: import('../../shared/types').AgentRole;
            requiredCapabilities?: string[];
            dependencies?: string[];
          }[];
        };

        if (details && Array.isArray(details.tasks) && details.tasks.length > 0) {
          const newMission = missionEngine.createMission({
            objective: command,
            priority: details.priority || 4,
            tasks: details.tasks,
          });
          createdMissionId = newMission.id;
        }
      } else if (action.actionType === 'CREATE_AGENT') {
        const details = action.details as { name: string; role: import('../../shared/types').AgentRole; capabilities: string[] };
        if (details && details.name && details.role) {
          agentRegistry.createAgent({
            name: details.name,
            role: details.role,
            capabilities: details.capabilities || ['general_execution'],
          });
        }
      } else if (action.actionType === 'REBALANCE_SWARM') {
        // Rebalance idle agents across clusters
        const agents = agentRegistry.getAllAgents();
        agents.forEach((a) => {
          if (a.status === 'idle') {
            a.resourceUsage.cpuPct = 5;
          }
        });
      }
    }

    return {
      decision,
      responseMessage,
      missionId: createdMissionId,
    };
  }

  public getRecentDecisions(): HermesDecision[] {
    return this.recentDecisions;
  }
}

export const hermesEngine = new HermesEngine();
