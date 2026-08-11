import React, { useState } from 'react';
import { Mission } from '../../../shared/types';
import { TaskGraph } from './TaskGraph';
import { Target, CheckCircle2, Clock, AlertTriangle, ChevronRight, Award, FileText } from 'lucide-react';

interface MissionListProps {
  missions: Mission[];
}

export const MissionList: React.FC<MissionListProps> = ({ missions }) => {
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(
    missions.length > 0 ? missions[0].id : null
  );

  const selectedMission = missions.find((m) => m.id === selectedMissionId) || (missions.length > 0 ? missions[0] : null);

  const getStatusBadge = (status: Mission['status']) => {
    switch (status) {
      case 'completed':
        return { label: 'Completed', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckCircle2 };
      case 'in_progress':
        return { label: 'In Progress', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: Clock };
      case 'failed':
        return { label: 'Failed', bg: 'bg-red-500/20 text-red-300 border-red-500/40', icon: AlertTriangle };
      default:
        return { label: status, bg: 'bg-slate-800 text-slate-400 border-slate-700', icon: Clock };
    }
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
      {/* Left Col: Mission Selection List */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800/80 p-5 flex flex-col shadow-xl min-h-0">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" /> Active Swarm Missions ({missions.length})
        </h3>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {missions.length === 0 ? (
            <div className="text-xs text-slate-500 italic p-6 text-center border border-dashed border-slate-800 rounded-xl">
              No missions created yet. Submit an objective to Hermes to start a mission.
            </div>
          ) : (
            missions.map((m) => {
              const isSelected = m.id === selectedMission?.id;
              const statusInfo = getStatusBadge(m.status);
              const StatusIcon = statusInfo.icon;
              const completedTasksCount = m.tasks.filter((t) => t.status === 'completed').length;

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMissionId(m.id)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full border ${statusInfo.bg} flex items-center gap-1`}>
                      <StatusIcon className="w-3 h-3" /> {statusInfo.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Priority P{m.priority}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100 line-clamp-2 leading-snug">{m.objective}</h4>

                  {/* Progress Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Tasks: {completedTasksCount}/{m.tasks.length}</span>
                      <span className="text-cyan-400 font-bold">{m.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full transition-all duration-300"
                        style={{ width: `${m.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right 2 Cols: Selected Mission Task Graph & Executive Deliverables */}
      <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800/80 p-6 flex flex-col shadow-xl overflow-y-auto">
        {selectedMission ? (
          <div className="space-y-6">
            {/* Header Details */}
            <div className="border-b border-slate-800/80 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                  MISSION DETAIL • {selectedMission.id}
                </div>
                <h2 className="text-base font-extrabold text-slate-100 mt-1">{selectedMission.objective}</h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-500">Progress</div>
                  <div className="text-sm font-mono font-bold text-cyan-400">{selectedMission.progress}%</div>
                </div>
                <div className="text-right pl-3 border-l border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500">Assigned Agents</div>
                  <div className="text-sm font-mono font-bold text-slate-200">{selectedMission.assignedAgents.length}</div>
                </div>
              </div>
            </div>

            {/* Synthesized Executive Results (if completed) */}
            {selectedMission.result && (
              <div className="p-5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/40 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-300">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" /> SYNTHESIZED EXECUTIVE DELIVERABLES
                  </span>
                  <span className="text-emerald-400">Confidence: {Math.round(selectedMission.result.confidenceScore * 100)}%</span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans">{selectedMission.result.summary}</p>

                {selectedMission.result.deliverables && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    {selectedMission.result.deliverables.map((del, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                        <div className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
                          <FileText className="w-3.5 h-3.5" /> {del.title}
                        </div>
                        <div className="text-slate-300 font-sans leading-relaxed">{del.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Task Dependency Graph */}
            <TaskGraph tasks={selectedMission.tasks} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
            Select a mission from the list to view its live task graph and synthesized outputs.
          </div>
        )}
      </div>
    </div>
  );
};
