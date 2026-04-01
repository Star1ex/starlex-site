import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Layers, FileText, ArrowRight, Loader } from 'lucide-react';
import { searchService, type GlobalSearchResponse } from '@/services/api/search.service.js';
import { useDebounce } from '@/shared/hooks/useDebounce.js';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ResultItem =
  | { kind: 'team';   id: string; name: string; url: string }
  | { kind: 'sprint'; id: string; name: string; url: string; status: string }
  | { kind: 'task';   id: string; name: string; url: string; progress: string };

const KIND_ICON = {
  team:   <Users size={14} />,
  sprint: <Layers size={14} />,
  task:   <FileText size={14} />,
};

const KIND_LABEL = { team: 'Team', sprint: 'Sprint', task: 'Task' };

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [selected, setSelected] = useState(0);
  const debouncedQuery = useDebounce(query, 200);
  const abortRef = useRef<AbortController | null>(null);

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
          ...data.teams.map(t => ({ kind: 'team' as const, id: t.id, name: t.name, url: `/team/${t.id}` })),
          ...data.sprints.map(s => ({ kind: 'sprint' as const, id: s.id, name: s.name, url: `/team/${s.team_id}/sprints/${s.id}`, status: s.status })),
          ...data.tasks.map(t => ({
            kind: 'task' as const, id: t.id, name: t.task,
            url: t.sprint_id ? `/team/${t.team_id}/sprints/${t.sprint_id}` : `/task/${t.id}`,
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
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) open(results[selected]);
  }, [results, selected, open]);

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
                placeholder="Search teams, sprints, tasks…"
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

            {/* Hint */}
            {!query && (
              <div className="px-4 py-3 flex items-center gap-4" style={{ borderTop: '0' }}>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>↑↓</kbd>
                  {' '}navigate
                </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>↵</kbd>
                  {' '}open
                </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>Esc</kbd>
                  {' '}close
                </span>
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
