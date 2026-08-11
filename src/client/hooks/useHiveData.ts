import { useEffect, useState, useCallback } from 'react';
import { Agent, DiagnosticsMetrics, HermesDecision, HiveEvent, MemoryRecord, Mission } from '../../shared/types';

export function useHiveData() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [events, setEvents] = useState<HiveEvent[]>([]);
  const [decisions, setDecisions] = useState<HermesDecision[]>([]);
  const [memoryRecords, setMemoryRecords] = useState<MemoryRecord[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, missionsRes, eventsRes, decisionsRes, memoryRes, diagRes] = await Promise.all([
        fetch('/api/agents').then((r) => r.json()).catch(() => ({ agents: [] })),
        fetch('/api/missions').then((r) => r.json()).catch(() => ({ missions: [] })),
        fetch('/api/events?limit=100').then((r) => r.json()).catch(() => ({ events: [] })),
        fetch('/api/hermes/decisions').then((r) => r.json()).catch(() => ({ decisions: [] })),
        fetch('/api/memory').then((r) => r.json()).catch(() => ({ records: [] })),
        fetch('/api/diagnostics').then((r) => r.json()).catch(() => ({ metrics: null })),
      ]);

      if (agentsRes.agents) setAgents(agentsRes.agents);
      if (missionsRes.missions) setMissions(missionsRes.missions);
      if (eventsRes.events) setEvents(eventsRes.events);
      if (decisionsRes.decisions) setDecisions(decisionsRes.decisions);
      if (memoryRes.records) setMemoryRecords(memoryRes.records);
      if (diagRes.metrics) setDiagnostics(diagRes.metrics);
      setLoading(false);
    } catch (err) {
      console.error('[useHiveData] Error fetching initial data:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Setup SSE connection
    const eventSource = new EventSource('/api/events/stream');

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (e) => {
      try {
        const event: HiveEvent = JSON.parse(e.data);
        if (event.type === 'PING') return;

        setEvents((prev) => [event, ...prev].slice(0, 200));

        // Refetch structured states on important state changes
        if (
          event.type === 'MISSION_CREATED' ||
          event.type === 'MISSION_UPDATED' ||
          event.type === 'MISSION_COMPLETED' ||
          event.type === 'MISSION_FAILED' ||
          event.type === 'TASK_ASSIGNMENT' ||
          event.type === 'TASK_RESULT' ||
          event.type === 'TASK_FAILURE' ||
          event.type === 'AGENT_CREATED' ||
          event.type === 'HERMES_DECISION' ||
          event.type === 'HEALING_ACTION'
        ) {
          fetchData();
        }
      } catch (err) {
        console.error('[useHiveData] Error parsing SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    // Backup polling every 4 seconds in case SSE disconnects
    const pollInterval = setInterval(() => {
      fetchData();
    }, 4000);

    return () => {
      eventSource.close();
      clearInterval(pollInterval);
    };
  }, [fetchData]);

  const sendHermesCommand = async (command: string) => {
    try {
      const res = await fetch('/api/hermes/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      await fetchData();
      return data;
    } catch (err) {
      console.error('[useHiveData] Error sending Hermes command:', err);
      throw err;
    }
  };

  const triggerDemoScenario = async (scenario: string) => {
    try {
      const res = await fetch('/api/demo/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      const data = await res.json();
      await fetchData();
      return data;
    } catch (err) {
      console.error('[useHiveData] Error triggering demo scenario:', err);
      throw err;
    }
  };

  const applyAgentAction = async (agentId: string, action: 'pause' | 'resume' | 'terminate' | 'restart') => {
    try {
      const res = await fetch(`/api/agents/${agentId}/${action}`, {
        method: 'POST',
      });
      const data = await res.json();
      await fetchData();
      return data;
    } catch (err) {
      console.error(`[useHiveData] Error applying agent action ${action}:`, err);
      throw err;
    }
  };

  return {
    agents,
    missions,
    events,
    decisions,
    memoryRecords,
    diagnostics,
    loading,
    connected,
    refresh: fetchData,
    sendHermesCommand,
    triggerDemoScenario,
    applyAgentAction,
  };
}
