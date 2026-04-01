import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, FileText, Calendar, ChevronDown } from 'lucide-react';
import { sprintService } from '@/services/api/index.js';
import type { SprintDTO, SprintStatus } from '@/types/dto.js';
import { SPRINT_STATUS_COLOR } from '@/shared/lib/sprint.js';
import { CreateSprintModal } from '@/widgets/CreateSprintModal/CreateSprintModal.js';
import { SprintDescriptionModal } from '@/widgets/SprintDescriptionModal/SprintDescriptionModal.js';
import BreadcrumbBack from '@/shared/ui/BreadcrumbBack.js';

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return '';
  if (start && end) return `${fmtDate(start)} – ${fmtDate(end)}`;
  if (start) return `from ${fmtDate(start)}`;
  return `until ${fmtDate(end)}`;
}

// Sprint card component
const SprintCard: React.FC<{
  sprint: SprintDTO;
  index: number;
  onOpen: () => void;
  onDescription: (e: React.MouseEvent) => void;
}> = ({ sprint, index, onOpen, onDescription }) => {
  const dateRange = fmtDateRange(sprint.start_date, sprint.end_date);
  const statusColor = SPRINT_STATUS_COLOR[sprint.status as SprintStatus] ?? '#6b7280';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.22, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ scale: 1.025, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className="flex-shrink-0 cursor-pointer select-none"
      style={{ width: 240 }}
    >
      <div
        className="h-full rounded-2xl p-5 flex flex-col gap-3 transition-shadow duration-200"
        style={{
          background: 'var(--bg-secondary)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        {/* Status dot + name */}
        <div className="flex items-start gap-2.5">
          <span
            className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full"
            style={{ background: statusColor }}
          />
          <h3
            className="text-sm font-semibold leading-snug line-clamp-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {sprint.name}
          </h3>
        </div>

        {/* Date range */}
        {dateRange ? (
          <div className="flex items-center gap-1.5">
            <Calendar size={11} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {dateRange}
            </span>
          </div>
        ) : (
          <div className="h-4" />
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer: description button */}
        {sprint.goal ? (
          <button
            onClick={(e) => { e.stopPropagation(); onDescription(e); }}
            className="self-start flex items-center gap-1.5 text-xs py-1.5 px-2.5 rounded-lg transition-all duration-150 hover:opacity-70"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
          >
            <FileText size={12} />
            Description
          </button>
        ) : (
          <div className="h-6" />
        )}
      </div>
    </motion.div>
  );
};

// New sprint placeholder card
const NewSprintCard: React.FC<{ onClick: () => void; index: number }> = ({ onClick, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 16, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.22, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
    whileHover={{ scale: 1.025, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex-shrink-0 cursor-pointer select-none"
    style={{ width: 240 }}
  >
    <div
      className="h-full rounded-2xl p-5 flex flex-col items-center justify-center gap-2 transition-all duration-200"
      style={{
        background: 'var(--bg-secondary)',
        opacity: 0.55,
        minHeight: 140,
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <Plus size={16} style={{ color: 'var(--text-secondary)' }} />
      </div>
      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        New Sprint
      </span>
    </div>
  </motion.div>
);

// Horizontal scroll section
const SprintRow: React.FC<{
  sprints: SprintDTO[];
  showNewCard?: boolean;
  onNewCard?: () => void;
  onOpenSprint: (id: string) => void;
  onDescription: (sprint: SprintDTO) => void;
  indexOffset?: number;
}> = ({ sprints, showNewCard, onNewCard, onOpenSprint, onDescription, indexOffset = 0 }) => (
  <div className="flex gap-3 pb-2 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
    {sprints.map((sprint, i) => (
      <SprintCard
        key={sprint.id}
        sprint={sprint}
        index={indexOffset + i}
        onOpen={() => onOpenSprint(sprint.id)}
        onDescription={() => onDescription(sprint)}
      />
    ))}
    {showNewCard && onNewCard && (
      <NewSprintCard onClick={onNewCard} index={indexOffset + sprints.length} />
    )}
  </div>
);

// Loading skeleton
const SkeletonRow: React.FC = () => (
  <div className="flex gap-3 pb-2 animate-pulse">
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="flex-shrink-0 rounded-2xl"
        style={{ width: 240, height: 140, background: 'var(--bg-secondary)', opacity: 0.5 }}
      />
    ))}
  </div>
);

const SprintSpacePage: React.FC = () => {
  const { team_id } = useParams<{ team_id: string }>();
  const navigate = useNavigate();
  const [sprints, setSprints] = useState<SprintDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [descriptionSprint, setDescriptionSprint] = useState<SprintDTO | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);

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

  useEffect(() => { fetchSprints(); }, [fetchSprints]);

  if (!team_id) return null;

  const activeSprints = sprints.filter(s => s.status === 'active');
  const planningSprints = sprints.filter(s => s.status === 'planning');
  const historySprints = sprints.filter(s => s.status === 'completed' || s.status === 'archived');
  const currentSprints = [...activeSprints, ...planningSprints];

  const handleOpen = (id: string) => navigate(`/team/${team_id}/sprints/${id}`);
  const handleDescription = (sprint: SprintDTO) => setDescriptionSprint(sprint);

  return (
    <div
      className="min-h-full font-sans transition-colors"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-20">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-10">
          <BreadcrumbBack label="Tasks" to={`/team/${team_id}`} />
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl transition-all duration-150 hover:opacity-70"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            <Plus size={15} />
            New sprint
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-8 px-4 py-3 rounded-xl text-sm flex items-center justify-between"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
          >
            {error}
            <button onClick={fetchSprints} className="underline ml-4">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-10">
            <div>
              <div className="h-3 w-16 rounded mb-4 animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
              <SkeletonRow />
            </div>
          </div>
        ) : sprints.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-32"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <Calendar size={24} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No sprints yet
            </p>
            <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
              Sprints help structure team work. They're completely optional.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 hover:opacity-75"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
            >
              Create first sprint
            </button>
          </motion.div>
        ) : (
          <div className="space-y-10">

            {/* Active + Planning */}
            {currentSprints.length > 0 && (
              <section>
                <p
                  className="text-xs font-medium uppercase tracking-wider mb-4"
                  style={{ color: 'var(--text-secondary)', letterSpacing: '0.08em' }}
                >
                  {activeSprints.length > 0 ? 'Active' : 'Planning'}
                </p>
                <SprintRow
                  sprints={currentSprints}
                  showNewCard
                  onNewCard={() => setShowCreate(true)}
                  onOpenSprint={handleOpen}
                  onDescription={handleDescription}
                />
              </section>
            )}

            {/* If only history sprints, show new card inline */}
            {currentSprints.length === 0 && historySprints.length > 0 && (
              <section>
                <p
                  className="text-xs font-medium uppercase tracking-wider mb-4"
                  style={{ color: 'var(--text-secondary)', letterSpacing: '0.08em' }}
                >
                  Sprints
                </p>
                <div className="flex gap-3 pb-2">
                  <NewSprintCard onClick={() => setShowCreate(true)} index={0} />
                </div>
              </section>
            )}

            {/* History */}
            {historySprints.length > 0 && (
              <section>
                <button
                  onClick={() => setHistoryExpanded(v => !v)}
                  className="flex items-center gap-2 mb-4 transition-opacity duration-150 hover:opacity-60"
                >
                  <p
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-secondary)', letterSpacing: '0.08em' }}
                  >
                    History
                  </p>
                  <motion.span
                    animate={{ rotate: historyExpanded ? 180 : 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ display: 'flex', color: 'var(--text-secondary)' }}
                  >
                    <ChevronDown size={13} />
                  </motion.span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                    {historySprints.length}
                  </span>
                </button>

                <AnimatePresence>
                  {historyExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <SprintRow
                        sprints={historySprints}
                        onOpenSprint={handleOpen}
                        onDescription={handleDescription}
                        indexOffset={currentSprints.length}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}
          </div>
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
          isOpen
          sprintName={descriptionSprint.name}
          description={descriptionSprint.goal}
          onClose={() => setDescriptionSprint(null)}
        />
      )}
    </div>
  );
};

export default SprintSpacePage;
