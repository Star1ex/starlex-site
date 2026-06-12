import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  Search, Users, Layers, FileText, Loader, Plus, CircleCheck, Home,
  Kanban as ProjectsIcon, SunMoon, Clock,
} from 'lucide-react';
import { searchService, type GlobalSearchResponse } from '@/services/api/search.service.js';
import { useDebounce } from '@/shared/hooks/useDebounce.js';
import { useWorkspace } from '@/contexts/useWorkspace.js';
import { useTheme } from '@/shared/contexts/useTheme.js';
import { getAllViews } from '@/shared/lib/savedViews.js';
import { getAllRecent, type RecentItem } from '@/shared/lib/recentItems.js';
import { Glass } from '@/shared/ui/glass/index.js';

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ResultItem =
  | { kind: 'workspace'; id: string; name: string; url: string }
  | { kind: 'sprint';    id: string; name: string; url: string; status: string }
  | { kind: 'task';      id: string; name: string; url: string; progress: string };

const KIND_ICON: Record<ResultItem['kind'], React.ReactNode> = {
  workspace: <Users size={15} />,
  sprint:    <Layers size={15} />,
  task:      <FileText size={15} />,
};
const KIND_LABEL: Record<ResultItem['kind'], string> = { workspace: 'Workspace', sprint: 'Sprint', task: 'Task' };
const RECENT_ICON: Record<RecentItem['type'], React.ReactNode> = {
  workspace: <Users size={15} />,
  team:      <Users size={15} />,
  sprint:    <Layers size={15} />,
  task:      <FileText size={15} />,
};

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const debouncedQuery = useDebounce(query, 200);
  const abortRef = useRef<AbortController | null>(null);

  const hasQuery = Boolean(query.trim());
  const wsId = activeWorkspaceId ?? '';

  const recent = useMemo(() => (isOpen ? getAllRecent() : { workspaces: [], sprints: [], tasks: [] }), [isOpen]);
  const recentItems = useMemo(
    () => [...recent.workspaces, ...recent.sprints, ...recent.tasks].slice(0, 5),
    [recent],
  );

  const go = useCallback((url: string) => { navigate(url); onClose(); }, [navigate, onClose]);

  // Reset + focus on open
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      setQuery('');
      setResults([]);
    }, 40);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Server search
  useEffect(() => {
    if (!isOpen) return;
    abortRef.current?.abort();

    if (!debouncedQuery.trim()) {
      const t = window.setTimeout(() => { setResults([]); setLoading(false); }, 0);
      return () => window.clearTimeout(t);
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const loadingTimer = window.setTimeout(() => {
      if (!ctrl.signal.aborted) setLoading(true);
    }, 0);

    searchService.globalSearch(debouncedQuery, ctrl.signal)
      .then((data: GlobalSearchResponse) => {
        if (ctrl.signal.aborted) return;
        setResults([
          ...data.workspaces.map(t => ({ kind: 'workspace' as const, id: t.id, name: t.name, url: `/workspace/${t.id}` })),
          ...data.sprints.map(s => ({ kind: 'sprint' as const, id: s.id, name: s.name, url: `/workspace/${s.workspace_id}/sprints/${s.id}`, status: s.status })),
          ...data.tasks.map(t => ({
            kind: 'task' as const, id: t.id, name: t.task,
            url: t.sprint_id ? `/workspace/${t.workspace_id}/sprints/${t.sprint_id}` : `/task/${t.id}`,
            progress: t.progress,
          })),
        ]);
        setLoading(false);
      })
      .catch((e: unknown) => {
        const name = (e as { name?: string })?.name;
        if (name === 'CanceledError' || name === 'AbortError') return;
        setLoading(false);
      });

    return () => {
      window.clearTimeout(loadingTimer);
      ctrl.abort();
    };
  }, [debouncedQuery, isOpen]);

  const views = useMemo(() => (isOpen ? getAllViews().slice(0, 4) : []), [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-[18vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.15 } }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
        >
          {/* Backdrop — flat dim + blur (background recedes) */}
          <div
            className="absolute inset-0"
            style={{ background: 'var(--sx-overlay)', backdropFilter: 'blur(18px) saturate(115%)', WebkitBackdropFilter: 'blur(18px) saturate(115%)' }}
            onClick={onClose}
          />

          <Glass
            as={motion.div}
            variant="modal"
            depth="floating"
            className="relative w-full max-w-[560px] overflow-hidden"
            style={{ viewTransitionName: 'sx-cmdk' } as React.CSSProperties}
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, scale: 0.98, y: -6, transition: { duration: 0.12 } }}
          >
            <Command shouldFilter={false} loop className="sx-cmd">
              {/* Input row — borderless, 16px */}
              <div className="sx-cmd__input-row">
                {loading
                  ? <Loader size={17} className="sx-cmd__leading animate-spin" />
                  : <Search size={17} className="sx-cmd__leading" />}
                <Command.Input
                  ref={inputRef}
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search or jump to…"
                  className="sx-cmd__input"
                />
                <kbd className="sx-cmd__esc label-caps">esc</kbd>
              </div>

              <Command.List className="sx-cmd__list">
                {hasQuery && !loading && results.length === 0 && (
                  <Command.Empty className="sx-cmd__empty">No results for “{query}”</Command.Empty>
                )}

                {/* Server results */}
                {hasQuery && results.length > 0 && (
                  <Command.Group heading="Results" className="sx-cmd__group">
                    {results.map((item) => (
                      <Command.Item
                        key={`${item.kind}-${item.id}`}
                        value={`${item.kind}-${item.id}-${item.name}`}
                        onSelect={() => go(item.url)}
                        className="sx-cmd__item"
                      >
                        <span className="sx-cmd__icon">{KIND_ICON[item.kind]}</span>
                        <span className="sx-cmd__label">{item.name}</span>
                        <span className="sx-cmd__meta label-caps">{KIND_LABEL[item.kind]}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Actions + recents when idle */}
                {!hasQuery && (
                  <>
                    <Command.Group heading="Actions" className="sx-cmd__group">
                      <Command.Item value="action-new-task" onSelect={() => go(wsId ? `/task/new?workspaceId=${wsId}` : '/dashboard')} className="sx-cmd__item">
                        <span className="sx-cmd__icon"><Plus size={15} /></span>
                        <span className="sx-cmd__label">New task</span>
                        <kbd className="sx-cmd__chip">C</kbd>
                      </Command.Item>
                      <Command.Item value="action-new-project" onSelect={() => go(wsId ? `/workspace/${wsId}?view=projects` : '/dashboard')} className="sx-cmd__item">
                        <span className="sx-cmd__icon"><ProjectsIcon size={15} /></span>
                        <span className="sx-cmd__label">New project</span>
                      </Command.Item>
                      <Command.Item value="action-theme" onSelect={() => toggleTheme()} className="sx-cmd__item">
                        <span className="sx-cmd__icon"><SunMoon size={15} /></span>
                        <span className="sx-cmd__label">Toggle theme</span>
                        <span className="sx-cmd__meta label-caps">{theme === 'light' ? 'Light' : 'Dark'}</span>
                      </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Navigate" className="sx-cmd__group">
                      <Command.Item value="nav-home" onSelect={() => go(wsId ? `/workspace/${wsId}` : '/dashboard')} className="sx-cmd__item">
                        <span className="sx-cmd__icon"><Home size={15} /></span>
                        <span className="sx-cmd__label">Home</span>
                      </Command.Item>
                      <Command.Item value="nav-projects" onSelect={() => go(wsId ? `/workspace/${wsId}?view=projects` : '/dashboard')} className="sx-cmd__item">
                        <span className="sx-cmd__icon"><ProjectsIcon size={15} /></span>
                        <span className="sx-cmd__label">Projects</span>
                      </Command.Item>
                      <Command.Item value="nav-my-issues" onSelect={() => go('/my-issues')} className="sx-cmd__item">
                        <span className="sx-cmd__icon"><CircleCheck size={15} /></span>
                        <span className="sx-cmd__label">My Issues</span>
                      </Command.Item>
                      {views.map((v) => (
                        <Command.Item key={v.id} value={`view-${v.id}`} onSelect={() => go(`/my-issues?view=${v.id}`)} className="sx-cmd__item">
                          <span className="sx-cmd__icon"><FileText size={15} /></span>
                          <span className="sx-cmd__label">{v.name}</span>
                        </Command.Item>
                      ))}
                    </Command.Group>

                    {recentItems.length > 0 && (
                      <Command.Group heading="Recent" className="sx-cmd__group">
                        {recentItems.map((item) => (
                          <Command.Item key={`${item.type}-${item.id}`} value={`recent-${item.type}-${item.id}`} onSelect={() => go(item.url)} className="sx-cmd__item">
                            <span className="sx-cmd__icon">{RECENT_ICON[item.type] ?? <Clock size={15} />}</span>
                            <span className="sx-cmd__label">{item.name}</span>
                            {item.subtitle && <span className="sx-cmd__meta">{item.subtitle}</span>}
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}
                  </>
                )}
              </Command.List>
            </Command>
          </Glass>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SearchModal;
