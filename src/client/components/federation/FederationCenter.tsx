import React, { useEffect, useState } from 'react';
import {
  Globe2,
  Building2,
  FileCheck2,
  Coins,
  Lightbulb,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import {
  HiveIdentity,
  MissionContract,
  TrustRecord,
  ResourceMarketListing,
  OrganizationDivision,
  StrategicObjective,
  OpportunityProposal,
  Project,
  HiveOSStatus,
} from '../../../shared/types';

export const FederationCenter: React.FC = () => {
  const [hives, setHives] = useState<HiveIdentity[]>([]);
  const [contracts, setContracts] = useState<MissionContract[]>([]);
  const [trustRecords, setTrustRecords] = useState<TrustRecord[]>([]);
  const [marketListings, setMarketListings] = useState<ResourceMarketListing[]>([]);
  const [divisions, setDivisions] = useState<OrganizationDivision[]>([]);
  const [objectives, setObjectives] = useState<StrategicObjective[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityProposal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [osStatus, setOsStatus] = useState<HiveOSStatus | null>(null);

  const [activeTab, setActiveTab] = useState<'hives' | 'contracts' | 'economy' | 'organization' | 'projects'>('hives');

  const fetchFederationData = async () => {
    try {
      const [hRes, cRes, tRes, mRes, dRes, oRes, oppRes, pRes, osRes] = await Promise.all([
        fetch('/api/federation/hives').then(r => r.json()).catch(() => ({ hives: [] })),
        fetch('/api/federation/contracts').then(r => r.json()).catch(() => ({ contracts: [] })),
        fetch('/api/federation/trust').then(r => r.json()).catch(() => ({ trustRecords: [] })),
        fetch('/api/economy/market').then(r => r.json()).catch(() => ({ listings: [] })),
        fetch('/api/organization/divisions').then(r => r.json()).catch(() => ({ divisions: [] })),
        fetch('/api/strategy/objectives').then(r => r.json()).catch(() => ({ objectives: [] })),
        fetch('/api/innovation/opportunities').then(r => r.json()).catch(() => ({ proposals: [] })),
        fetch('/api/projects').then(r => r.json()).catch(() => ({ projects: [] })),
        fetch('/api/os/status').then(r => r.json()).catch(() => ({ status: null })),
      ]);

      if (hRes && Array.isArray(hRes.hives)) {
        const mappedHives = hRes.hives.map((record: any): HiveIdentity => {
          if (record && record.hiveId && record.resourceCapacity) {
            return record as HiveIdentity;
          }
          const identity = (record && record.identity) || {};
          return {
            hiveId: identity.hiveId || (record && record.hiveId) || '',
            name: identity.name || (record && record.name) || 'Unknown Hive',
            description: identity.description || (record && record.description) || 'No description available',
            version: identity.version || (record && record.version) || '1.0.0',
            capabilities: Array.isArray(record?.capabilities) ? record.capabilities : (Array.isArray(identity.capabilities) ? identity.capabilities : (Array.isArray(identity.capabilityProfile) ? identity.capabilityProfile : [])),
            specializations: Array.isArray(identity.capabilityProfile) ? identity.capabilityProfile : [],
            governanceProfile: identity.governanceFingerprint || 'Unknown',
            resourceCapacity: {
              maxTokensPerMin: record?.resourceCapacity?.maxTokensPerMin || 10000000,
              maxParallelMissions: record?.resourceCapacity?.maxParallelMissions || 10,
              availableAgents: record?.resourceCapacity?.availableAgents || 5,
            },
            reputation: record?.reputationScore !== undefined ? record.reputationScore : (record?.reputation !== undefined ? record.reputation : 100),
            status: (() => {
              if (!record) return 'ONLINE';
              const s = String(record.state || record.status || 'ONLINE').toUpperCase();
              if (s === 'ACTIVE') return 'ONLINE';
              if (['INITIALIZING', 'ONLINE', 'DEGRADED', 'BUSY', 'PAUSED', 'QUARANTINED', 'OFFLINE', 'RETIRED'].includes(s)) {
                return s as any;
              }
              return 'ONLINE';
            })(),
            createdAt: identity.createdAt || record?.createdAt || new Date().toISOString(),
            updatedAt: record?.lastSeenHeartbeat || record?.updatedAt || new Date().toISOString(),
          };
        });
        setHives(mappedHives);
      } else {
        setHives([]);
      }

      if (cRes && Array.isArray(cRes.contracts)) {
        setContracts(cRes.contracts);
      } else {
        setContracts([]);
      }

      if (tRes && Array.isArray(tRes.trustRecords)) {
        setTrustRecords(tRes.trustRecords);
      } else {
        setTrustRecords([]);
      }

      if (mRes && Array.isArray(mRes.listings)) {
        setMarketListings(mRes.listings);
      } else {
        setMarketListings([]);
      }

      if (dRes && Array.isArray(dRes.divisions)) {
        setDivisions(dRes.divisions);
      } else {
        setDivisions([]);
      }

      if (oRes && Array.isArray(oRes.objectives)) {
        setObjectives(oRes.objectives);
      } else {
        setObjectives([]);
      }

      if (oppRes && Array.isArray(oppRes.proposals)) {
        setOpportunities(oppRes.proposals);
      } else {
        setOpportunities([]);
      }

      if (pRes && Array.isArray(pRes.projects)) {
        setProjects(pRes.projects);
      } else {
        setProjects([]);
      }

      if (osRes && osRes.status) {
        setOsStatus(osRes.status);
      } else {
        setOsStatus(null);
      }
    } catch (err) {
      console.error('[FederationCenter] Error loading federation data:', err);
    }
  };

  useEffect(() => {
    fetchFederationData();
    const interval = setInterval(fetchFederationData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleConvertOpportunity = async (oppId: string) => {
    try {
      await fetch('/api/projects/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: oppId }),
      });
      await fetchFederationData();
    } catch (err) {
      console.error('[FederationCenter] Error converting opportunity:', err);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pr-2">
      {/* OS Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 rounded-xl border border-emerald-500/20 shadow-lg gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Globe2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              HIVE OPERATING SYSTEM & FEDERATION CENTER
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                Stage 4 Digital Organisation
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Cross-Hive federation contracts, computational resource market, digital divisions, and autonomous project factory.
            </p>
          </div>
        </div>

        {/* System Health Indicators */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Mode: <strong className="text-white">{osStatus?.operatingMode || 'SUPERVISED'}</strong></span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Health: <strong className="text-emerald-300">{osStatus?.systemHealth || 99.4}%</strong></span>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('hives')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'hives' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe2 className="w-4 h-4" /> Federated Hives ({hives.length})
        </button>
        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'contracts' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" /> Mission Contracts ({contracts.length})
        </button>
        <button
          onClick={() => setActiveTab('economy')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'economy' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className="w-4 h-4" /> Resource Market ({marketListings.length})
        </button>
        <button
          onClick={() => setActiveTab('organization')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'organization' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Digital Divisions ({divisions.length})
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'projects' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lightbulb className="w-4 h-4" /> Innovation & Projects ({projects.length})
        </button>
      </div>

      {/* Tab 1: Federated Hives */}
      {activeTab === 'hives' && (
        <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-emerald-400" />
              Connected Federated Hives ({hives.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Specialized autonomous swarm clusters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(hives || []).map((h) => {
              if (!h) return null;
              const trust = (trustRecords || []).find(t => t && t.hiveId === h.hiveId);
              return (
                <div key={h.hiveId} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {h.status || 'ONLINE'}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      Trust: {trust?.trustLevel || 'HIGH_TRUST'} ({trust?.trustScore || h.reputation || 100}/100)
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{h.name || 'Unknown Hive'}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{h.description || 'No description available'}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(h.capabilities || []).map((cap, i) => (
                      <span key={i} className="px-2 py-0.5 text-[9px] font-mono bg-slate-950 text-slate-300 rounded border border-slate-800">
                        {cap}
                      </span>
                    ))}
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded text-[10px] font-mono text-slate-400 flex justify-between">
                    <span>Capacity: {(h.resourceCapacity?.maxTokensPerMin || 10000000).toLocaleString()} tokens/min</span>
                    <span>Parallel Missions: {h.resourceCapacity?.maxParallelMissions || 10}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Mission Contracts */}
      {activeTab === 'contracts' && (
        <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-cyan-400" />
              Cross-Hive Federated Mission Contracts ({contracts.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Formal execution contracts between Hives</span>
          </div>

          <div className="space-y-3">
            {(contracts || []).map((c) => {
              if (!c) return null;
              return (
                <div key={c.contractId} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {c.status || 'ACTIVE'}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{c.objective || 'Objective'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">ID: {c.contractId || ''}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Parties:</span>
                      <p className="text-[11px] text-slate-300">Requesting: <span className="text-cyan-300 font-mono">{c.requestingHive || ''}</span></p>
                      <p className="text-[11px] text-slate-300">Executing: <span className="text-emerald-300 font-mono">{c.executingHive || ''}</span></p>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Budget & Limits:</span>
                      <p className="text-[11px] text-slate-300">Tokens: <span className="text-amber-300 font-mono">{c.resourceBudget?.maxTokens?.toLocaleString() || '0'}</span></p>
                      <p className="text-[11px] text-slate-300">Risk Level: <span className="text-rose-300 font-mono">{c.riskLevel || 'LOW'}</span></p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Resource Market */}
      {activeTab === 'economy' && (
        <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              Computational Resource Market ({marketListings.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Token budget & agent capacity trading</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(marketListings || []).map((l) => {
              if (!l) return null;
              return (
                <div key={l.listingId} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      {l.resourceType || 'COMPUTE'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{l.estimatedLatencyMs || 0}ms latency</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{l.hiveName || 'Unknown Hive'}</h4>
                  <div className="bg-slate-950 p-2.5 rounded text-[11px] font-mono text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Available:</span>
                      <span>{(l.availableQuantity || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Unit Cost:</span>
                      <span className="text-amber-300">{l.unitCostTokens || 0} tokens</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Digital Divisions & Strategic Objectives */}
      {activeTab === 'organization' && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Building2 className="w-4 h-4 text-indigo-400" /> Digital Divisions ({divisions.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(divisions || []).map((d) => {
                if (!d) return null;
                return (
                  <div key={d.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-100">{d.name || 'Division'}</h4>
                    <p className="text-[11px] text-slate-400">{d.description || ''}</p>
                    <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-400 flex justify-between">
                      <span>Lead: {d.leadAgentId || 'None'}</span>
                      <span>Tokens: {(d.budgetTokens || 0).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Strategic Objectives ({objectives.length})
            </h3>

            <div className="space-y-3">
              {(objectives || []).map((o) => {
                if (!o) return null;
                return (
                  <div key={o.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-200">{o.title || 'Objective'}</h4>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {o.status || 'ACTIVE'} ({o.progressPct || 0}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{o.description || ''}</p>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div className="bg-cyan-500 h-full rounded-full transition-all" style={{ width: `${o.progressPct || 0}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Innovation Opportunities & Active Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Lightbulb className="w-4 h-4 text-amber-400" /> Autonomous Innovation Opportunities ({opportunities.length})
            </h3>

            <div className="space-y-3">
              {(opportunities || []).map((opp) => {
                if (!opp) return null;
                return (
                  <div key={opp.proposalId} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {opp.status || 'PROPOSED'}
                        </span>
                        <h4 className="text-xs font-bold text-slate-200">{opp.title || 'Opportunity'}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400">{opp.description || ''}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Evidence: {opp.evidence || ''}</p>
                    </div>

                    {opp.status === 'PROPOSED' && (
                      <button
                        onClick={() => handleConvertOpportunity(opp.proposalId)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                      >
                        Convert to Project <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Zap className="w-4 h-4 text-emerald-400" /> Active Autonomous Software Projects ({projects.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(projects || []).map((p) => {
                if (!p) return null;
                return (
                  <div key={p.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {p.status || 'ACTIVE'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Missions: {p.missionsCount || 0}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200">{p.title || 'Project'}</h4>
                    <p className="text-[11px] text-slate-400">{p.description || ''}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
