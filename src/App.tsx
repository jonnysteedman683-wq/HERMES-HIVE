import React, { useState, useRef } from 'react';
import { useHiveData } from './client/hooks/useHiveData';
import { useKeyboardShortcuts } from './client/hooks/useKeyboardShortcuts';
import { Sidebar, TabType } from './client/components/layout/Sidebar';
import { Header } from './client/components/layout/Header';
import { KeyboardShortcutsModal } from './client/components/modals/KeyboardShortcutsModal';
import { HiveDashboard } from './client/components/dashboard/HiveDashboard';
import { HermesChatConsole } from './client/components/hermes/HermesChatConsole';
import { AskHermesFloatingWidget } from './client/components/hermes/AskHermesFloatingWidget';
import { MissionList } from './client/components/missions/MissionList';
import { SwarmTopology } from './client/components/swarm/SwarmTopology';
import { AgentInspector } from './client/components/swarm/AgentInspector';
import { MemoryExplorer } from './client/components/memory/MemoryExplorer';
import { EventStream } from './client/components/events/EventStream';
import { ToolConsole } from './client/components/tools/ToolConsole';
import { DiagnosticsDashboard } from './client/components/diagnostics/DiagnosticsDashboard';
import { SettingsPanel } from './client/components/settings/SettingsPanel';
import { GovernanceConsole } from './client/components/governance/GovernanceConsole';
import { CognitionCenter } from './client/components/cognition/CognitionCenter';
import { GoalHierarchyView } from './client/components/goals/GoalHierarchyView';
import { FederationCenter } from './client/components/federation/FederationCenter';
import { SelfModelCenter } from './client/components/selfmodel/SelfModelCenter';
import { EvolutionCenter } from './client/components/evolution/EvolutionCenter';
import { EvolutionObservatory } from './client/components/collective/EvolutionObservatory';
import { HermesWebConsole } from './client/components/web/HermesWebConsole';
import { SuprimeSwarmView } from './client/components/suprime/SuprimeSwarmView';
import { BackendsView } from './client/components/backends/BackendsView';
import { SwarmMonitor } from './client/components/swarm/SwarmMonitor';
import { HiveAmbience } from './client/components/layout/HiveAmbience';
import { HiveThemeProvider } from './client/theme/HiveTheme';
import { Agent } from './shared/types';

export default function App() {
  return (
    <HiveThemeProvider>
      <HiveApp />
    </HiveThemeProvider>
  );
}

function HiveApp() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [queuedChatPrompt, setQueuedChatPrompt] = useState<string>('');
  const [queuedChatContext, setQueuedChatContext] = useState<string>('');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const commandInputRef = useRef<HTMLInputElement>(null);

  const {
    agents,
    missions,
    events,
    decisions,
    memoryRecords,
    diagnostics,
    connected,
    refresh,
    sendHermesCommand,
    triggerDemoScenario,
    applyAgentAction,
    applyBulkAgentAction,
  } = useHiveData();

  useKeyboardShortcuts({
    onNavigateTab: (tab) => setActiveTab(tab),
    onToggleShortcuts: () => setIsShortcutsOpen((prev) => !prev),
    onFocusCommandInput: () => commandInputRef.current?.focus(),
    onTriggerDemo: triggerDemoScenario,
    onRefreshData: refresh,
    onCloseModals: () => {
      setIsShortcutsOpen(false);
      setSelectedAgent(null);
      setSelectedAgents([]);
    },
  });

  const activeAgentsCount = agents.filter((a) => a.status === 'working').length;
  const activeMissionsCount = missions.filter((m) => m.status === 'in_progress').length;
  const hiveHealthPct = diagnostics?.hiveHealthPct || 98;

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    if (!selectedAgents.some((a) => a.id === agent.id)) {
      setSelectedAgents([agent]);
    }
  };

  const handleSelectAgents = (agentsList: Agent[]) => {
    setSelectedAgents(agentsList);
    if (agentsList.length > 0) {
      setSelectedAgent(agentsList[0]);
    } else {
      setSelectedAgent(null);
    }
  };

  const handleAskHermesFromWidget = (query: string, contextTitle: string) => {
    setQueuedChatPrompt(query);
    setQueuedChatContext(contextTitle);
    setActiveTab('hermes');
  };

  const handleApplyAgentAction = async (
    agentId: string,
    action: 'pause' | 'resume' | 'terminate' | 'restart'
  ) => {
    try {
      await applyAgentAction(agentId, action);
    } catch (err) {
      // applyAgentAction re-throws after logging; this handler is invoked
      // fire-and-forget from an onClick, so swallow here or the rejection
      // becomes an unhandled rejection.
      console.error(`[App] Agent action ${action} failed:`, err);
      return;
    }
    if (selectedAgent && selectedAgent.id === agentId) {
      const updated = agents.find((a) => a.id === agentId);
      if (updated) setSelectedAgent(updated);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden antialiased select-none relative">
      <HiveAmbience />
      <div className="relative z-10 flex flex-1 min-w-0 h-full overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAgentsCount={activeAgentsCount}
        activeMissionsCount={activeMissionsCount}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          connected={connected}
          hiveHealthPct={hiveHealthPct}
          onSendObjective={sendHermesCommand}
          onTriggerDemo={triggerDemoScenario}
          onToggleShortcuts={() => setIsShortcutsOpen((prev) => !prev)}
          commandInputRef={commandInputRef}
        />

        <main className="flex-1 p-6 overflow-hidden bg-transparent relative">
          {activeTab === 'dashboard' && (
            <HiveDashboard
              agents={agents}
              missions={missions}
              events={events}
              diagnostics={diagnostics}
              selectedAgents={selectedAgents}
              onSelectAgent={handleSelectAgent}
              onSelectAgents={handleSelectAgents}
              onSendObjective={sendHermesCommand}
              onTriggerDemo={triggerDemoScenario}
            />
          )}

          {activeTab === 'hermes' && (
            <HermesChatConsole
              initialContext={{
                pageTitle: queuedChatContext || 'Hermes Executive Control',
                activeTab,
              }}
              initialPrompt={queuedChatPrompt}
              onNavigateTab={(tab) => setActiveTab(tab as TabType)}
              onTriggerDemo={triggerDemoScenario}
            />
          )}

          {activeTab === 'web' && <HermesWebConsole />}

          {activeTab === 'selfmodel' && <SelfModelCenter />}

          {activeTab === 'collective' && <EvolutionObservatory />}

          {activeTab === 'evolution' && <EvolutionCenter />}

          {activeTab === 'federation' && <FederationCenter />}

          {activeTab === 'goals' && <GoalHierarchyView />}

          {activeTab === 'governance' && <GovernanceConsole />}

          {activeTab === 'cognition' && <CognitionCenter />}

          {activeTab === 'missions' && <MissionList missions={missions} />}

          {activeTab === 'swarm' && (
            <div className="h-full flex flex-col gap-6">
              <SwarmTopology
                agents={agents}
                selectedAgents={selectedAgents}
                onSelectAgent={handleSelectAgent}
                onSelectAgents={handleSelectAgents}
              />
            </div>
          )}

          {activeTab === 'suprime' && <SuprimeSwarmView />}

          {activeTab === 'backends' && <BackendsView />}

          {activeTab === 'swarm-monitor' && <SwarmMonitor />}

          {activeTab === 'memory' && (
            <MemoryExplorer records={memoryRecords} onRefresh={refresh} />
          )}

          {activeTab === 'events' && <EventStream events={events} />}

          {activeTab === 'tools' && <ToolConsole />}

          {activeTab === 'diagnostics' && (
            <DiagnosticsDashboard metrics={diagnostics} onRefresh={refresh} />
          )}

          {activeTab === 'settings' && (
            <SettingsPanel onTriggerDemo={triggerDemoScenario} />
          )}
        </main>
      </div>
      </div>

      <AskHermesFloatingWidget
        activeTab={activeTab}
        onAskHermes={handleAskHermesFromWidget}
      />

      <AgentInspector
        agent={selectedAgent}
        agents={agents}
        selectedAgents={selectedAgents}
        onClose={() => {
          setSelectedAgent(null);
          setSelectedAgents([]);
        }}
        onApplyAction={handleApplyAgentAction}
        onApplyBulkAction={applyBulkAgentAction}
        onSelectAgents={handleSelectAgents}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onFocusCommandInput={() => commandInputRef.current?.focus()}
        onTriggerDemo={triggerDemoScenario}
        onRefreshData={refresh}
      />
    </div>
  );
}
