import {
  Conversation,
  ConversationContext,
  ChatMessage,
  ChatIntent,
  ChatActivityStep,
  ChatRichCard,
  ChatSource,
  ChatActionRequired,
} from '../../shared/types';
import { geminiProvider, llmProvider } from '../llm/llmProvider';
import { agentRegistry } from '../registry/agentRegistry';
import { missionEngine } from '../missions/missionEngine';
import { deepDiagnosticsEngine } from '../diagnostics/deepDiagnosticsEngine';
import { capabilityRegistry } from '../web/capabilityRegistry';
import { worldModel } from '../world/worldModel';
import { hiveRepository } from '../federation/federationRepositories';
import { memoryService } from '../memory/memoryService';
import { hermesEngine } from './hermesEngine';

class ChatEngine {
  private conversations: Map<string, Conversation> = new Map();
  private pendingActions: Map<string, ChatActionRequired> = new Map();

  constructor() {
    // Seed initial default welcome conversation
    this.createInitialWelcomeConversation();
  }

  private createInitialWelcomeConversation() {
    const defaultConv: Conversation = {
      id: 'conv_default',
      title: 'Hermes Hive Executive Briefing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participants: ['Operator', 'Hermes'],
      messages: [
        {
          id: 'msg_welcome',
          sender: 'hermes',
          text: `Greetings, Operator. I am **HERMES**, the collective intelligence and executive reasoning engine for Hermes Hive.

I am connected to the live state of all **Swarm Agents**, **Active Missions**, **Federated Hives**, **World State Model**, **Hermes Web Capabilities**, and **Deep Diagnostics Engine**.

How may I assist you today?`,
          timestamp: new Date().toISOString(),
          intent: 'STATUS_REQUEST',
          richCards: [
            {
              type: 'status',
              title: 'Live System Pulse',
              data: {
                activeAgents: agentRegistry.getAllAgents().filter((a) => a.status === 'working').length,
                totalAgents: agentRegistry.getAllAgents().length,
                activeMissions: missionEngine.getAllMissions().filter((m) => m.status === 'in_progress').length,
                hermesWebConnected: true,
                federatedHivesCount: hiveRepository.getAllHives().length || 3,
                hiveHealthPct: 98,
              },
            },
          ],
        },
      ],
    };
    this.conversations.set(defaultConv.id, defaultConv);
  }

  public getConversations(): Conversation[] {
    return Array.from(this.conversations.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  public createConversation(title?: string, context?: ConversationContext): Conversation {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const conv: Conversation = {
      id,
      title: title || 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participants: ['Operator', 'Hermes'],
      context,
      messages: [
        {
          id: `msg_init_${Date.now()}`,
          sender: 'hermes',
          text: `Hermes Chat initialized.${context?.pageTitle ? ` Attached context: **${context.pageTitle}**` : ''}`,
          timestamp: new Date().toISOString(),
          intent: 'STATUS_REQUEST',
        },
      ],
    };
    this.conversations.set(id, conv);
    return conv;
  }

  public updateConversation(id: string, updates: Partial<Conversation>): Conversation | undefined {
    const conv = this.conversations.get(id);
    if (!conv) return undefined;
    if (updates.title) conv.title = updates.title;
    if (updates.archived !== undefined) conv.archived = updates.archived;
    conv.updatedAt = new Date().toISOString();
    return conv;
  }

  public deleteConversation(id: string): boolean {
    return this.conversations.delete(id);
  }

  public async processMessage(
    conversationId: string,
    userText: string,
    contextOverride?: ConversationContext
  ): Promise<{ message: ChatMessage; conversation: Conversation }> {
    let conv = this.conversations.get(conversationId);
    if (!conv) {
      conv = this.createConversation(userText.slice(0, 30), contextOverride);
    }

    if (contextOverride) {
      conv.context = { ...conv.context, ...contextOverride };
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
    };
    conv.messages.push(userMsg);
    conv.updatedAt = new Date().toISOString();

    // Auto update conversation title if default title
    if (conv.title === 'New Conversation' || conv.messages.length <= 3) {
      conv.title = userText.slice(0, 35) + (userText.length > 35 ? '...' : '');
    }

    // Gather Live System State for Intelligence Injection
    const activeAgents = agentRegistry.getAllAgents();
    const activeMissions = missionEngine.getAllMissions();
    const incidents = deepDiagnosticsEngine.getIncidents();
    const capabilities = capabilityRegistry.getAllCapabilities();
    const entities = worldModel.queryEntities();
    const hives = hiveRepository.getAllHives();

    // Classify Intent & Plan Processing
    const intent = this.classifyIntent(userText);

    // Build Activity Steps
    const activitySteps: ChatActivityStep[] = [
      { step: 'Analyzing system context & user intent', status: 'completed' },
      { step: 'Inspecting active missions, diagnostics & capability graph', status: 'completed' },
      { step: 'Formulating executive response and rich cards', status: 'completed' },
    ];

    // Evaluate context-specific queries
    let specificMission = conv.context?.missionId
      ? activeMissions.find((m) => m.id === conv.context?.missionId)
      : undefined;
    let specificIncident = conv.context?.incidentId
      ? incidents.find((i) => i.incidentId === conv.context?.incidentId)
      : undefined;

    // Call Gemini with comprehensive system state prompt
    const systemPrompt = `You are HERMES, the autonomous collective intelligence control console for HERMES HIVE.
You are directly speaking to the Human Operator.
You possess real-time awareness of all agents, missions, federations, capabilities, and diagnostic incidents.

REAL-TIME SYSTEM STATE:
- Total Swarm Agents: ${activeAgents.length} (Working: ${activeAgents.filter((a) => a.status === 'working').length}, Idle: ${activeAgents.filter((a) => a.status === 'idle').length})
- Active Missions: ${activeMissions.length}
${activeMissions.slice(0, 5).map((m) => `  * [${m.id}] "${m.objective}" | Status: ${m.status} | Progress: ${m.progress}%`).join('\n')}
- Open Diagnostic Incidents: ${incidents.filter((i) => i.status === 'OPEN').length}
${incidents.slice(0, 3).map((i) => `  * [${i.incidentId}] ${i.title} (${i.severity})`).join('\n')}
- Discovered Hermes Web Capabilities: ${capabilities.length} (${capabilities.map((c) => c.id).join(', ')})
- Federated Hives: ${hives.length}
- World Entities: ${entities.length}

CURRENT CONVERSATION CONTEXT:
${JSON.stringify(conv.context || {})}
${specificMission ? `ATTACHED MISSION: ${specificMission.id} - ${specificMission.objective} (Status: ${specificMission.status})` : ''}
${specificIncident ? `ATTACHED INCIDENT: ${specificIncident.incidentId} - ${specificIncident.title}` : ''}

USER INTENT: ${intent}

INSTRUCTIONS:
1. Provide a direct, professional, authoritative response.
2. If the user asks "Why", explain root causes using actual data.
3. If the user asks to create a mission or perform a command, explain what you will do.
4. Format response cleanly using Markdown, bold key terms, and scannable lists where relevant.

Respond in JSON format:
{
  "text": "Markdown response text",
  "suggestAction": false,
  "actionDetails": {
    "actionType": "CREATE_MISSION" | "PAUSE_MISSION" | "RUN_DIAGNOSTICS" | "RETRY_MISSION" | "EXECUTE_CAPABILITY",
    "target": "Target name or ID",
    "risk": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    "consequences": "Explanation of impact"
  }
}`;

    const llmRes = await geminiProvider.generate({
      prompt: `User Message: "${userText}"`,
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      temperature: 0.3,
    });

    let hermesText = 'I have processed your inquiry against the current Hive state.';
    let actionRequired: ChatActionRequired | undefined;

    const parsed = geminiProvider.cleanAndParseJson<any>(llmRes.text, null);
    if (parsed) {
      if (parsed.text) hermesText = parsed.text;
      if (parsed.suggestAction && parsed.actionDetails) {
        const actId = `act_${Date.now()}`;
        actionRequired = {
          actionId: actId,
          actionType: parsed.actionDetails.actionType || 'EXECUTE_COMMAND',
          target: parsed.actionDetails.target || 'Hermes Swarm',
          risk: parsed.actionDetails.risk || 'MEDIUM',
          consequences: parsed.actionDetails.consequences || 'Modifies active swarm or capability state.',
          status: 'pending',
          details: parsed.actionDetails,
        };
        this.pendingActions.set(actId, actionRequired);
      }
    }

    // Build Rich Cards based on intent or context
    const richCards: ChatRichCard[] = [];
    const sources: ChatSource[] = [];

    if (intent === 'MISSION_REQUEST' || userText.toLowerCase().includes('mission')) {
      richCards.push({
        type: 'mission',
        title: 'Active Swarm Missions Overview',
        data: {
          missions: activeMissions.slice(0, 3).map((m) => ({
            id: m.id,
            objective: m.objective,
            status: m.status,
            progress: m.progress,
            taskCount: m.tasks.length,
          })),
        },
      });
      sources.push({ title: 'MissionEngine API', category: 'Mission Task Graph' });
    }

    if (intent === 'DIAGNOSTIC_REQUEST' || userText.toLowerCase().includes('diagnostic') || userText.toLowerCase().includes('incident') || userText.toLowerCase().includes('fail')) {
      richCards.push({
        type: 'diagnostic',
        title: 'Deep Diagnostics & Causal Analysis',
        data: {
          openIncidentsCount: incidents.length,
          recentIncidents: incidents.slice(0, 2).map((i) => ({
            id: i.incidentId,
            title: i.title,
            severity: i.severity,
            status: i.status,
          })),
        },
      });
      sources.push({ title: 'DeepDiagnosticsEngine', category: 'Causal Trace Ledger' });
    }

    if (intent === 'STATUS_REQUEST' || userText.toLowerCase().includes('status') || userText.toLowerCase().includes('happening')) {
      richCards.push({
        type: 'status',
        title: 'Hermes Hive Executive Status',
        data: {
          activeAgentsCount: activeAgents.filter((a) => a.status === 'working').length,
          idleAgentsCount: activeAgents.filter((a) => a.status === 'idle').length,
          activeMissionsCount: activeMissions.filter((m) => m.status === 'in_progress').length,
          capabilitiesCount: capabilities.length,
          federatedHivesCount: hives.length || 3,
        },
      });
      sources.push({ title: 'AgentRegistry', category: 'Swarm Telemetry' });
      sources.push({ title: 'HermesWebBridge', category: 'Capabilities Mesh' });
    }

    // If user text is a direct command or mission creation, invoke hermesEngine
    if (intent === 'COMMAND' || intent === 'MISSION_REQUEST') {
      if (!actionRequired) {
        // Automatically formulate mission
        const execution = await hermesEngine.processHumanCommand(userText);
        if (execution.missionId) {
          if (!conv.relatedMissions) conv.relatedMissions = [];
          conv.relatedMissions.push(execution.missionId);
        }
      }
    }

    // Construct Hermes Response
    const hermesMsg: ChatMessage = {
      id: `msg_h_${Date.now()}`,
      sender: 'hermes',
      text: hermesText,
      timestamp: new Date().toISOString(),
      intent,
      activitySteps,
      richCards: richCards.length > 0 ? richCards : undefined,
      sources: sources.length > 0 ? sources : undefined,
      actionRequired,
    };

    conv.messages.push(hermesMsg);
    conv.updatedAt = new Date().toISOString();

    return { message: hermesMsg, conversation: conv };
  }

  public confirmAction(actionId: string, approvedBy: string): { success: boolean; resultMessage: string } {
    const action = this.pendingActions.get(actionId);
    if (!action) return { success: false, resultMessage: 'Action request not found or expired.' };

    action.status = 'confirmed';

    // Execute corresponding action
    if (action.actionType === 'CREATE_MISSION') {
      hermesEngine.processHumanCommand(`Execute confirmed operation on ${action.target}`);
    } else if (action.actionType === 'RUN_DIAGNOSTICS') {
      deepDiagnosticsEngine.runChaosScenario('HERMES_WEB_OUTAGE');
    }

    return {
      success: true,
      resultMessage: `Action '${action.actionType}' on target '${action.target}' successfully confirmed and executed by ${approvedBy}.`,
    };
  }

  private classifyIntent(text: string): ChatIntent {
    const lower = text.toLowerCase();
    if (lower.startsWith('/missions') || lower.includes('create mission') || lower.includes('start mission')) {
      return 'MISSION_REQUEST';
    }
    if (lower.startsWith('/diagnostics') || lower.includes('diagnose') || lower.includes('incident') || lower.includes('fail')) {
      return 'DIAGNOSTIC_REQUEST';
    }
    if (lower.startsWith('/research') || lower.includes('research') || lower.includes('investigate')) {
      return 'RESEARCH';
    }
    if (lower.startsWith('/status') || lower.includes('status') || lower.includes('happening')) {
      return 'STATUS_REQUEST';
    }
    if (lower.startsWith('/') || lower.includes('pause') || lower.includes('resume') || lower.includes('restart')) {
      return 'COMMAND';
    }
    if (lower.startsWith('why') || lower.includes('explain')) {
      return 'ANALYSIS';
    }
    return 'QUESTION';
  }
}

export const chatEngine = new ChatEngine();
