import React from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import type { ProjectDTO, UserDTO } from '@/types/dto.js';

const STATUS_META: Record<string, { label: string; dot: string; pillClass: string }> = {
  backlog:     { label: 'Backlog',      dot: '#475569', pillClass: 'bg-slate-800/60 text-slate-400' },
  planned:     { label: 'Planned',      dot: '#a78bfa', pillClass: 'bg-violet-900/30 text-violet-300' },
  in_progress: { label: 'In Progress',  dot: '#3b82f6', pillClass: 'bg-blue-900/30 text-blue-300' },
  paused:      { label: 'Paused',       dot: '#f59e0b', pillClass: 'bg-amber-900/30 text-amber-300' },
  completed:   { label: 'Completed',    dot: '#22c55e', pillClass: 'bg-green-900/30 text-green-300' },
  cancelled:   { label: 'Cancelled',    dot: '#ef4444', pillClass: 'bg-red-900/30 text-red-400' },
};

const PRIORITY_CLS: Record<string, string> = {
  high:   'text-orange-400',
  medium: 'text-amber-400',
  low:    'text-blue-400',
};

function fmtDeadline(d: string | null): string | null {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  const diff = date.getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `Due in ${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface ProjectProgressProps {
  tasks: { progress: string }[];
}

function ProjectProgress({ tasks }: ProjectProgressProps) {
  if (tasks.length === 0) return null;
  const done = tasks.filter(t => t.progress === 'done').length;
  const inProgress = tasks.filter(t => t.progress === 'in_progress').length;
  const pct = Math.round((done / tasks.length) * 100);

  return (
    <div className="mt-5">
      <div className="flex justify-between text-label-sm text-white/40 mb-1.5">
        <span>{pct}% complete</span>
        <span>{done}/{tasks.length} done</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar__fill transition-all duration-700"
          style={{ width: `${pct}%`, background: '#22c55e' }}
        />
      </div>
      <div className="flex gap-4 mt-2 text-label-sm">
        {tasks.length - done - inProgress > 0 && (
          <span className="text-white/30">{tasks.length - done - inProgress} not started</span>
        )}
        {inProgress > 0 && <span className="text-blue-400">{inProgress} in progress</span>}
        {done > 0 && <span className="text-green-400">{done} done</span>}
      </div>
    </div>
  );
}

interface ProjectHeaderProps {
  project: ProjectDTO;
  members: UserDTO[];
  tasks: { progress: string }[];
  onBack: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, members, tasks, onBack }) => {
  const sm = STATUS_META[project.status] ?? STATUS_META.backlog;
  const deadlineFmt = fmtDeadline(project.deadline);

  return (
    <div className="mb-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 mb-6 text-label-sm text-white/40 hover:text-white/70 transition-colors"
      >
        <ArrowLeft size={13} />
        Back to workspace
      </button>

      <div className="flex items-center gap-3 mb-2">
        {project.icon ? (
          <span className="text-2xl leading-none">{project.icon}</span>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center text-sm font-bold text-white/50">
            {project.name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="text-headline-lg font-hanken font-bold text-white">
          {project.name}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-2">
        <span className={`inline-flex items-center gap-1 text-label-sm px-2.5 py-1 rounded-full font-medium ${sm.pillClass}`}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sm.dot }} />
          {sm.label}
        </span>
        {project.priority && project.priority !== 'none' && (
          <span className={`text-label-sm font-medium ${PRIORITY_CLS[project.priority] ?? ''}`}>
            {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)} priority
          </span>
        )}
        {deadlineFmt && (
          <span className="text-label-sm text-white/40">{deadlineFmt}</span>
        )}
        {members.length > 0 && (
          <span className="flex items-center gap-1 text-label-sm text-white/40 ml-1">
            <Users size={11} />
            {members.length} member{members.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {project.description && (
        <p className="mt-3 text-body-md text-white/50 leading-relaxed">{project.description}</p>
      )}
      {project.goal && (
        <div className="mt-3 pl-3 border-l-2 border-white/10">
          <p className="label-caps text-white/30 mb-0.5">Goal</p>
          <p className="text-body-md text-white/70">{project.goal}</p>
        </div>
      )}

      <ProjectProgress tasks={tasks} />
    </div>
  );
};
