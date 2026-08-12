import React, { useState } from 'react';
import { formatTime } from '../../utils/format';
import { usePolling } from '../../hooks/usePolling';
import {
  Globe,
  ShieldCheck,
  ShieldAlert,
  Play,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  FileText,
  Search,
  Zap,
  Lock,
  RefreshCw,
  Terminal,
  Cpu,
  AlertTriangle,
  Send,
} from 'lucide-react';
import {
  CapabilityDescriptor,
  CapabilityResponse,
  CapabilityApprovalRequest,
  HermesWebAuditLog,
  CapabilityEventEnvelope,
} from '../../../shared/types';

export const HermesWebConsole: React.FC = () => {
  const [capabilities, setCapabilities] = useState<CapabilityDescriptor[]>([]);
  const [approvals, setApprovals] = useState<CapabilityApprovalRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<HermesWebAuditLog[]>([]);
  const [events, setEvents] = useState<CapabilityEventEnvelope[]>([]);
  const [webHealth, setWebHealth] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Tab within Web Console
  const [subTab, setSubTab] = useState<'capabilities' | 'approvals' | 'audit' | 'events'>('capabilities');

  // Selected Capability for Execution / Simulation
  const [selectedCap, setSelectedCap] = useState<CapabilityDescriptor | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [paramInput, setParamInput] = useState<string>('{\n  "query": "Hermes Hive Swarm Protocols"\n}');
  const [executionMode, setExecutionMode] = useState<'SIMULATE' | 'EXECUTE'>('SIMULATE');
  const [executing, setExecuting] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<CapabilityResponse | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [capRes, apprRes, auditRes, evtRes, healthRes] = await Promise.all([
        fetch('/api/v1/capabilities').then((r) => r.json()),
        fetch('/api/v1/approvals').then((r) => r.json()),
        fetch('/api/v1/audit').then((r) => r.json()),
        fetch('/api/v1/events').then((r) => r.json()),
        fetch('/api/v1/web/health').then((r) => r.json()),
      ]);

      if (capRes.capabilities) {
        setCapabilities(capRes.capabilities);
        if (capRes.capabilities.length > 0 && !selectedCap) {
          setSelectedCap(capRes.capabilities[0]);
          setSelectedOperation(capRes.capabilities[0].operations[0] || '');
        }
      }

      if (apprRes.approvals) setApprovals(apprRes.approvals);
      if (auditRes.auditLogs) setAuditLogs(auditRes.auditLogs);
      if (evtRes.events) setEvents(evtRes.events);
      if (healthRes.webHealth) setWebHealth(healthRes.webHealth);
    } catch (err) {
      console.error('Failed to fetch Hermes Web capability data:', err);
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchData, 5000);

  const handleSelectCapability = (cap: CapabilityDescriptor) => {
    setSelectedCap(cap);
    setSelectedOperation(cap.operations[0] || '');
    if (cap.id === 'web.search') {
      setParamInput('{\n  "query": "Hermes Hive Swarm Protocols",\n  "maxResults": 5\n}');
    } else if (cap.id === 'web.http_request') {
      setParamInput('{\n  "url": "https://api.hermes.internal/v1/health",\n  "method": "GET"\n}');
    } else if (cap.id === 'web.repository_read') {
      setParamInput('{\n  "filePath": "package.json"\n}');
    } else if (cap.id === 'web.repository_write') {
      setParamInput('{\n  "filePath": "src/shared/version.ts",\n  "content": "export const VERSION = \\"2.0.0\\";",\n  "commitMessage": "feat(version): update protocol version"\n}');
    } else if (cap.id === 'web.database_query') {
      setParamInput('{\n  "query": "SELECT * FROM hive_agents WHERE status = \'active\'"\n}');
    } else if (cap.id === 'web.saas_connector') {
      setParamInput('{\n  "serviceName": "GitHub",\n  "action": "sync_issue",\n  "payload": { "issueId": 102, "status": "resolved" }\n}');
    } else {
      setParamInput('{\n  "command": "ls -la /src"\n}');
    }
  };

  const handleRunCapability = async () => {
    if (!selectedCap) return;
    setExecuting(true);
    setLastResponse(null);

    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(paramInput);
      } catch {
        alert('Invalid JSON in parameters field');
        setExecuting(false);
        return;
      }

      const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const res = await fetch('/api/v1/capabilities/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'hermes_prime_executive',
          agentName: 'Hermes Prime',
          capabilityId: selectedCap.id,
          operation: selectedOperation,
          parameters: parsedParams,
          executionMode,
          traceId,
        }),
      }).then((r) => r.json());

      if (res.response) {
        setLastResponse(res.response);
      }
      fetchData();
    } catch (err) {
      console.error('Capability execution error:', err);
    } finally {
      setExecuting(false);
    }
  };

  const handleResolveApproval = async (approvalId: string, approved: boolean) => {
    try {
      await fetch(`/api/v1/approvals/${approvalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved,
          resolvedBy: 'Human Executive Operator',
        }),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to resolve approval:', err);
    }
  };

  const filteredCaps = capabilities.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase()) || c.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || c.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LOW RISK</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">MED RISK</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">HIGH RISK</span>;
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">CRITICAL RISK</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300">{risk}</span>;
    }
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-hidden">
      {/* Top Header & Status Overview Bar */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Globe className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">HERMES WEB</h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-semibold tracking-wider">
                CAPABILITY FABRIC PROTOCOL v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Governed external connectivity, tool execution, policy authorization & distributed verification engine.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Capabilities Registered</p>
            <p className="text-lg font-extrabold text-cyan-400 font-mono">{capabilities.length}</p>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-right">
            <p className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Pending Approvals</p>
            <p className={`text-lg font-extrabold font-mono ${approvals.length > 0 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
              {approvals.length}
            </p>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-right">
            <p className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Executions Verified</p>
            <p className="text-lg font-extrabold text-emerald-400 font-mono">{webHealth?.auditStats?.successfulExecutions ?? 0}</p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 transition"
            title="Refresh Capability State"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('capabilities')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              subTab === 'capabilities'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Capability Catalog ({capabilities.length})
          </button>

          <button
            onClick={() => setSubTab('approvals')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition relative ${
              subTab === 'approvals'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Policy Approvals
            {approvals.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                {approvals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              subTab === 'audit'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Distributed Audit Ledger ({auditLogs.length})
          </button>

          <button
            onClick={() => setSubTab('events')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              subTab === 'events'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Event Stream ({events.length})
          </button>
        </div>

        {subTab === 'capabilities' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search capability..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-48"
              />
            </div>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 font-mono"
            >
              <option value="ALL">All Risks</option>
              <option value="LOW">LOW Risk</option>
              <option value="MEDIUM">MEDIUM Risk</option>
              <option value="HIGH">HIGH Risk</option>
              <option value="CRITICAL">CRITICAL Risk</option>
            </select>
          </div>
        )}
      </div>

      {/* MAIN VIEW CONTENT AREA */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* SUBTAB 1: CAPABILITY CATALOG & INTERACTIVE RUNNER */}
        {subTab === 'capabilities' && (
          <div className="h-full grid grid-cols-12 gap-5 overflow-hidden">
            {/* Left Column: Capability List */}
            <div className="col-span-5 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 overflow-hidden">
              <p className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Available Capabilities ({filteredCaps.length})</span>
                <span className="text-[10px] text-cyan-400">Authenticated: hermes-hive</span>
              </p>

              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredCaps.map((cap) => {
                  const isSelected = selectedCap?.id === cap.id;
                  return (
                    <div
                      key={cap.id}
                      onClick={() => handleSelectCapability(cap)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/5'
                          : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100 font-mono">{cap.id}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                            v{cap.version}
                          </span>
                        </div>
                        {getRiskBadge(cap.riskLevel)}
                      </div>

                      <p className="text-xs text-slate-300 font-medium">{cap.name}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{cap.description}</p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/50">
                        <span>Provider: {cap.provider.replace('hermes-web-', '')}</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {cap.health}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Interactive Protocol Runner & Response Inspector */}
            <div className="col-span-7 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 overflow-hidden">
              {selectedCap ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-100 font-mono">{selectedCap.name}</h3>
                        {getRiskBadge(selectedCap.riskLevel)}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedCap.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                        <button
                          onClick={() => setExecutionMode('SIMULATE')}
                          className={`px-3 py-1 rounded-lg font-mono font-semibold text-[11px] flex items-center gap-1 transition ${
                            executionMode === 'SIMULATE'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          SIMULATE
                        </button>
                        <button
                          onClick={() => setExecutionMode('EXECUTE')}
                          className={`px-3 py-1 rounded-lg font-mono font-semibold text-[11px] flex items-center gap-1 transition ${
                            executionMode === 'EXECUTE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Play className="w-3 h-3" />
                          EXECUTE
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Operation & Parameter Inputs */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                          Operation
                        </label>
                        <select
                          value={selectedOperation}
                          onChange={(e) => setSelectedOperation(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50"
                        >
                          {selectedCap.operations.map((op) => (
                            <option key={op} value={op}>
                              {op}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                          Source Identity
                        </label>
                        <input
                          type="text"
                          disabled
                          value="hermes-hive (Authenticated)"
                          className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                        Parameters (JSON Payload)
                      </label>
                      <textarea
                        value={paramInput}
                        onChange={(e) => setParamInput(e.target.value)}
                        rows={4}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 custom-scrollbar"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                        Permissions: [{selectedCap.permissions.join(', ')}]
                      </div>

                      <button
                        onClick={handleRunCapability}
                        disabled={executing}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg ${
                          executionMode === 'SIMULATE'
                            ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-cyan-500/20'
                            : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'
                        }`}
                      >
                        {executing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Executing Protocol...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Submit {executionMode} Request
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Response Inspector Area */}
                  <div className="flex-1 min-h-0 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 overflow-hidden">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800/80 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        Capability Protocol Response Output
                      </span>
                      {lastResponse && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          lastResponse.status === 'REQUEST_SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : lastResponse.status === 'APPROVAL_REQUIRED'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {lastResponse.status} ({lastResponse.timing.durationMs}ms)
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto font-mono text-xs text-slate-300 custom-scrollbar whitespace-pre-wrap p-1">
                      {lastResponse ? (
                        JSON.stringify(lastResponse, null, 2)
                      ) : (
                        <span className="text-slate-500 italic">
                          No response yet. Select a capability and click "Submit {executionMode} Request" to test the Hermes Web capability protocol.
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Select a capability from the list to test execution.
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 2: HIGH-RISK POLICY APPROVAL QUEUE */}
        {subTab === 'approvals' && (
          <div className="h-full bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Policy & Governance Approval Queue
                </h3>
                <p className="text-xs text-slate-400">
                  High-risk and Critical capability invocations are automatically held here until authorized by an executive operator.
                </p>
              </div>

              <span className="text-xs font-mono text-slate-400">
                Pending: <span className="text-amber-400 font-bold">{approvals.length}</span>
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 custom-scrollbar">
              {approvals.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-200">Approval Queue Clear</p>
                  <p className="text-xs text-slate-400 mt-1">
                    No high-risk capability requests are currently pending approval.
                  </p>
                </div>
              ) : (
                approvals.map((appr) => (
                  <div key={appr.approvalId} className="p-4 bg-slate-900/80 border border-amber-500/30 rounded-xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30">
                          {appr.approvalId}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-100 font-mono">{appr.capabilityId}</span>
                          <span className="text-xs text-slate-400 ml-2">Operation: {appr.operation}</span>
                        </div>
                      </div>

                      {getRiskBadge(appr.riskLevel)}
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
                      <p className="text-[10px] text-slate-500 uppercase">Parameters Payload</p>
                      <pre className="mt-1 text-[11px] text-cyan-300">{JSON.stringify(appr.parameters, null, 2)}</pre>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                      <div className="text-slate-400">
                        Requested by Agent: <span className="text-slate-200 font-mono">{appr.requestingAgentName || appr.requestingAgentId}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolveApproval(appr.approvalId, false)}
                          className="px-4 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold text-xs transition"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleResolveApproval(appr.approvalId, true)}
                          className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-md shadow-emerald-500/20"
                        >
                          Approve Execution
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 3: DISTRIBUTED AUDIT LEDGER */}
        {subTab === 'audit' && (
          <div className="h-full bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Distributed Audit & Execution Ledger
                </h3>
                <p className="text-xs text-slate-400">
                  Immutable record of every capability invocation across Hermes Hive and Hermes Web with correlation context.
                </p>
              </div>

              <div className="text-xs font-mono text-slate-400 flex items-center gap-4">
                <span>Total Executions: <strong className="text-cyan-400">{auditLogs.length}</strong></span>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 custom-scrollbar">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    {log.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{log.capabilityId}</span>
                        <span className="text-slate-400">({log.operation})</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-cyan-300">{log.executionMode}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Trace: {log.traceId} | Agent: {log.agentName || log.agentId || 'hermes_prime'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-[10px] text-slate-400">{formatTime(log.timestamp)}</p>
                      <p className="text-[11px] text-emerald-400 font-bold">{log.durationMs}ms</p>
                    </div>
                    {getRiskBadge(log.riskLevel)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 4: EVENT STREAM */}
        {subTab === 'events' && (
          <div className="h-full bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 overflow-hidden">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Capability Protocol Event Stream
              </h3>
              <p className="text-xs text-slate-400">
                Live lifecycle event envelopes emitted by Hermes Web connector fabric.
              </p>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 custom-scrollbar">
              {events.map((evt) => (
                <div key={evt.eventId} className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex flex-col gap-1 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                        {evt.eventType}
                      </span>
                      <span className="text-slate-400 text-[11px]">Source: {evt.source}</span>
                    </div>

                    <span className="text-[10px] text-slate-400">{formatTime(evt.timestamp)}</span>
                  </div>

                  <div className="text-slate-300 text-[11px] mt-1 bg-slate-950 p-2 rounded border border-slate-800/50">
                    <pre>{JSON.stringify(evt.payload, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
