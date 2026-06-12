import type { TaskQueryParams } from '@/types/dto.js';

export interface SavedView {
  id: string;
  name: string;
  params: TaskQueryParams;
  displayMode?: 'list' | 'board';
  isDefault?: boolean;
}

const DEFAULT_VIEWS: SavedView[] = [
  { id: 'my-open',   name: 'My open',       params: { sort_by: 'updated_at', direction: 'desc' }, isDefault: true },
  { id: 'due-soon',  name: 'Due soon',       params: { sort_by: 'due_date', direction: 'asc' } },
  { id: 'backlog',   name: 'Backlog',        params: { status: 'backlog', sort_by: 'created_at', direction: 'desc' } },
  { id: 'recent',    name: 'Recently updated', params: { sort_by: 'updated_at', direction: 'desc' } },
];

const STORAGE_KEY = 'starlex-saved-views';

function loadCustomViews(): SavedView[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedView[]) : [];
  } catch {
    return [];
  }
}

function saveCustomViews(views: SavedView[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
}

export function getAllViews(): SavedView[] {
  return [...DEFAULT_VIEWS, ...loadCustomViews()];
}

export function saveView(view: SavedView): void {
  const custom = loadCustomViews();
  const idx = custom.findIndex(v => v.id === view.id);
  if (idx >= 0) {
    custom[idx] = view;
  } else {
    custom.push(view);
  }
  saveCustomViews(custom);
}

export function deleteView(id: string): void {
  const custom = loadCustomViews().filter(v => v.id !== id);
  saveCustomViews(custom);
}
