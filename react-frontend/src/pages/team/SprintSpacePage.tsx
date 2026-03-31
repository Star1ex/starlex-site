import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Calendar, ChevronRight, FileText } from 'lucide-react';
import { sprintService } from '@/services/api/index.js';
import type { SprintDTO, SprintStatus } from '@/types/dto.js';
import { SPRINT_STATUS_LABEL, SPRINT_STATUS_COLOR } from '@/shared/lib/sprint.js';
import { CreateSprintModal } from '@/widgets/CreateSprintModal/CreateSprintModal.js';
import { SprintDescriptionModal } from '@/widgets/SprintDescriptionModal/SprintDescriptionModal.js';
import BreadcrumbBack from '@/shared/ui/BreadcrumbBack.js';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const SprintSpacePage: React.FC = () => {
  const { team_id } = useParams<{ team_id: string }>();
  const navigate = useNavigate();
  const [sprints, setSprints] = useState<SprintDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [descriptionSprint, setDescriptionSprint] = useState<SprintDTO | null>(null);

  const fetchSprints = useCallback(async () => {
    if (!team_id) return;
    setLoading(true);
    try {
      const data = await sprintService.getTeamSprints(team_id);
      setSprints(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError('Failed to load sprints');
    } finally {
      setLoading(false);
    }
  }, [team_id]);

  useEffect(() => {
    fetchSprints();
  }, [fetchSprints]);

  if (!team_id) return null;

  return (
    <div
      className="min-h-full font-sans transition-colors"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
        {/* Back navigation */}
        <div className="mb-6">
          <BreadcrumbBack
            label="Tasks"
            to={`/team/${team_id}`}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Sprints
          </h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 hover:opacity-75"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            <Plus size={16} />
            New Sprint
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center justify-between"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
            <span>{error}</span>
            <button onClick={fetchSprints} className="underline hover:no-underline">Retry</button>
          </div>
        )}

        {/* Sprint list */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl" style={{ background: 'var(--bg-secondary)' }} />
            ))}
          </div>
        ) : sprints.length === 0 ? (
          <motion.div
            className="text-center py-24"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <Calendar size={28} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <p className="text-base font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No sprints yet</p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Create your first sprint to organize work
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-150 hover:opacity-75"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
            >
              Create Sprint
            </button>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            <div className="space-y-3">
              {sprints.map((sprint, i) => (
                <motion.div
                  key={sprint.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2, delay: i * 0.04, ease: 'easeOut' }}
                  className="group rounded-2xl px-5 py-4 flex items-center gap-4 cursor-pointer transition-all duration-150"
                  style={{ background: 'var(--bg-secondary)' }}
                  onClick={() => navigate(`/team/${team_id}/sprints/${sprint.id}`)}
                >
                  {/* Status dot */}
                  <div className="flex-shrink-0">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: SPRINT_STATUS_COLOR[sprint.status as SprintStatus] ?? '#6b7280' }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {sprint.name}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                      >
                        {SPRINT_STATUS_LABEL[sprint.status as SprintStatus] ?? sprint.status}
                      </span>
                    </div>
                    {(sprint.start_date || sprint.end_date) && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <Calendar size={11} />
                        <span>
                          {sprint.start_date ? formatDate(sprint.start_date) : '—'}
                          {sprint.end_date ? ` → ${formatDate(sprint.end_date)}` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description button */}
                  {sprint.goal && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDescriptionSprint(sprint);
                      }}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 hover:opacity-70 opacity-0 group-hover:opacity-100"
                      style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                    >
                      <FileText size={13} />
                      Description
                    </button>
                  )}

                  <ChevronRight
                    size={16}
                    className="flex-shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <CreateSprintModal
        isOpen={showCreate}
        teamId={team_id}
        onClose={() => setShowCreate(false)}
        onSuccess={fetchSprints}
      />

      {descriptionSprint && (
        <SprintDescriptionModal
          isOpen={true}
          sprintName={descriptionSprint.name}
          description={descriptionSprint.goal}
          onClose={() => setDescriptionSprint(null)}
        />
      )}
    </div>
  );
};

export default SprintSpacePage;
