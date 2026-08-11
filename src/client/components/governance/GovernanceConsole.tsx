import React, { useEffect, useState } from 'react';
import { Shield, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Lock, FileText, UserCheck } from 'lucide-react';
import { GovernancePolicy, RiskAssessment } from '../../../shared/types';

export interface ApprovalRequestUI {
  id: string;
  agentId: string;
  agentName: string;
  actionType: string;
  targetResource?: string;
  riskAssessment: RiskAssessment;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  createdAt: string;
}

export const GovernanceConsole: React.FC = () => {
  const [policies, setPolicies] = useState<GovernancePolicy[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequestUI[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGovernanceData = async () => {
    try {
      const [polRes, appRes] = await Promise.all([
        fetch('/api/governance/policies').then((r) => r.json()).catch(() => ({ policies: [] })),
        fetch('/api/governance/approvals').then((r) => r.json()).catch(() => ({ approvals: [] })),
      ]);

      if (polRes.policies) setPolicies(polRes.policies);
      if (appRes.approvals) setApprovals(appRes.approvals);
      setLoading(false);
    } catch (err) {
      console.error('[GovernanceConsole] Error loading data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGovernanceData();
    const interval = setInterval(fetchGovernanceData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'deny') => {
    try {
      await fetch(`/api/governance/approvals/${id}/${action}`, { method: 'POST' });
      await fetchGovernanceData();
    } catch (err) {
      console.error(`[GovernanceConsole] Error performing ${action}:`, err);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pr-2">
      {/* Header Banner */}
      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 rounded-xl border border-rose-500/20 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              CONSTITUTIONAL GOVERNANCE & RISK CONSOLE
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                Executable Safety Bounds
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Hard code policy boundaries, risk classification, and human-in-the-loop authorization gates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Active Policies: <strong className="text-white">{policies.length}</strong></span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>Pending Approvals: <strong className="text-amber-300">{approvals.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Pending Human Approval Requests Section */}
      <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Pending Human Authorization Queue ({approvals.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            Requires explicit human confirmation for CRITICAL risk actions
          </span>
        </div>

        {approvals.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/30 rounded-lg border border-dashed border-slate-800/80">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No pending approval requests.</p>
            <p className="text-[11px] text-slate-500 mt-1">All autonomous swarm actions are running within normal risk thresholds.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((req) => (
              <div
                key={req.id}
                className="p-4 bg-slate-900/80 rounded-xl border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      CRITICAL RISK ({req.riskAssessment.score}/100)
                    </span>
                    <span className="text-xs font-semibold text-slate-200">{req.actionType}</span>
                    <span className="text-[11px] text-slate-400 font-mono">by {req.agentName}</span>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-950 p-2 rounded border border-slate-800/60 font-mono">
                    {req.reason}
                  </p>
                  {req.targetResource && (
                    <p className="text-[11px] text-slate-400">Target Resource: <span className="text-cyan-300 font-mono">{req.targetResource}</span></p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAction(req.id, 'approve')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Execute
                  </button>
                  <button
                    onClick={() => handleAction(req.id, 'deny')}
                    className="px-4 py-2 bg-rose-600/80 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <XCircle className="w-4 h-4" /> Deny Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Constitutional Policy Registry Grid */}
      <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            Constitutional Governance Policies
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Hard code policies enforced before action dispatch</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {policies.map((pol) => (
            <div
              key={pol.id}
              className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {pol.category}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> ENFORCED
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-200">{pol.name}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{pol.description}</p>
              </div>

              {pol.prohibitedOperations && (
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-[10px] font-mono text-rose-300 space-y-1">
                  <span className="text-slate-500 uppercase font-bold block text-[9px]">Prohibited Signatures:</span>
                  {pol.prohibitedOperations.map((op, i) => (
                    <div key={i} className="truncate">• {op}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
