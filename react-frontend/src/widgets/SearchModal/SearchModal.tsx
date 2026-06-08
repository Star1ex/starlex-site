import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Layers, FileText, ArrowRight, Loader, Plus, CircleCheck, Home, FolderKanban } from 'lucide-react';
import { searchService, type GlobalSearchResponse } from '@/services/api/search.service.js';
import { useDebounce } from '@/shared/hooks/useDebounce.js';
import { useWorkspace } from '@/contexts/WorkspaceContext.js';
import { getAllViews } from '@/shared/lib/savedViews.js';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ResultItem =
  | { kind: 'workspace'; id: string; name: string; url: string }
  | { kind: 'sprint';    id: string; name: string; url: string; status: string }
  | { kind: 'task';      id: string; name: string; url: string; progress: string };

interface QuickAction { id: string; label: string; icon: React.ReactNode; url: string; hint?: string }

const KIND_ICON = {
  workspace: <Users size={14} />,
  sprint:    <Layers size={14} />,
  task:      <FileText size={14} />,
};

const KIND_LABEL = { workspace: 'Workspace', sprint: 'Sprint', task: 'Task' };

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [selected, setSelected] = useState(0);
  const debouncedQuery = useDebounce(query, 200);
  const abortRef = useRef<AbortController | null>(null);

  const quickActions = useCallback((): QuickAction[] => {
    const wsId = activeWorkspaceId ?? '';
    const actions: QuickAction[] = [
      { id: 'new-task',  label: 'New task',      icon: <Plus size={14} />,         url: wsId ? `/task/new?workspaceId=${wsId}` : '/task/new',  hint: 'C' },
      { id: 'home',      label: 'Home',           icon: <Home size={14} />,         url: wsId ? `/workspace/${wsId}` : '/dashboard' },
      { id: 'projects',  label: 'Projects',       icon: <FolderKanban size={14} />, url: wsId ? `/workspace/${wsId}?view=projects` : '/dashboard' },
      { id: 'my-issues', label: 'My Issues',      icon: <CircleCheck size={14} />,  url: '/my-issues' },
    ];
    const views = getAllViews();
    for (const v of views.slice(0, 4)) {
      actions.push({ id: `view-${v.id}`, label: v.name, icon: <FileText size={14} />, url: `/my-issues?view=${v.id}` });
    }
    return actions;
  }, [activeWorkspaceId]);

  const openAction = useCallback((url: string) => {
    navigate(url);
    onClose();
  }, [navigate, onClose]);

  // Focus input when opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelected(0);
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Search
  useEffect(() => {
    if (!isOpen) return;
    abortRef.current?.abort();

    if (!debouncedQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);

    searchService.globalSearch(debouncedQuery, ctrl.signal)
      .then((data: GlobalSearchResponse) => {
        if (ctrl.signal.aborted) return;
        const items: ResultItem[] = [
          ...data.workspaces.map(t => ({ kind: 'workspace' as const, id: t.id, name: t.name, url: `/workspace/${t.id}` })),
          ...data.sprints.map(s => ({ kind: 'sprint' as const, id: s.id, name: s.name, url: `/workspace/${s.workspace_id}/sprints/${s.id}`, status: s.status })),
          ...data.tasks.map(t => ({
            kind: 'task' as const, id: t.id, name: t.task,
            url: t.sprint_id ? `/workspace/${t.workspace_id}/sprints/${t.sprint_id}` : `/task/${t.id}`,
            progress: t.progress,
          })),
        ];
        setResults(items);
        setSelected(0);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if ((e as { name?: string })?.name === 'CanceledError' || (e as { name?: string })?.name === 'AbortError') return;
        setLoading(false);
      });

    return () => ctrl.abort();
  }, [debouncedQuery, isOpen]);

  const open = useCallback((item: ResultItem) => {
    navigate(item.url);
    onClose();
  }, [navigate, onClose]);

  // Keyboard navigation
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const actions = !query.trim() ? quickActions() : [];
    const listLen = query.trim() ? results.length : actions.length;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, listLen - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter') {
      if (query.trim() && results[selected]) open(results[selected]);
      else if (!query.trim() && actions[selected]) openAction(actions[selected].url);
    }
  }, [results, selected, open, query, quickActions, openAction]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.15 } }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full overflow-hidden"
            style={{
              maxWidth: '560px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
              margin: '0 16px',
            }}
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
            exit={{ opacity: 0, scale: 0.97, y: -8, transition: { duration: 0.12 } }}
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: results.length > 0 || loading ? '1px solid var(--border-color)' : 'none' }}>
              {loading
                ? <Loader size={16} className="animate-spin flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                : <Search size={16} className="flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
              }
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search workspaces, sprints, tasks…"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-primary)' }}
                spellCheck={false}
                autoComplete="off"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="py-1.5 max-h-72 overflow-y-auto">
                {results.map((item, i) => (
                  <button
                    key={`${item.kind}-${item.id}`}
                    onClick={() => open(item)}
                    onMouseEnter={() => setSelected(i)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group"
                    style={{
                      background: selected === i ? 'var(--bg-secondary)' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>{KIND_ICON[item.kind]}</span>
                    <span className="flex-1 text-sm truncate">{item.name}</span>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                      {KIND_LABEL[item.kind]}
                    </span>
                    <ArrowRight
                      size={13}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                      style={{ color: 'var(--text-secondary)' }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && query.trim() && results.length === 0 && (
              <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                No results for "{query}"
              </div>
            )}

            {/* Quick actions when no query */}
            {!query.trim() && (
              <div>
                <div className="px-4 pt-3 pb-1">
                  <span className="label-caps text-white/30">Quick actions</span>
                </div>
                {quickActions().map((action, i) => (
                  <button
                    key={action.id}
                    onClick={() => openAction(action.url)}
                    onMouseEnter={() => setSelected(i)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ background: selected === i ? 'var(--bg-secondary)' : 'transparent', color: 'var(--text-primary)' }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>{action.icon}</span>
                    <span className="flex-1 text-sm">{action.label}</span>
                    {action.hint && (
                      <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {action.hint}
                      </kbd>
                    )}
                  </button>
                ))}
                <div className="flex items-center gap-4 px-4 py-2.5 mt-1" style={{ borderTop: '1px solid var(--border-color)' }}>
                  {[['↑↓','navigate'],['↵','open'],['Esc','close']].map(([k, l]) => (
                    <span key={k} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <kbd className="px-1.5 py-0.5 rounded text-xs font-mono mr-1" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{k}</kbd>{l}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SearchModal;
