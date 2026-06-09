import React, { useCallback, useState } from 'react';
import { ArrowLeft, Edit2, Trash2, Users } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select.js';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog.js';
import { projectService } from '@/services/api/index.js';
import { showToast } from '@/shared/lib/toast.js';
import { can } from '@/shared/lib/permissions.js';
import type { ProjectDTO, ProjectPriority, ProjectStatus, UserDTO, WorkspaceRole } from '@/types/dto.js';

const STATUS_META: Record<ProjectStatus, { label: string; dot: string; pillClass: string }> = {
  backlog:     { label: 'Backlog',      dot: '#475569', pillClass: 'bg-slate-800/60 text-slate-400' },
  planned:     { label: 'Planned',      dot: '#a78bfa', pillClass: 'bg-violet-900/30 text-violet-300' },
  in_progress: { label: 'In Progress',  dot: '#3b82f6', pillClass: 'bg-blue-900/30 text-blue-300' },
  paused:      { label: 'Paused',       dot: '#f59e0b', pillClass: 'bg-amber-900/30 text-amber-300' },
  completed:   { label: 'Completed',    dot: '#22c55e', pillClass: 'bg-green-900/30 text-green-300' },
  cancelled:   { label: 'Cancelled',    dot: '#ef4444', pillClass: 'bg-red-900/30 text-red-400' },
};

const ALL_STATUSES = Object.keys(STATUS_META) as ProjectStatus[];

const PRIORITY_META: Record<ProjectPriority, { label: string; color: string }> = {
  none:   { label: 'No priority', color: '#475569' },
  urgent: { label: 'Urgent',      color: '#f87171' },
  high:   { label: 'High',        color: '#fb923c' },
  medium: { label: 'Medium',      color: '#a78bfa' },
  low:    { label: 'Low',         color: '#60a5fa' },
};

const ALL_PRIORITIES = Object.keys(PRIORITY_META) as ProjectPriority[];

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
  tasks: { status?: string }[];
}

function ProjectProgress({ tasks }: ProjectProgressProps) {
  if (tasks.length === 0) return null;
  const done = tasks.filter((t) => t.status === 'done').length;
  const inProg = tasks.filter((t) => t.status === 'in_progress' || t.status === 'in_review').length;
  const pct = Math.round((done / tasks.length) * 100);
  return (
    <div className="mt-5">
      <div className="flex justify-between text-label-sm text-white/40 mb-1.5">
        <span>{pct}% complete</span>
        <span>{done}/{tasks.length} done</span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar__fill transition-all duration-700" style={{ width: `${pct}%`, background: '#22c55e' }} />
      </div>
      <div className="flex gap-4 mt-2 text-label-sm">
        {tasks.length - done - inProg > 0 && <span className="text-white/30">{tasks.length - done - inProg} not started</span>}
        {inProg > 0 && <span className="text-blue-400">{inProg} in progress</span>}
        {done > 0 && <span className="text-green-400">{done} done</span>}
      </div>
    </div>
  );
}

interface ProjectHeaderProps {
  project: ProjectDTO;
  members: UserDTO[];
  tasks: { status?: string }[];
  workspaceRole?: WorkspaceRole;
  onBack: () => void;
  onProjectChange?: (updated: ProjectDTO) => void;
  onProjectDeleted?: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project, members, tasks, workspaceRole, onBack, onProjectChange, onProjectDeleted,
}) => {
  const isLeader = false; // TODO: compare with current user id
  const canManage = can.manageProject(workspaceRole, isLeader);

  const sm = STATUS_META[project.status] ?? STATUS_META.backlog;
  const pm = PRIORITY_META[project.priority] ?? PRIORITY_META.none;
  const deadlineFmt = fmtDeadline(project.deadline);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleStatusChange = useCallback(async (status: ProjectStatus) => {
    if (status === project.status) return;
    const prev = project.status;
    onProjectChange?.({ ...project, status });
    try {
      const updated = await projectService.updateProjectStatus(project.id, status);
      onProjectChange?.(updated);
    } catch {
      onProjectChange?.({ ...project, status: prev });
      showToast('Failed to update project status');
    }
  }, [project, onProjectChange]);

  const handlePriorityChange = useCallback(async (priority: ProjectPriority) => {
    if (priority === project.priority) return;
    const prev = project.priority;
    onProjectChange?.({ ...project, priority });
    try {
      const updated = await projectService.updateProjectPriority(project.id, priority);
      onProjectChange?.(updated);
    } catch {
      onProjectChange?.({ ...project, priority: prev });
      showToast('Failed to update project priority');
    }
  }, [project, onProjectChange]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await projectService.deleteProject(project.id);
      onProjectDeleted?.();
    } catch {
      showToast('Failed to delete project');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }, [project.id, onProjectDeleted]);

  return (
    <div className="mb-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 mb-6 text-label-sm text-white/40 hover:text-white/70 transition-colors"
      >
        <ArrowLeft size={13} />
        Back to workspace
      </button>

      <div className="flex items-start gap-3 mb-2">
        {project.icon ? (
          <span className="text-2xl leading-none mt-0.5">{project.icon}</span>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center text-sm font-bold text-white/50 flex-shrink-0">
            {project.name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="text-headline-lg font-hanken font-bold text-white flex-1">{project.name}</h1>

        {canManage && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button className="p-1.5 text-white/30 hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors">
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="p-1.5 text-white/30 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-2">
        {/* Status pill / selector */}
        {canManage ? (
          <Select value={project.status} onValueChange={(v) => handleStatusChange(v as ProjectStatus)}>
            <SelectTrigger className={`h-auto px-2.5 py-1 rounded-full border-0 text-label-sm font-medium gap-1 ${sm.pillClass}`} style={{ background: 'transparent' }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sm.dot }} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10 bg-black/80 backdrop-blur-2xl">
              {ALL_STATUSES.map((s) => {
                const meta = STATUS_META[s];
                return (
                  <SelectItem key={s} value={s} className="text-label-sm text-white/70 focus:text-white">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />
                      {meta.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        ) : (
          <span className={`inline-flex items-center gap-1 text-label-sm px-2.5 py-1 rounded-full font-medium ${sm.pillClass}`}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sm.dot }} />
            {sm.label}
          </span>
        )}

        {/* Priority */}
        {canManage ? (
          <Select value={project.priority} onValueChange={(v) => handlePriorityChange(v as ProjectPriority)}>
            <SelectTrigger className="h-auto px-2.5 py-1 rounded-full border-white/10 bg-white/5 text-label-sm font-medium gap-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10 bg-black/80 backdrop-blur-2xl">
              {ALL_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p} className="text-label-sm text-white/70 focus:text-white">
                  <span style={{ color: PRIORITY_META[p].color }}>{PRIORITY_META[p].label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          project.priority !== 'none' && (
            <span className="text-label-sm font-medium" style={{ color: pm.color }}>{pm.label}</span>
          )
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

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="glass-card border-white/10 bg-black/80 backdrop-blur-2xl text-white sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-hanken">Delete project</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Are you sure you want to delete <strong className="text-white/80">{project.name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/60 hover:bg-white/8">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600/80 hover:bg-red-600 text-white border-0"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
