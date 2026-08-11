import type { Plugin, Connect } from 'vite';
import { agentRegistry } from './registry/agentRegistry';
import { missionEngine } from './missions/missionEngine';
import { hermesEngine } from './hermes/hermesEngine';
import { messageBus } from './bus/messageBus';
import { memoryService } from './memory/memoryService';
import { toolRegistry } from './tools/toolRegistry';
import { diagnosticsService } from './diagnostics/diagnosticsService';
import { goalManager } from './goals/goalManager';
import { governanceEngine } from './governance/governanceEngine';
import { riskEngine } from './governance/riskEngine';
import { worldModel } from './world/worldModel';
import { cognitiveDebateEngine } from './cognition/debateEngine';
import { selfEvaluationEngine } from './learning/selfEvaluationEngine';
import { swarmLearning } from './learning/swarmLearning';
import { resourceManager } from './resources/resourceManager';
import { hiveEventLedger } from './ledger/hiveEventLedger';
import { autonomousLoop } from './hermes/autonomousLoop';
import { hiveRegistry } from './federation/hiveRegistry';
import { federationProtocol } from './federation/federationProtocol';
import { missionContractManager } from './federation/missionContract';
import { trustEngine } from './federation/trustEngine';
import { resourceMarket } from './economy/resourceMarket';
import { organizationFactory } from './organization/organizationFactory';
import { strategicObjectivesManager } from './strategy/strategicObjectives';
import { opportunityEngine } from './innovation/opportunityEngine';
import { projectEngine } from './projects/projectEngine';
import { hiveScheduler } from './os/hiveScheduler';
import { selfModelService } from './selfmodel/selfModelService';
import { capabilityInventory } from './selfmodel/capabilityInventory';
import { organisationHealthService } from './selfmodel/organisationHealth';
import { digitalTwin } from './simulation/digitalTwin';
import { scenarioEngine } from './simulation/scenarioEngine';
import { strategicForesightEngine } from './strategy/foresightEngine';
import { institutionalMemory } from './memory/institutionalMemory';
import { predictionTracker } from './strategy/predictionTracker';
import { hypothesisEngine } from './evolution/hypothesisEngine';
import { experimentEngine } from './evolution/experimentEngine';
import { capabilityGenome } from './evolution/capabilityGenome';
import { evolutionMemory } from './evolution/evolutionMemory';
import { evolutionEngine } from './evolution/evolutionEngine';
import { portfolioManager } from './portfolio/portfolioManager';
import { researchProgramEngine } from './research/researchProgramEngine';
import { hiveConsciousnessEngine } from './collective/hiveConsciousnessEngine';
import { dynamicTeamFormationEngine } from './collective/dynamicTeamFormationEngine';
import { collectiveDecisionEngine } from './collective/collectiveDecisionEngine';
import { agentReputationEngine } from './collective/agentReputationEngine';
import { collectiveMemoryEngine } from './collective/collectiveMemoryEngine';
import { collectiveLearningEngine } from './collective/collectiveLearningEngine';
import { agentEvolutionEngine } from './collective/agentEvolutionEngine';
import { swarmEconomicsEngine } from './collective/swarmEconomicsEngine';
import { emergentStrategyEngine } from './collective/emergentStrategyEngine';
import { hiveHealthEngine } from './collective/hiveHealthEngine';
import { hiveTrustEngine } from './federation/hiveTrustEngine';
import { federationMessageRouter } from './federation/federationMessageRouter';
import { federatedTaskEngine } from './federation/federatedTaskEngine';
import { federatedEconomicsEngine } from './federation/federatedEconomicsEngine';
import { federatedReputationEngine } from './federation/federatedReputationEngine';
import { federatedMemoryEngine } from './federation/federatedMemoryEngine';
import { federatedConsensusEngine } from './federation/federatedConsensusEngine';
import { federationGovernanceEngine } from './federation/federationGovernanceEngine';
import { partitionRecoveryEngine } from './federation/partitionRecoveryEngine';
import { hiveQuarantineEngine } from './federation/hiveQuarantineEngine';
import { federationHealthEngine } from './federation/federationHealthEngine';
import { federationAuditEngine } from './federation/federationAuditEngine';
import { federationSimulationEngine } from './federation/federationSimulationEngine';
import { capabilityRegistry } from './web/capabilityRegistry';
import { policyAndAuthorizationEngine } from './web/policyAndAuthorizationEngine';
import { auditLogger } from './web/auditLogger';
import { hermesWebEngine } from './web/hermesWebEngine';
import { webCapabilityClient } from './hermes/webCapabilityClient';
import { deepDiagnosticsEngine } from './diagnostics/deepDiagnosticsEngine';
import { chatEngine } from './hermes/chatEngine';
import { agentConfigManager } from './gemini/agentConfig';
import { HiveEvent } from '../shared/types';
import { causalEvaluationEngine } from './learning/causalEvaluationEngine';
import { reputationEngine } from './learning/reputationEngine';
import { capabilityEvolutionEngine } from './learning/capabilityEvolutionEngine';
import { symbioticSynthesisEngine } from './learning/symbioticSynthesisEngine';
import { holographicMemoryFusion } from './learning/holographicMemoryFusion';


interface QuickActionLog {
  id: string;
  templateName: string;
  scenario: string;
  timestamp: string;
  initiatedBy: string;
}

interface QuickActionTemplate {
  id: string;
  name: string;
  scenario: string;
  prompt: string;
  badge: string;
  iconName: string;
}

const quickActionHistory: QuickActionLog[] = [
  {
    id: 'qa-1',
    templateName: 'High-Performance Cluster Mode',
    scenario: 'high_performance_cluster',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    initiatedBy: 'Executive Operator (jonnysteedman683@gmail.com)'
  },
  {
    id: 'qa-2',
    templateName: 'Security & Vulnerability Audit',
    scenario: 'security_audit',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    initiatedBy: 'Executive Operator (jonnysteedman683@gmail.com)'
  }
];

const customTemplates: QuickActionTemplate[] = [
  {
    id: 'tpl-1',
    name: 'High-Performance Cluster Mode',
    scenario: 'high_performance_cluster',
    prompt: 'Scale up swarm cluster nodes, allocate max compute resources, and activate high-throughput routing across all active agent workers.',
    badge: 'Max Throttle',
    iconName: 'Zap'
  },
  {
    id: 'tpl-2',
    name: 'Energy-Saving Sleep',
    scenario: 'energy_saving_sleep',
    prompt: 'Optimize agent heartbeats, spin down idle worker containers, and shift to energy-saving low-power idle mode.',
    badge: 'Low Power',
    iconName: 'Moon'
  },
  {
    id: 'tpl-3',
    name: 'Security & Vulnerability Audit',
    scenario: 'security_audit',
    prompt: 'Run an automated full-stack security and vulnerability audit on our microservices architecture.',
    badge: 'Governance',
    iconName: 'ShieldAlert'
  },
  {
    id: 'tpl-4',
    name: 'Post-Quantum Cryptography',
    scenario: 'quantum_crypto',
    prompt: 'Research post-quantum cryptography algorithms and build a migration roadmap for API key storage.',
    badge: 'Advanced',
    iconName: 'Sparkles'
  }
];

export function apiMiddleware(): Plugin {
  return {
    name: 'hermes-hive-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req: Connect.IncomingMessage, res: any, next: Connect.NextFunction) => {
        const url = req.url || '';

        // Only process /api/ routes
        if (!url.startsWith('/api')) {
          return next();
        }

        const method = req.method || 'GET';

        // Helper to parse JSON body
        const getBody = (): Promise<any> => {
          return new Promise((resolve) => {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch {
                resolve({});
              }
            });
          });
        };

        const jsonResponse = (data: any, status = 200) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify(data));
        };

        try {
          // 1. Health check
          if (url === '/api/health') {
            return jsonResponse({ status: 'ok', hive: 'HERMES HIVE', time: new Date().toISOString() });
          }

          // 2. Real-time SSE Stream
          if (url.startsWith('/api/events/stream')) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');

            // Send initial ping
            res.write(`data: ${JSON.stringify({ type: 'PING', timestamp: new Date().toISOString() })}\n\n`);

            const unsubscribe = messageBus.subscribe((event: HiveEvent) => {
              try {
                res.write(`data: ${JSON.stringify(event)}\n\n`);
              } catch {
                unsubscribe();
              }
            });

            req.on('close', () => {
              unsubscribe();
            });
            return;
          }

          // 3. Events & Message Bus Endpoints
          if (url === '/api/events/stats' && method === 'GET') {
            return jsonResponse({ stats: messageBus.getStats() });
          }

          if (url === '/api/events/dlq' && method === 'GET') {
            return jsonResponse({ dlq: messageBus.getDeadLetterQueue() });
          }

          if (url === '/api/events/dlq/retry' && method === 'POST') {
            const body = await getBody();
            const retried = messageBus.retryDeadLetter(body.dlqId);
            return jsonResponse({ success: retried });
          }

          if (url === '/api/events/publish' && method === 'POST') {
            const body = await getBody();
            if (!body.type || !body.source) {
              return jsonResponse({ error: 'Event type and source required' }, 400);
            }
            const event = messageBus.publish(body.type, body.source, body.payload || {}, {
              missionId: body.missionId,
              taskId: body.taskId,
              agentId: body.agentId,
              severity: (['info', 'success', 'warning', 'error'].includes(body.severity) ? body.severity : 'info') as 'info' | 'success' | 'warning' | 'error',
            });
            return jsonResponse({ success: true, event });
          }

          if (url.startsWith('/api/events')) {
            const parsedUrl = new URL(url, `http://${req.headers.host || 'localhost'}`);
            const limit = parseInt(parsedUrl.searchParams.get('limit') || '100', 10);
            const severity = (['info', 'success', 'warning', 'error'].includes(parsedUrl.searchParams.get('severity') || '')
              ? parsedUrl.searchParams.get('severity')
              : undefined) as 'info' | 'success' | 'warning' | 'error' | undefined;
            const type = parsedUrl.searchParams.get('type') as any || undefined;
            const missionId = parsedUrl.searchParams.get('missionId') || undefined;
            const agentId = parsedUrl.searchParams.get('agentId') || undefined;
            const events = messageBus.getEvents({ limit, severity, type, missionId, agentId });
            return jsonResponse({ events, stats: messageBus.getStats() });
          }

          // 4. Hermes Command / Objectives
          if (url === '/api/hermes/command' && method === 'POST') {
            const body = await getBody();
            const command = body.command;
            if (!command) {
              return jsonResponse({ error: 'Command prompt is required' }, 400);
            }

            const result = await hermesEngine.processHumanCommand(command);
            return jsonResponse(result);
          }

          if (url === '/api/hermes/decisions') {
            const decisions = hermesEngine.getRecentDecisions();
            return jsonResponse({ decisions });
          }

          // 5. Agents REST
          if (url === '/api/agents' && method === 'GET') {
            return jsonResponse({ agents: agentRegistry.getAllAgents() });
          }

          if (url === '/api/agents' && method === 'POST') {
            const body = await getBody();
            const newAgent = agentRegistry.createAgent({
              name: body.name || `Agent-${body.role || 'Worker'}`,
              role: body.role || 'Researcher',
              capabilities: body.capabilities || ['analysis'],
              clusterId: body.clusterId || 'Cluster A',
            });
            return jsonResponse({ agent: newAgent });
          }

          if (url === '/api/agents/bulk-action' && method === 'POST') {
            const body = await getBody();
            const { agentIds, action } = body || {};
            if (!Array.isArray(agentIds) || !action) {
              return jsonResponse({ error: 'Invalid agentIds array or action' }, 400);
            }
            const updatedAgents = [];
            for (const id of agentIds) {
              let updated;
              if (action === 'pause') updated = agentRegistry.pauseAgent(id);
              else if (action === 'resume') updated = agentRegistry.resumeAgent(id);
              else if (action === 'terminate') updated = agentRegistry.terminateAgent(id);
              else if (action === 'restart') updated = agentRegistry.restartAgent(id);
              if (updated) updatedAgents.push(updated);
            }
            return jsonResponse({ success: true, count: updatedAgents.length, agents: updatedAgents });
          }

          if (url.startsWith('/api/agents/')) {
            const parts = url.split('/');
            const agentId = parts[3];
            const action = parts[4];

            if (agentId && !action) {
              const agent = agentRegistry.getAgent(agentId);
              if (!agent) return jsonResponse({ error: 'Agent not found' }, 404);
              return jsonResponse({ agent });
            }

            if (agentId && action && method === 'POST') {
              let updatedAgent;
              if (action === 'pause') updatedAgent = agentRegistry.pauseAgent(agentId);
              else if (action === 'resume') updatedAgent = agentRegistry.resumeAgent(agentId);
              else if (action === 'terminate') updatedAgent = agentRegistry.terminateAgent(agentId);
              else if (action === 'restart') updatedAgent = agentRegistry.restartAgent(agentId);

              if (!updatedAgent) return jsonResponse({ error: 'Failed to apply agent action' }, 400);
              return jsonResponse({ agent: updatedAgent });
            }
          }

          // 6. Missions REST
          if (url === '/api/missions' && method === 'GET') {
            return jsonResponse({ missions: missionEngine.getAllMissions() });
          }

          if (url.startsWith('/api/missions/') && method === 'GET') {
            const missionId = url.split('/')[3];
            const mission = missionEngine.getMission(missionId);
            if (!mission) return jsonResponse({ error: 'Mission not found' }, 404);
            return jsonResponse({ mission });
          }

          if (url === '/api/missions' && method === 'POST') {
            const body = await getBody();
            if (!body.objective || !Array.isArray(body.tasks)) {
              return jsonResponse({ error: 'Invalid mission payload' }, 400);
            }
            const mission = missionEngine.createMission({
              objective: body.objective,
              priority: body.priority || 3,
              tasks: body.tasks,
            });
            return jsonResponse({ mission });
          }

          // 7. Memory REST
          if (url === '/api/memory' && method === 'GET') {
            const parsedUrl = new URL(url, `http://${req.headers.host || 'localhost'}`);
            const layer = (parsedUrl.searchParams.get('layer') as any) || undefined;
            const search = parsedUrl.searchParams.get('search') || undefined;
            const records = memoryService.query({ layer, search });
            return jsonResponse({ records });
          }

          if (url === '/api/memory' && method === 'POST') {
            const body = await getBody();
            const record = memoryService.addRecord({
              layer: body.layer || 'semantic',
              key: body.key || 'custom_knowledge',
              content: body.content || '',
              tags: body.tags || [],
            });
            return jsonResponse({ record });
          }

          // 8. Tools REST
          if (url === '/api/tools' && method === 'GET') {
            return jsonResponse({ tools: toolRegistry.listTools() });
          }

          if (url === '/api/tools/execute' && method === 'POST') {
            const body = await getBody();
            const result = await toolRegistry.executeTool(body.toolName, body.input || {});
            return jsonResponse(result);
          }

          // 9. Diagnostics REST
          if (url === '/api/diagnostics') {
            return jsonResponse({ metrics: diagnosticsService.getMetrics() });
          }

          // 10. Demo Scenario Trigger & Quick Actions
          if (url === '/api/quick-actions/templates' && method === 'GET') {
            return jsonResponse({ templates: customTemplates });
          }

          if (url === '/api/quick-actions/templates' && method === 'POST') {
            const body = await getBody();
            const newTpl: QuickActionTemplate = {
              id: `tpl-${Date.now()}`,
              name: body.name || 'Custom Template',
              scenario: body.scenario || `scenario_${Date.now()}`,
              prompt: body.prompt || 'Execute swarm orchestration directive.',
              badge: body.badge || 'Custom',
              iconName: body.iconName || 'Zap'
            };
            customTemplates.push(newTpl);
            return jsonResponse({ success: true, templates: customTemplates, template: newTpl });
          }

          if (url.startsWith('/api/quick-actions/templates/') && method === 'PUT') {
            const id = url.split('/')[4];
            const body = await getBody();
            const index = customTemplates.findIndex(t => t.id === id);
            if (index !== -1) {
              customTemplates[index] = {
                ...customTemplates[index],
                name: body.name ?? customTemplates[index].name,
                scenario: body.scenario ?? customTemplates[index].scenario,
                prompt: body.prompt ?? customTemplates[index].prompt,
                badge: body.badge ?? customTemplates[index].badge,
                iconName: body.iconName ?? customTemplates[index].iconName,
              };
              return jsonResponse({ success: true, templates: customTemplates, template: customTemplates[index] });
            }
            return jsonResponse({ error: 'Template not found' }, 404);
          }

          if (url.startsWith('/api/quick-actions/templates/') && method === 'DELETE') {
            const id = url.split('/')[4];
            const index = customTemplates.findIndex(t => t.id === id);
            if (index !== -1) {
              customTemplates.splice(index, 1);
              return jsonResponse({ success: true, templates: customTemplates });
            }
            return jsonResponse({ error: 'Template not found' }, 404);
          }

          if (url === '/api/quick-actions/history' && method === 'GET') {
            return jsonResponse({ history: quickActionHistory });
          }

          if (url === '/api/quick-actions/trigger' && method === 'POST') {
            const body = await getBody();
            const scenario = body.scenario || 'high_performance_cluster';
            const templateName = body.templateName || 'High-Performance Cluster Mode';
            const initiatedBy = body.initiatedBy || 'Executive Operator (jonnysteedman683@gmail.com)';

            let prompt = body.prompt;
            if (!prompt) {
              const found = customTemplates.find(t => t.scenario === scenario || t.id === body.templateId);
              if (found) {
                prompt = found.prompt;
              } else {
                prompt = 'Scale up swarm cluster nodes, allocate max compute resources, and activate high-throughput routing across all active agent workers.';
                if (scenario === 'energy_saving_sleep') {
                  prompt = 'Optimize agent heartbeats, spin down idle worker containers, and shift to energy-saving low-power idle mode.';
                } else if (scenario === 'security_audit') {
                  prompt = 'Run an automated full-stack security and vulnerability audit on our microservices architecture.';
                } else if (scenario === 'quantum_crypto') {
                  prompt = 'Research post-quantum cryptography algorithms and build a migration roadmap for API key storage.';
                } else if (scenario === 'refactor_core') {
                  prompt = 'Perform architectural analysis on the repository, identify performance bottlenecks, and generate optimized refactoring specifications.';
                }
              }
            }

            const result = await hermesEngine.processHumanCommand(prompt);

            const newLog: QuickActionLog = {
              id: `qa-${Date.now()}`,
              templateName,
              scenario,
              timestamp: new Date().toISOString(),
              initiatedBy,
            };
            quickActionHistory.unshift(newLog);
            if (quickActionHistory.length > 50) quickActionHistory.pop();

            return jsonResponse({ success: true, log: newLog, history: quickActionHistory, result });
          }

          if (url === '/api/demo/trigger' && method === 'POST') {
            const body = await getBody();
            const scenario = body.scenario || 'security_audit';

            let prompt = 'Run an automated full-stack security and vulnerability audit on our microservices architecture.';
            let templateName = 'Security & Vulnerability Audit';
            if (scenario === 'quantum_crypto') {
              prompt = 'Research post-quantum cryptography algorithms and build a migration roadmap for API key storage.';
              templateName = 'Post-Quantum Cryptography';
            } else if (scenario === 'refactor_core') {
              prompt = 'Perform architectural analysis on the repository, identify performance bottlenecks, and generate optimized refactoring specifications.';
              templateName = 'Architecture Refactor';
            } else if (scenario === 'high_performance_cluster') {
              prompt = 'Scale up swarm cluster nodes, allocate max compute resources, and activate high-throughput routing across all active agent workers.';
              templateName = 'High-Performance Cluster Mode';
            } else if (scenario === 'energy_saving_sleep') {
              prompt = 'Optimize agent heartbeats, spin down idle worker containers, and shift to energy-saving low-power idle mode.';
              templateName = 'Energy-Saving Sleep';
            }

            const result = await hermesEngine.processHumanCommand(prompt);

            const newLog: QuickActionLog = {
              id: `qa-${Date.now()}`,
              templateName,
              scenario,
              timestamp: new Date().toISOString(),
              initiatedBy: 'Executive Operator (jonnysteedman683@gmail.com)',
            };
            quickActionHistory.unshift(newLog);
            if (quickActionHistory.length > 50) quickActionHistory.pop();

            return jsonResponse({ scenario, prompt, result, history: quickActionHistory });
          }

          // Hermes Agent AI Connection API
          if (url === '/api/agent-ai/settings' && method === 'GET') {
            return jsonResponse({ settings: agentConfigManager.getSettingsSafe() });
          }

          if (url === '/api/agent-ai/settings' && method === 'POST') {
            const body = await getBody();
            const safeSettings = agentConfigManager.updateSettings(body);
            return jsonResponse({ success: true, settings: safeSettings });
          }

          if (url === '/api/agent-ai/test' && method === 'POST') {
            const body = await getBody();
            const result = await agentConfigManager.testConnection(body);
            return jsonResponse(result);
          }

          // 11. Stage 2 — Goals API
          if (url === '/api/goals' && method === 'GET') {
            return jsonResponse({ goals: goalManager.getAllGoals() });
          }

          // 12. Stage 2 — Governance & Risk API
          if (url === '/api/governance/policies' && method === 'GET') {
            return jsonResponse({ policies: governanceEngine.getAllPolicies() });
          }

          if (url === '/api/governance/approvals' && method === 'GET') {
            return jsonResponse({ approvals: governanceEngine.getPendingApprovals() });
          }

          if (url.startsWith('/api/governance/approvals/') && method === 'POST') {
            const parts = url.split('/');
            const id = parts[4];
            const action = parts[5];
            if (action === 'approve') {
              const ok = governanceEngine.approveRequest(id);
              return jsonResponse({ success: ok });
            } else if (action === 'deny') {
              const ok = governanceEngine.denyRequest(id);
              return jsonResponse({ success: ok });
            }
          }

          // 13. Stage 2 — World Model API
          if (url === '/api/world/graph' && method === 'GET') {
            return jsonResponse({ graph: worldModel.getWorldGraph() });
          }

          // 14. Stage 2 — Cognition & Debates API
          if (url === '/api/cognition/debates' && method === 'GET') {
            return jsonResponse({ debates: cognitiveDebateEngine.getAllDebates() });
          }

          // 15. Stage 2 — Learning & Evaluations API
          if (url === '/api/learning' && method === 'GET') {
            return jsonResponse({
              evaluations: selfEvaluationEngine.getAllEvaluations(),
              learnings: swarmLearning.getAllLearning(),
            });
          }

          // 16. Stage 2 — Resource Economy API
          if (url === '/api/resources/budgets' && method === 'GET') {
            return jsonResponse({ budgets: resourceManager.getAllBudgets() });
          }

          // 17. Stage 2 — Hive Event Ledger API
          if (url === '/api/ledger/events' && method === 'GET') {
            return jsonResponse({ ledger: hiveEventLedger.getAllEvents() });
          }

          // 18. Stage 2 — Autonomous Loop Control API
          if (url === '/api/loop/mode' && method === 'GET') {
            return jsonResponse({ mode: autonomousLoop.getOperatingMode() });
          }

          if (url === '/api/loop/mode' && method === 'POST') {
            const body = await getBody();
            if (body.mode) {
              autonomousLoop.setOperatingMode(body.mode);
            }
            return jsonResponse({ mode: autonomousLoop.getOperatingMode() });
          }

          // 19. Stage 4 — Federation API
          if (url === '/api/federation/hives' && method === 'GET') {
            return jsonResponse({ hives: hiveRegistry.getAllHives() });
          }

          if (url === '/api/federation/messages' && method === 'GET') {
            return jsonResponse({ messages: federationProtocol.getAllMessages() });
          }

          if (url === '/api/federation/contracts' && method === 'GET') {
            return jsonResponse({ contracts: missionContractManager.getAllContracts() });
          }

          if (url === '/api/federation/trust' && method === 'GET') {
            return jsonResponse({ trustRecords: trustEngine.getAllTrustRecords() });
          }

          // 20. Stage 4 — Economy API
          if (url === '/api/economy/market' && method === 'GET') {
            return jsonResponse({ listings: resourceMarket.getAllListings() });
          }

          // 21. Stage 4 — Organisation API
          if (url === '/api/organization/divisions' && method === 'GET') {
            return jsonResponse({ divisions: organizationFactory.getAllDivisions() });
          }

          // 22. Stage 4 — Strategic Objectives API
          if (url === '/api/strategy/objectives' && method === 'GET') {
            return jsonResponse({ objectives: strategicObjectivesManager.getAllObjectives() });
          }

          if (url === '/api/strategy/objectives' && method === 'POST') {
            const body = await getBody();
            const obj = strategicObjectivesManager.createObjective({
              title: body.title || 'New Strategic Objective',
              description: body.description || 'Autonomous strategic objective',
              successCriteria: body.successCriteria || ['Achieve objective'],
            });
            return jsonResponse({ objective: obj });
          }

          // 23. Stage 4 — Innovation & Projects API
          if (url === '/api/innovation/opportunities' && method === 'GET') {
            return jsonResponse({ proposals: opportunityEngine.getAllProposals() });
          }

          if (url === '/api/projects' && method === 'GET') {
            return jsonResponse({ projects: projectEngine.getAllProjects() });
          }

          if (url === '/api/projects/convert' && method === 'POST') {
            const body = await getBody();
            const proj = projectEngine.convertOpportunityToProject(body.opportunityId, body.divisionId);
            return jsonResponse({ project: proj });
          }

          // 24. Stage 4 — Hive OS Status API
          if (url === '/api/os/status' && method === 'GET') {
            return jsonResponse({ status: hiveScheduler.getOSStatus() });
          }

          // 25. Stage 5A — Self Model API
          if (url === '/api/selfmodel' && method === 'GET') {
            return jsonResponse({ selfModel: selfModelService.getSelfModel() });
          }

          if (url === '/api/selfmodel/capabilities' && method === 'GET') {
            return jsonResponse({ capabilities: capabilityInventory.getAllCapabilities() });
          }

          if (url === '/api/selfmodel/gaps' && method === 'GET') {
            return jsonResponse({ gaps: capabilityInventory.getAllGaps() });
          }

          if (url === '/api/selfmodel/health' && method === 'GET') {
            return jsonResponse({ health: organisationHealthService.calculateHealth() });
          }

          // 26. Stage 5A — Digital Twin & Scenario Engine API
          if (url === '/api/simulation/twin/snapshot' && method === 'POST') {
            const snapshot = digitalTwin.createSnapshot();
            return jsonResponse({ snapshot });
          }

          if (url === '/api/simulation/scenarios' && method === 'GET') {
            return jsonResponse({ scenarios: scenarioEngine.getAllScenarios() });
          }

          if (url === '/api/simulation/scenarios' && method === 'POST') {
            const body = await getBody();
            const scenario = scenarioEngine.runScenario(
              body.title || 'User Custom Scenario',
              body.scenarioType || 'RESOURCE_REALLOCATION',
              body.assumptions || ['Custom user assumption set']
            );
            return jsonResponse({ scenario });
          }

          // 27. Stage 5A — Strategic Foresight API
          if (url === '/api/strategy/foresight' && method === 'GET') {
            return jsonResponse({ scenarios: strategicForesightEngine.getAllScenarios() });
          }

          // 28. Stage 5A — Institutional Memory API
          if (url === '/api/memory/institutional/decisions' && method === 'GET') {
            return jsonResponse({ decisions: institutionalMemory.getAllDecisions() });
          }

          // 29. Stage 5A — Prediction Accuracy API
          if (url === '/api/strategy/predictions' && method === 'GET') {
            return jsonResponse({
              records: predictionTracker.getAllPredictions(),
              averageAccuracy: predictionTracker.getAverageAccuracyScore(),
            });
          }

          // 30. Stage 5B — Autonomous Evolution Engine API
          if (url === '/api/evolution/hypotheses' && method === 'GET') {
            return jsonResponse({ hypotheses: hypothesisEngine.getAllHypotheses() });
          }

          if (url === '/api/evolution/hypotheses' && method === 'POST') {
            const body = await getBody();
            const hyp = hypothesisEngine.createHypothesis(
              body.statement || 'Custom user hypothesis',
              body.evidence || 'User empirical evidence',
              body.expectedEffect || 'Improved throughput',
              body.measurementMetric || 'Latency (ms)'
            );
            return jsonResponse({ hypothesis: hyp });
          }

          if (url === '/api/evolution/experiments' && method === 'GET') {
            return jsonResponse({ experiments: experimentEngine.getAllExperiments() });
          }

          if (url === '/api/evolution/experiments' && method === 'POST') {
            const body = await getBody();
            const exp = experimentEngine.createExperiment(
              body.hypothesisId || 'hyp-001',
              body.title || 'User Experiment',
              body.baselineStrategy || 'Baseline Strategy',
              body.candidateStrategy || 'Candidate Strategy'
            );
            return jsonResponse({ experiment: exp });
          }

          if (url === '/api/evolution/experiments/promote' && method === 'POST') {
            const body = await getBody();
            const exp = experimentEngine.promoteExperiment(body.experimentId);
            return jsonResponse({ experiment: exp });
          }

          if (url === '/api/evolution/genome' && method === 'GET') {
            return jsonResponse({ genome: capabilityGenome.getGenome() });
          }

          if (url === '/api/evolution/memory' && method === 'GET') {
            return jsonResponse({ memory: evolutionMemory.getAllItems() });
          }

          if (url === '/api/evolution/proposals' && method === 'GET') {
            return jsonResponse({ proposals: evolutionEngine.getAllProposals() });
          }

          if (url === '/api/evolution/proposals' && method === 'POST') {
            const body = await getBody();
            const prop = evolutionEngine.createProposal(
              body.title || 'Custom Evolution Proposal',
              body.changeDescription || 'User proposed system optimization',
              body.expectedBenefit || 'Higher reliability and throughput'
            );
            return jsonResponse({ proposal: prop });
          }

          // 31. Stage 5B — Autonomous Portfolio Manager API
          if (url === '/api/portfolio/projects' && method === 'GET') {
            return jsonResponse({ projects: portfolioManager.getAllProjects() });
          }

          if (url === '/api/portfolio/projects/status' && method === 'POST') {
            const body = await getBody();
            const proj = portfolioManager.updateProjectStatus(body.projectId, body.status);
            return jsonResponse({ project: proj });
          }

          // 32. Stage 5B — Research Programs API
          if (url === '/api/research/programs' && method === 'GET') {
            return jsonResponse({ programs: researchProgramEngine.getAllPrograms() });
          }

          // 33. Stage 6 — Hive Consciousness API
          if (url === '/api/collective/consciousness' && method === 'GET') {
            return jsonResponse({
              observations: hiveConsciousnessEngine.getObservations(),
              awareness: hiveConsciousnessEngine.getSynthesizedAwareness(),
            });
          }

          if (url === '/api/collective/observations' && method === 'POST') {
            const body = await getBody();
            const obs = hiveConsciousnessEngine.addObservation(
              body.agentId || 'agent-user',
              body.agentName || 'User Sentinel',
              body.hiveId || 'hive-hermes-prime',
              body.observation || 'User recorded situational observation',
              body.category || 'PERFORMANCE',
              body.confidence || 0.95
            );
            return jsonResponse({ observation: obs });
          }

          // 34. Stage 6 — Swarm Coordination & Dynamic Teams API
          if (url === '/api/collective/teams' && method === 'GET') {
            return jsonResponse({ teams: dynamicTeamFormationEngine.getAllTeams() });
          }

          if (url === '/api/collective/teams' && method === 'POST') {
            const body = await getBody();
            const team = dynamicTeamFormationEngine.formTeam(
              body.objective || 'Dynamic Swarm Task Objective',
              body.hiveId || 'hive-hermes-prime',
              body.requiredCapabilities || ['SWARM_COORDINATION', 'REASONING'],
              body.tokenBudget || 50000
            );
            return jsonResponse({ team });
          }

          // 35. Stage 6 — Collective Decision Engine API
          if (url === '/api/collective/decisions' && method === 'GET') {
            return jsonResponse({ proposals: collectiveDecisionEngine.getAllProposals() });
          }

          if (url === '/api/collective/decisions' && method === 'POST') {
            const body = await getBody();
            const prop = collectiveDecisionEngine.createProposal(
              body.title || 'Swarm Decision Proposal',
              body.objective || 'Collective Optimization Goal',
              body.proposerAgentId || 'agent-executive-prime',
              body.options || [
                { optionId: 'opt-1', description: 'Option 1 Strategy', expectedOutcome: 'High speed', riskLevel: 'LOW' },
                { optionId: 'opt-2', description: 'Option 2 Strategy', expectedOutcome: 'High accuracy', riskLevel: 'LOW' },
              ]
            );
            return jsonResponse({ proposal: prop });
          }

          if (url === '/api/collective/decisions/vote' && method === 'POST') {
            const body = await getBody();
            const prop = collectiveDecisionEngine.castVote(
              body.proposalId,
              body.agentId || 'agent-executive-prime',
              body.agentRole || 'Coordinator',
              body.selectedOptionId || 'opt-1',
              body.weight || 1.2,
              body.reasoning || 'Empirical evidence supports this candidate option.',
              body.confidence || 0.95,
              body.isDissent || false,
              body.dissentEvidence || ''
            );
            return jsonResponse({ proposal: prop });
          }

          // 36. Stage 6 — Agent Reputation API
          if (url === '/api/collective/reputation' && method === 'GET') {
            return jsonResponse({ records: agentReputationEngine.getReputationRecords() });
          }

          // 37. Stage 6 — Collective Memory API
          if (url === '/api/collective/memory' && method === 'GET') {
            return jsonResponse({ memories: collectiveMemoryEngine.getAllMemories() });
          }

          // 38. Stage 6 — Collective Learning API
          if (url === '/api/collective/learning' && method === 'GET') {
            return jsonResponse({ analyses: collectiveLearningEngine.getAllAnalyses() });
          }

          // 39. Stage 6 — Agent Evolution Actions API
          if (url === '/api/collective/evolution/actions' && method === 'GET') {
            return jsonResponse({ actions: agentEvolutionEngine.getAllEvolutionActions() });
          }

          // 40. Stage 6 — Swarm Economics API
          if (url === '/api/collective/economics' && method === 'GET') {
            return jsonResponse({
              bids: swarmEconomicsEngine.getAllBids(),
              allocations: swarmEconomicsEngine.getAllAllocations(),
            });
          }

          // 41. Stage 6 — Emergent Strategy API
          if (url === '/api/collective/strategies' && method === 'GET') {
            return jsonResponse({ strategies: emergentStrategyEngine.getAllStrategies() });
          }

          // 42. Stage 6 — Hive Health API
          if (url === '/api/collective/health' && method === 'GET') {
            return jsonResponse({ health: hiveHealthEngine.getHealthMetrics() });
          }

          // 43. Stage 7 — Federation Status & Health API
          if (url === '/api/federation/status' && method === 'GET') {
            return jsonResponse({
              status: 'ONLINE',
              health: federationHealthEngine.getFederationHealth(),
              activeHives: hiveRegistry.getAllHives().length,
            });
          }

          if (url === '/api/federation/health' && method === 'GET') {
            return jsonResponse({ health: federationHealthEngine.getFederationHealth() });
          }

          // 44. Stage 7 — Hive Registry & Discovery API
          if (url === '/api/federation/hives' && method === 'GET') {
            return jsonResponse({ hives: hiveRegistry.getAllHives() });
          }

          if (url === '/api/federation/hives/register' && method === 'POST') {
            const body = await getBody();
            const record = hiveRegistry.registerHive(
              body.hiveId || `hive-external-${Date.now()}`,
              body.name || 'External Hive Node',
              body.description || 'Federated node',
              body.capabilities || ['COMPUTE'],
              body.endpoint || 'https://external.hive/api/federation'
            );
            return jsonResponse({ record });
          }

          if (url === '/api/federation/hives/discover' && method === 'POST') {
            const stale = hiveRegistry.scanStaleHives();
            return jsonResponse({ discoveredHives: hiveRegistry.getAllHives(), staleUpdated: stale.length });
          }

          // 45. Stage 7 — Federated Messaging API
          if (url === '/api/federation/messages' && method === 'POST') {
            const body = await getBody();
            const msg = federationMessageRouter.createMessage(
              body.sourceHiveId || 'hive-hermes-prime',
              body.destinationHiveId || 'hive-security-gamma',
              body.messageType || 'HEARTBEAT',
              body.payload || {}
            );
            const result = await federationMessageRouter.routeAndExecute(msg);
            return jsonResponse({ message: msg, executionResult: result });
          }

          // 46. Stage 7 — Federated Tasks API
          if (url === '/api/federation/tasks' && method === 'GET') {
            return jsonResponse({ tasks: federatedTaskEngine.getAllTasks() });
          }

          if (url === '/api/federation/tasks' && method === 'POST') {
            const body = await getBody();
            const task = federatedTaskEngine.publishTask(
              body.originatorHiveId || 'hive-hermes-prime',
              body.objective || 'Federated Cross-Hive Objective',
              body.requiredCapabilities || ['COMPUTE'],
              body.constraints || [],
              body.tokenBudget || 50000,
              body.compensationTokens || 10000
            );
            return jsonResponse({ task });
          }

          if (url.includes('/api/federation/tasks/') && url.endsWith('/bid') && method === 'POST') {
            const taskId = url.split('/')[4];
            const body = await getBody();
            const bid = federatedTaskEngine.submitBid(
              taskId,
              body.biddingHiveId || 'hive-ops-beta',
              body.biddingHiveName || 'Operations Hive Beta',
              body.capabilitiesMatched || ['COMPUTE'],
              body.estimatedCompletionTimeSec || 1200,
              body.confidence || 0.95,
              body.bidPriceTokens || 8000
            );
            return jsonResponse({ bid });
          }

          if (url.includes('/api/federation/tasks/') && url.endsWith('/assign') && method === 'POST') {
            const taskId = url.split('/')[4];
            const body = await getBody();
            const task = federatedTaskEngine.assignTask(taskId, body.winningBid);
            return jsonResponse({ task });
          }

          // 47. Stage 7 — Federated Trust & Reputation API
          if (url === '/api/federation/trust' && method === 'GET') {
            return jsonResponse({ trustRecords: hiveTrustEngine.getAllTrustRecords() });
          }

          if (url === '/api/federation/reputation' && method === 'GET') {
            return jsonResponse({ records: federatedReputationEngine.getAllReputationRecords() });
          }

          // 48. Stage 7 — Federated Memory API
          if (url === '/api/federation/memory' && method === 'GET') {
            return jsonResponse({ memories: federatedMemoryEngine.getAllMemories() });
          }

          if (url === '/api/federation/memory' && method === 'POST') {
            const body = await getBody();
            const memory = federatedMemoryEngine.shareKnowledge(
              body.sourceHiveId || 'hive-hermes-prime',
              body.category || 'STRATEGIC_KNOWLEDGE',
              body.content || 'Federated knowledge payload',
              body.evidence || 'Verified multi-hive evidence',
              body.confidence || 0.9
            );
            return jsonResponse({ memory });
          }

          // 49. Stage 7 — Federated Consensus API
          if (url === '/api/federation/consensus' && method === 'GET') {
            return jsonResponse({ proposals: federatedConsensusEngine.getAllProposals() });
          }

          if (url === '/api/federation/consensus' && method === 'POST') {
            const body = await getBody();
            const prop = federatedConsensusEngine.createProposal(
              body.proposerHiveId || 'hive-hermes-prime',
              body.title || 'Multi-Hive Protocol Upgrade Proposal',
              body.objective || 'Federation-wide consensus objective',
              body.options || [
                { optionId: 'opt-a', description: 'Enable Option A', expectedOutcome: 'Higher throughput' },
                { optionId: 'opt-b', description: 'Enable Option B', expectedOutcome: 'Higher security' },
              ],
              body.affectedHiveIds || ['hive-hermes-prime', 'hive-security-gamma', 'hive-ops-beta']
            );
            return jsonResponse({ proposal: prop });
          }

          // 50. Stage 7 — Audit, Quarantine & Simulation API
          if (url === '/api/federation/audit' && method === 'GET') {
            return jsonResponse({ auditTrail: federationAuditEngine.getAuditTrail() });
          }

          if (url.includes('/api/federation/hives/') && url.endsWith('/quarantine') && method === 'POST') {
            const hiveId = url.split('/')[4];
            const body = await getBody();
            const rec = hiveQuarantineEngine.quarantineHive(
              hiveId,
              body.status || 'QUARANTINED',
              body.reason || 'Anomalous signature or policy breach',
              body.evidence || 'Automated security alert'
            );
            return jsonResponse({ quarantineRecord: rec });
          }

          if (url.includes('/api/federation/hives/') && url.endsWith('/recover') && method === 'POST') {
            const hiveId = url.split('/')[4];
            const body = await getBody();
            const ok = hiveQuarantineEngine.recoverHive(hiveId, body.auditorHiveId || 'hive-hermes-prime');
            return jsonResponse({ success: ok });
          }

          if (url === '/api/federation/simulation' && method === 'POST') {
            const body = await getBody();
            const result = federationSimulationEngine.runSimulation({
              hiveCount: body.hiveCount || 5,
              seed: body.seed || 42,
              simulatedLatencyMs: body.simulatedLatencyMs || 20,
              packetLossPct: body.packetLossPct || 0,
              includeRogueHive: body.includeRogueHive ?? true,
              simulatePartition: body.simulatePartition ?? true,
            });
            return jsonResponse({ simulationResult: result });
          }

          // ==================================================================
          // HERMES HIVE ↔ HERMES WEB CAPABILITY PROTOCOL API ENDPOINTS
          // ==================================================================

          // 51. GET /api/v1/capabilities - Capability Discovery
          if ((url.startsWith('/api/v1/capabilities') || url.startsWith('/api/web/capabilities')) && method === 'GET' && !url.includes('/health') && !url.includes('/execute')) {
            const urlObj = new URL(url, 'http://localhost');
            const category = urlObj.searchParams.get('category') || undefined;
            const riskLevel = urlObj.searchParams.get('riskLevel') || undefined;
            const availability = urlObj.searchParams.get('availability') || undefined;

            const capabilities = capabilityRegistry.getAllCapabilities({ category, riskLevel, availability });
            return jsonResponse({ capabilities, count: capabilities.length });
          }

          // 52. GET /api/v1/capabilities/:id/health - Capability Health Status
          if (url.includes('/capabilities/') && url.endsWith('/health') && method === 'GET') {
            const parts = url.split('/');
            const capId = parts[parts.indexOf('capabilities') + 1];
            const cap = capabilityRegistry.getCapability(capId);
            if (!cap) {
              return jsonResponse({ error: `Capability ${capId} not found` }, 404);
            }
            return jsonResponse({
              capabilityId: cap.id,
              name: cap.name,
              health: cap.health,
              availability: cap.availability,
              rateLimits: cap.rateLimits,
            });
          }

          // 53. POST /api/v1/capabilities/execute - Capability Invocation Protocol (Supports SIMULATE and EXECUTE)
          if ((url === '/api/v1/capabilities/execute' || url === '/api/web/capabilities/execute') && method === 'POST') {
            const body = await getBody();
            const response = await webCapabilityClient.executeCapability(
              body.agentId || 'hermes_prime',
              body.agentName || 'Hermes Prime',
              body.capabilityId || 'web.search',
              body.operation || 'search',
              body.parameters || {},
              body.executionMode || 'EXECUTE',
              body.idempotencyKey,
              body.traceId
            );
            return jsonResponse({ response });
          }

          // 54. GET /api/v1/executions/:executionId - Execution Status Lookup
          if (url.includes('/api/v1/executions/') && method === 'GET') {
            const executionId = url.split('/')[4];
            const execution = hermesWebEngine.getExecution(executionId);
            if (!execution) {
              return jsonResponse({ error: `Execution ${executionId} not found` }, 404);
            }
            return jsonResponse({ execution });
          }

          // 55. GET /api/v1/approvals - List Pending Approvals
          if (url === '/api/v1/approvals' && method === 'GET') {
            const approvals = policyAndAuthorizationEngine.getPendingApprovals();
            return jsonResponse({ approvals, count: approvals.length });
          }

          // 56. POST /api/v1/approvals/:approvalId - Resolve High-Risk Policy Approval
          if (url.includes('/api/v1/approvals/') && method === 'POST') {
            const approvalId = url.split('/')[4];
            const body = await getBody();
            const approved = body.approved ?? true;
            const resolvedBy = body.resolvedBy || 'Human Operator';

            const approval = hermesWebEngine.resolveApproval(approvalId, approved, resolvedBy);
            if (!approval) {
              return jsonResponse({ error: `Approval ${approvalId} not found or already resolved` }, 404);
            }
            return jsonResponse({ approval, message: `Approval ${approvalId} ${approved ? 'APPROVED' : 'REJECTED'}` });
          }

          // 57. GET /api/v1/events - Event Stream
          if (url.startsWith('/api/v1/events') && method === 'GET') {
            const urlObj = new URL(url, 'http://localhost');
            const traceId = urlObj.searchParams.get('traceId') || undefined;
            const limit = parseInt(urlObj.searchParams.get('limit') || '50', 10);

            const events = hermesWebEngine.getEvents(limit, traceId);
            return jsonResponse({ events, count: events.length });
          }

          // 58. GET /api/v1/audit - Capability Execution Audit Ledger
          if (url.startsWith('/api/v1/audit') && method === 'GET') {
            const urlObj = new URL(url, 'http://localhost');
            const agentId = urlObj.searchParams.get('agentId') || undefined;
            const capabilityId = urlObj.searchParams.get('capabilityId') || undefined;
            const traceId = urlObj.searchParams.get('traceId') || undefined;
            const limit = parseInt(urlObj.searchParams.get('limit') || '50', 10);

            const logs = auditLogger.getLogs(limit, { agentId, capabilityId, traceId });
            const stats = auditLogger.getStats();
            return jsonResponse({ auditLogs: logs, stats });
          }

          // 59. GET /api/v1/web/health - Hermes Web Capability Fabric Readiness
          if ((url === '/api/v1/web/health' || url === '/api/web/health') && method === 'GET') {
            const health = hermesWebEngine.getHealth();
            return jsonResponse({ webHealth: health });
          }

          // ==================================================================
          // STAGE 8.5 — DEEP DEBUGGING, CAUSAL TRACING & GOVERNED SELF-REPAIR
          // ==================================================================

          // 60. GET /api/v1/diagnostics/causal-traces
          if (url.startsWith('/api/v1/diagnostics/causal-traces') && method === 'GET') {
            const urlObj = new URL(url, 'http://localhost');
            const traceId = urlObj.searchParams.get('traceId') || undefined;
            const traces = deepDiagnosticsEngine.getCausalTraces(traceId);
            return jsonResponse({ traces, count: traces.length });
          }

          // 61. GET /api/v1/diagnostics/snapshots
          if (url === '/api/v1/diagnostics/snapshots' && method === 'GET') {
            const snapshots = deepDiagnosticsEngine.getSnapshots();
            return jsonResponse({ snapshots, count: snapshots.length });
          }

          // 62. POST /api/v1/diagnostics/snapshots/take
          if (url === '/api/v1/diagnostics/snapshots/take' && method === 'POST') {
            const body = await getBody();
            const snapshot = deepDiagnosticsEngine.takeStateSnapshot(body.reason || 'Manual Checkpoint');
            return jsonResponse({ snapshot });
          }

          // 63. GET /api/v1/diagnostics/snapshots/diff
          if (url.startsWith('/api/v1/diagnostics/snapshots/diff') && method === 'GET') {
            const urlObj = new URL(url, 'http://localhost');
            const id1 = urlObj.searchParams.get('snapshotId1') || '';
            const id2 = urlObj.searchParams.get('snapshotId2') || '';
            const diff = deepDiagnosticsEngine.diffSnapshots(id1, id2);
            return jsonResponse({ diff });
          }

          // 64. GET /api/v1/diagnostics/replay/mission/:id
          if (url.includes('/api/v1/diagnostics/replay/mission/') && method === 'GET') {
            const missionId = url.split('/replay/mission/')[1];
            const replay = deepDiagnosticsEngine.replayMission(missionId);
            return jsonResponse({ replay });
          }

          // 65. GET /api/v1/diagnostics/replay/decision/:id
          if (url.includes('/api/v1/diagnostics/replay/decision/') && method === 'GET') {
            const decisionId = url.split('/replay/decision/')[1];
            const replay = deepDiagnosticsEngine.replayDecision(decisionId);
            return jsonResponse({ replay });
          }

          // 66. POST /api/v1/diagnostics/analyze-failure
          if (url === '/api/v1/diagnostics/analyze-failure' && method === 'POST') {
            const body = await getBody();
            const incidentId = body.incidentId || `inc_${Date.now()}`;
            const errorEnvelope = body.error || {
              code: 'GENERIC_EXECUTION_ERROR',
              message: body.message || 'Execution failed during capability execution',
              category: 'EXECUTION_ERROR',
              retryable: true,
              severity: 'MEDIUM',
              timestamp: new Date().toISOString(),
            };
            const analysis = deepDiagnosticsEngine.analyzeIncident(incidentId, errorEnvelope, body.traceId);
            return jsonResponse(analysis);
          }

          // 67. POST /api/v1/diagnostics/why
          if (url === '/api/v1/diagnostics/why' && method === 'POST') {
            const body = await getBody();
            const report = deepDiagnosticsEngine.getWhyExplanation(body.query || 'Why did Hermes do this?');
            return jsonResponse({ report });
          }

          // 68. GET /api/v1/diagnostics/incidents
          if (url === '/api/v1/diagnostics/incidents' && method === 'GET') {
            const incidents = deepDiagnosticsEngine.getIncidents();
            return jsonResponse({ incidents, count: incidents.length });
          }

          // 69. GET /api/v1/diagnostics/repairs
          if (url === '/api/v1/diagnostics/repairs' && method === 'GET') {
            const proposals = deepDiagnosticsEngine.getRepairProposals();
            return jsonResponse({ proposals, count: proposals.length });
          }

          // 70. POST /api/v1/diagnostics/repairs/:id/approve
          if (url.includes('/api/v1/diagnostics/repairs/') && url.endsWith('/approve') && method === 'POST') {
            const parts = url.split('/');
            const proposalId = parts[parts.indexOf('repairs') + 1];
            const body = await getBody();
            const proposal = deepDiagnosticsEngine.approveRepair(proposalId, body.approvedBy);
            return jsonResponse({ proposal, message: 'Proposal approved by governance.' });
          }

          // 71. POST /api/v1/diagnostics/repairs/:id/apply
          if (url.includes('/api/v1/diagnostics/repairs/') && url.endsWith('/apply') && method === 'POST') {
            const parts = url.split('/');
            const proposalId = parts[parts.indexOf('repairs') + 1];
            const proposal = deepDiagnosticsEngine.applyRepair(proposalId);
            return jsonResponse({ proposal, message: 'Self-repair successfully applied.' });
          }

          // 72. POST /api/v1/diagnostics/repairs/:id/rollback
          if (url.includes('/api/v1/diagnostics/repairs/') && url.endsWith('/rollback') && method === 'POST') {
            const parts = url.split('/');
            const proposalId = parts[parts.indexOf('repairs') + 1];
            const proposal = deepDiagnosticsEngine.rollbackRepair(proposalId);
            return jsonResponse({ proposal, message: 'Self-repair safely rolled back.' });
          }

          // 73. POST /api/v1/diagnostics/chaos
          if (url === '/api/v1/diagnostics/chaos' && method === 'POST') {
            const body = await getBody();
            const scenario = body.scenarioType || 'HERMES_WEB_OUTAGE';
            const result = deepDiagnosticsEngine.runChaosScenario(scenario);
            return jsonResponse({ chaosResult: result });
          }

          // ==================================================================
          // STAGE 9 — HERMES CHAT & COGNITIVE CONSOLE REST ENDPOINTS
          // ==================================================================

          // 74. GET /api/v1/chat/conversations
          if (url === '/api/v1/chat/conversations' && method === 'GET') {
            const conversations = chatEngine.getConversations();
            return jsonResponse({ conversations, count: conversations.length });
          }

          // 75. POST /api/v1/chat/conversations
          if (url === '/api/v1/chat/conversations' && method === 'POST') {
            const body = await getBody();
            const conversation = chatEngine.createConversation(body.title, body.context);
            return jsonResponse({ conversation });
          }

          // 76. GET /api/v1/chat/conversations/:id
          if (url.includes('/api/v1/chat/conversations/') && !url.includes('/messages') && method === 'GET') {
            const id = url.split('/conversations/')[1];
            const conversation = chatEngine.getConversation(id);
            if (!conversation) return jsonResponse({ error: 'Conversation not found' }, 404);
            return jsonResponse({ conversation });
          }

          // 77. PUT /api/v1/chat/conversations/:id
          if (url.includes('/api/v1/chat/conversations/') && !url.includes('/messages') && method === 'PUT') {
            const id = url.split('/conversations/')[1];
            const body = await getBody();
            const conversation = chatEngine.updateConversation(id, body);
            if (!conversation) return jsonResponse({ error: 'Conversation not found' }, 404);
            return jsonResponse({ conversation });
          }

          // 78. DELETE /api/v1/chat/conversations/:id
          if (url.includes('/api/v1/chat/conversations/') && !url.includes('/messages') && method === 'DELETE') {
            const id = url.split('/conversations/')[1];
            const deleted = chatEngine.deleteConversation(id);
            return jsonResponse({ success: deleted });
          }

          // 79. POST /api/v1/chat/conversations/:id/messages
          if (url.includes('/api/v1/chat/conversations/') && url.endsWith('/messages') && method === 'POST') {
            const parts = url.split('/');
            const id = parts[parts.indexOf('conversations') + 1];
            const body = await getBody();
            const userText = body.text || body.message || '';
            const result = await chatEngine.processMessage(id, userText, body.context);
            return jsonResponse(result);
          }

          // 80. POST /api/v1/chat/actions/:actionId/confirm
          if (url.includes('/api/v1/chat/actions/') && url.endsWith('/confirm') && method === 'POST') {
            const parts = url.split('/');
            const actionId = parts[parts.indexOf('actions') + 1];
            const body = await getBody();
            const approvedBy = body.approvedBy || 'Operator';
            const result = chatEngine.confirmAction(actionId, approvedBy);
            return jsonResponse(result);
          }

          // ==================================================================
          // STAGE 9 — AUTONOMOUS CAUSAL EVALUATION & CAPABILITY EVOLUTION API
          // ==================================================================

          // 81. GET /api/v1/learning/overview
          if (url === '/api/v1/learning/overview' && method === 'GET') {
            const preds = causalEvaluationEngine.getPredictions();
            const outcomes = causalEvaluationEngine.getOutcomes();
            const calibration = causalEvaluationEngine.getCalibration();
            const comps = capabilityEvolutionEngine.getAllCompositions();

            // Calculate overall precision / prediction accuracy %
            let accurateCount = 0;
            let totalEvaluated = 0;
            for (const p of preds) {
              const o = outcomes.find(out => out.predictionId === p.predictionId);
              if (o) {
                totalEvaluated++;
                // If actual duration is within 30% of expected, and actual reliability is within 15% of expected
                const durationRatio = Math.abs(o.actualDuration - p.expectedDuration) / p.expectedDuration;
                const reliabilityDiff = Math.abs(o.actualReliability - p.expectedReliability);
                if (durationRatio <= 0.35 && reliabilityDiff <= 0.20 && o.failures.length === 0) {
                  accurateCount++;
                }
              }
            }

            const accuracy = totalEvaluated > 0 ? Math.round((accurateCount / totalEvaluated) * 100) : 89;

            return jsonResponse({
              predictionsCount: preds.length,
              outcomesCount: outcomes.length,
              predictionAccuracy: accuracy,
              calibrationError: Math.round(calibration.overallCalibrationError * 100) / 100,
              capabilitiesImproved: comps.filter(c => c.status === 'AVAILABLE').length,
              activeExperimentsCount: comps.filter(c => c.status === 'SIMULATED' || c.status === 'VALIDATED').length,
              newCompositionsCount: comps.length,
              lastEvaluatedAt: new Date().toISOString()
            });
          }

          // 82. GET /api/v1/learning/evaluation/predictions
          if (url === '/api/v1/learning/evaluation/predictions' && method === 'GET') {
            return jsonResponse({ predictions: causalEvaluationEngine.getPredictions() });
          }

          // 83. POST /api/v1/learning/evaluation/predictions
          if (url === '/api/v1/learning/evaluation/predictions' && method === 'POST') {
            const body = await getBody();
            const pred = causalEvaluationEngine.createPrediction(body);
            return jsonResponse({ success: true, prediction: pred });
          }

          // 84. GET /api/v1/learning/evaluation/outcomes
          if (url === '/api/v1/learning/evaluation/outcomes' && method === 'GET') {
            const outcomes = causalEvaluationEngine.getOutcomes();
            // Enrich with causal attribution
            const enriched = outcomes.map(o => {
              const attr = causalEvaluationEngine.getAttribution(o.predictionId);
              const pred = causalEvaluationEngine.getPredictions().find(p => p.predictionId === o.predictionId);
              const temporal = causalEvaluationEngine.getTemporalObservations(o.predictionId);
              return {
                ...o,
                attribution: attr,
                prediction: pred,
                temporalObservations: temporal
              };
            });
            return jsonResponse({ outcomes: enriched });
          }

          // 85. POST /api/v1/learning/evaluation/outcomes
          if (url === '/api/v1/learning/evaluation/outcomes' && method === 'POST') {
            const body = await getBody();
            const outcome = causalEvaluationEngine.createOutcome(body);

            // Dynamically update reputation based on outcome
            const pred = causalEvaluationEngine.getPredictions().find(p => p.predictionId === outcome.predictionId);
            if (pred) {
              const isSuccess = outcome.failures.length === 0;
              const costMatches = Math.abs(outcome.actualCost - pred.expectedCost) <= 20;
              const isSecurity = outcome.actualSideEffects.some(s => s.toLowerCase().includes('security') || s.toLowerCase().includes('incident'));
              
              reputationEngine.updateReputationFromOutcome(pred.provider, {
                reliability: outcome.actualReliability,
                latency: outcome.actualDuration,
                success: isSuccess,
                costMatches,
                isSecurityIncident: isSecurity
              });
            }

            return jsonResponse({ success: true, outcome });
          }

          // 86. GET /api/v1/learning/evaluation/calibration
          if (url === '/api/v1/learning/evaluation/calibration' && method === 'GET') {
            return jsonResponse({ calibration: causalEvaluationEngine.getCalibration() });
          }

          // 87. GET /api/v1/learning/evaluation/graphs
          if (url === '/api/v1/learning/evaluation/graphs' && method === 'GET') {
            return jsonResponse({ graphs: causalEvaluationEngine.getCausalGraphs() });
          }

          // 88. GET /api/v1/learning/evaluation/records
          if (url === '/api/v1/learning/evaluation/records' && method === 'GET') {
            return jsonResponse({ records: causalEvaluationEngine.getLearningRecords() });
          }

          // 89. POST /api/v1/learning/evaluation/learning
          if (url === '/api/v1/learning/evaluation/learning' && method === 'POST') {
            const body = await getBody();
            const record = causalEvaluationEngine.distillLearning(body);
            return jsonResponse({ success: true, record });
          }

          // 90. GET /api/v1/learning/reputation/providers
          if (url === '/api/v1/learning/reputation/providers' && method === 'GET') {
            return jsonResponse({ providers: reputationEngine.getAllProviderReputations() });
          }

          // 91. GET /api/v1/learning/reputation/capabilities
          if (url === '/api/v1/learning/reputation/capabilities' && method === 'GET') {
            return jsonResponse({ capabilities: reputationEngine.getCapabilityReputations() });
          }

          // 92. POST /api/v1/learning/reputation/decay
          if (url === '/api/v1/learning/reputation/decay' && method === 'POST') {
            reputationEngine.applyDecay();
            return jsonResponse({ success: true, providers: reputationEngine.getAllProviderReputations() });
          }

          // 93. GET /api/v1/learning/evolution/compositions
          if (url === '/api/v1/learning/evolution/compositions' && method === 'GET') {
            return jsonResponse({ compositions: capabilityEvolutionEngine.getAllCompositions() });
          }

          // 94. GET /api/v1/learning/evolution/graph
          if (url === '/api/v1/learning/evolution/graph' && method === 'GET') {
            return jsonResponse({ graph: capabilityEvolutionEngine.getCapabilityGraph() });
          }

          // 95. POST /api/v1/learning/evolution/compositions
          if (url === '/api/v1/learning/evolution/compositions' && method === 'POST') {
            const body = await getBody();
            const comp = capabilityEvolutionEngine.proposeComposition(body);
            return jsonResponse({ success: true, composition: comp });
          }

          // 96. Actions on Compositions (Simulate, Validate, Promote, Restrict, Benchmark)
          if (url.includes('/api/v1/learning/evolution/compositions/') && method === 'POST') {
            const parts = url.split('/');
            const id = parts[parts.indexOf('compositions') + 1];
            const action = parts[parts.indexOf('compositions') + 2];

            if (action === 'simulate') {
              const comp = capabilityEvolutionEngine.simulateComposition(id);
              return jsonResponse({ success: true, composition: comp });
            } else if (action === 'validate') {
              const comp = capabilityEvolutionEngine.validateComposition(id);
              return jsonResponse({ success: true, composition: comp });
            } else if (action === 'promote') {
              const body = await getBody();
              const comp = capabilityEvolutionEngine.promoteComposition(id, body.authorizedBy || 'Operator');
              return jsonResponse({ success: true, composition: comp });
            } else if (action === 'restrict') {
              const body = await getBody();
              const comp = capabilityEvolutionEngine.restrictComposition(id, body.reason || 'Manual restriction');
              return jsonResponse({ success: true, composition: comp });
            } else if (action === 'benchmark') {
              const benchmark = capabilityEvolutionEngine.runBenchmark(id);
              return jsonResponse({ success: true, benchmark });
            }
          }

          // ==========================================
          // STAGE 10 — SYMBIOSIS & HYPER-EVOLUTION API
          // ==========================================

          // 97. GET /api/v1/symbiosis/overview
          if (url === '/api/v1/symbiosis/overview' && method === 'GET') {
            return jsonResponse({ overview: symbioticSynthesisEngine.getOverview() });
          }

          // 98. GET /api/v1/symbiosis/hives
          if (url === '/api/v1/symbiosis/hives' && method === 'GET') {
            return jsonResponse({ hives: symbioticSynthesisEngine.getHives() });
          }

          // 99. GET /api/v1/symbiosis/mutations
          if (url === '/api/v1/symbiosis/mutations' && method === 'GET') {
            return jsonResponse({ mutations: symbioticSynthesisEngine.getMutations() });
          }

          // 100. POST /api/v1/symbiosis/mutations
          if (url === '/api/v1/symbiosis/mutations' && method === 'POST') {
            const body = await getBody();
            const record = symbioticSynthesisEngine.proposeMutation(body);
            return jsonResponse({ success: true, mutation: record });
          }

          // 101. Mutation action routes (sandbox, synthesize, restrict)
          if (url.includes('/api/v1/symbiosis/mutations/') && method === 'POST') {
            const parts = url.split('/');
            const id = parts[parts.indexOf('mutations') + 1];
            const action = parts[parts.indexOf('mutations') + 2];

            if (action === 'sandbox') {
              const res = symbioticSynthesisEngine.simulateMutationSandbox(id);
              return jsonResponse({ success: !!res, mutation: res });
            } else if (action === 'synthesize') {
              const body = await getBody();
              const res = symbioticSynthesisEngine.compileAndDeployMutation(id, body.authorizedBy);
              return jsonResponse({ success: !!res, mutation: res });
            } else if (action === 'restrict') {
              const body = await getBody();
              const res = symbioticSynthesisEngine.restrictMutation(id, body.reason || 'Emergency operator veto');
              return jsonResponse({ success: !!res, mutation: res });
            }
          }

          // 102. GET /api/v1/symbiosis/sessions
          if (url === '/api/v1/symbiosis/sessions' && method === 'GET') {
            return jsonResponse({ sessions: symbioticSynthesisEngine.getSessions() });
          }

          // 103. POST /api/v1/symbiosis/sessions
          if (url === '/api/v1/symbiosis/sessions' && method === 'POST') {
            const body = await getBody();
            const sess = symbioticSynthesisEngine.initiateCollaborativeSession(
              body.title || 'Dynamic Consensus Sync',
              body.participantHives || ['Hive Prime'],
              body.objective || 'Coordinate federated knowledge',
              body.computeAllocated || 1000
            );
            return jsonResponse({ success: true, session: sess });
          }

          // 104. POST /api/v1/symbiosis/sessions/:id/collaborate
          if (url.includes('/api/v1/symbiosis/sessions/') && url.endsWith('/collaborate') && method === 'POST') {
            const parts = url.split('/');
            const id = parts[parts.indexOf('sessions') + 1];
            const sess = symbioticSynthesisEngine.advanceCollaborativeSession(id);
            return jsonResponse({ success: !!sess, session: sess });
          }

          // 105. GET /api/v1/symbiosis/treasury
          if (url === '/api/v1/symbiosis/treasury' && method === 'GET') {
            return jsonResponse({ ledger: symbioticSynthesisEngine.getTreasuryLedger() });
          }

          // 106. POST /api/v1/symbiosis/treasury/redistribute
          if (url === '/api/v1/symbiosis/treasury/redistribute' && method === 'POST') {
            const body = await getBody();
            const ok = symbioticSynthesisEngine.reallocateTokens(
              body.fromHiveId,
              body.toHiveId,
              body.amount,
              body.purpose || 'Redistribution'
            );
            return jsonResponse({ success: ok, ledger: symbioticSynthesisEngine.getTreasuryLedger(), hives: symbioticSynthesisEngine.getHives() });
          }

          // 107. GET /api/v1/symbiosis/hologram
          if (url === '/api/v1/symbiosis/hologram' && method === 'GET') {
            return jsonResponse({ hologram: holographicMemoryFusion.getHologram() });
          }

          // 108. POST /api/v1/symbiosis/hologram/nodes
          if (url === '/api/v1/symbiosis/hologram/nodes' && method === 'POST') {
            const body = await getBody();
            const node = holographicMemoryFusion.recordInsightNode(
              body.label,
              body.dimensionVector,
              body.associatedInsight,
              body.sourceHive,
              body.importanceScore,
              body.connections || []
            );
            return jsonResponse({ success: true, node });
          }

          // 109. POST /api/v1/symbiosis/hologram/connect
          if (url === '/api/v1/symbiosis/hologram/connect' && method === 'POST') {
            const body = await getBody();
            const ok = holographicMemoryFusion.connectNodes(body.nodeId1, body.nodeId2);
            return jsonResponse({ success: ok, hologram: holographicMemoryFusion.getHologram() });
          }


          // Fallthrough to next if route unhandled
          return next();
        } catch (err) {
          console.error('[ApiMiddleware] Error handling API request:', err);
          return jsonResponse({ error: 'Internal Server Error', message: err instanceof Error ? err.message : String(err) }, 500);
        }
      });
    },
  };
}
