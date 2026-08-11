import { IncidentRecord, ErrorCategory } from '../../shared/types';

class IncidentMemoryEngine {
  private incidents = new Map<string, IncidentRecord>();

  constructor() {
    // Seed initial incident record for reference
    const initialIncident: IncidentRecord = {
      incidentId: 'inc_001',
      fingerprint: 'fp_TIMEOUT_API_HERMES_WEB_EXEC',
      title: 'Hermes Web Bridge Execution Timeout',
      category: 'TIMEOUT',
      severity: 'MEDIUM',
      status: 'REPAIRED',
      symptoms: ['SLA timeout during web search execution', 'Task queue latency spike'],
      timeline: [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), event: 'Capability request dispatched' },
        { timestamp: new Date(Date.now() - 3595000).toISOString(), event: 'Timeout SLA limit 5000ms reached' },
        { timestamp: new Date(Date.now() - 3590000).toISOString(), event: 'RootCauseAnalysisEngine generated RCA report' },
        { timestamp: new Date(Date.now() - 3580000).toISOString(), event: 'Governed self-repair proposal approved & applied' },
      ],
      resolutionSummary: 'Applied timeout reconfiguration to 12000ms with retry backoff.',
      lessonsLearned: ['External web search providers exhibit latency variance during peak load.'],
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      resolvedAt: new Date(Date.now() - 3580000).toISOString(),
    };
    this.incidents.set(initialIncident.incidentId, initialIncident);
  }

  public recordIncident(incident: IncidentRecord) {
    this.incidents.set(incident.incidentId, incident);
  }

  public getIncident(incidentId: string): IncidentRecord | undefined {
    return this.incidents.get(incidentId);
  }

  public getAllIncidents(): IncidentRecord[] {
    return Array.from(this.incidents.values());
  }

  public findByFingerprint(fingerprint: string): IncidentRecord[] {
    return this.getAllIncidents().filter((inc) => inc.fingerprint === fingerprint);
  }
}

export const incidentMemoryEngine = new IncidentMemoryEngine();
