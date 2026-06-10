import {
  Filter,
  LayoutGrid,
  List,
  Search,
  X,
} from 'lucide-react';
import { preloadTaskBoard } from '@/app/routePreload.js';

export type TaskExplorerViewMode = 'list' | 'board';

interface TaskExplorerToolbarProps {
  localQ: string;
  activeFilterCount: number;
  showRail: boolean;
  viewMode: TaskExplorerViewMode;
  onSearch: (q: string) => void;
  onToggleRail: () => void;
  onViewModeChange: (mode: TaskExplorerViewMode) => void;
  onClearAll: () => void;
}

export function TaskExplorerToolbar({
  localQ,
  activeFilterCount,
  showRail,
  viewMode,
  onSearch,
  onToggleRail,
  onViewModeChange,
  onClearAll,
}: TaskExplorerToolbarProps) {
  return (
    <div className="tasks-toolbar">
      <div className="tasks-search">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--sx-text-subtle)] pointer-events-none" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={localQ}
          onChange={(e) => onSearch(e.target.value)}
          className="glass-input w-full pl-8 pr-8 py-1.5 text-label-sm rounded-xl"
        />
        {localQ && (
          <button onClick={() => onSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text-muted)]">
            <X size={12} />
          </button>
        )}
      </div>

      <button
        onClick={onToggleRail}
        className="tasks-toolbar-button"
        data-active={showRail ? 'true' : undefined}
      >
        <Filter size={13} />
        Filters
        {activeFilterCount > 0 && (
          <span>
            {activeFilterCount}
          </span>
        )}
      </button>

      <div className="tasks-view-toggle">
        <button
          onClick={() => onViewModeChange('list')}
          data-active={viewMode === 'list' ? 'true' : undefined}
        >
          <List size={14} />
        </button>
        <button
          onMouseEnter={preloadTaskBoard}
          onFocus={preloadTaskBoard}
          onClick={() => onViewModeChange('board')}
          data-active={viewMode === 'board' ? 'true' : undefined}
        >
          <LayoutGrid size={14} />
        </button>
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={onClearAll}
          className="tasks-clear-button"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
