export type RecentItemType = 'team' | 'sprint' | 'task';

export interface RecentItem {
  id: string;
  name: string;
  url: string;
  type: RecentItemType;
  subtitle?: string;
  openedAt: number;
}

const KEY = 'tt_recent_items';
const MAX_PER_TYPE = 5;

function load(): RecentItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: RecentItem[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}

export function trackItem(item: Omit<RecentItem, 'openedAt'>): void {
  const all = load();
  const filtered = all.filter((i) => !(i.id === item.id && i.type === item.type));
  const next = [{ ...item, openedAt: Date.now() }, ...filtered]
    .filter((i) => i.type !== item.type || true) // keep all types
    .reduce<RecentItem[]>((acc, i) => {
      const countOfType = acc.filter((x) => x.type === i.type).length;
      if (countOfType < MAX_PER_TYPE) acc.push(i);
      return acc;
    }, []);
  save(next);
}

export function getRecentByType(type: RecentItemType): RecentItem[] {
  return load()
    .filter((i) => i.type === type)
    .sort((a, b) => b.openedAt - a.openedAt)
    .slice(0, MAX_PER_TYPE);
}

export function getAllRecent(): { teams: RecentItem[]; sprints: RecentItem[]; tasks: RecentItem[] } {
  const all = load().sort((a, b) => b.openedAt - a.openedAt);
  return {
    teams:   all.filter((i) => i.type === 'team').slice(0, MAX_PER_TYPE),
    sprints: all.filter((i) => i.type === 'sprint').slice(0, MAX_PER_TYPE),
    tasks:   all.filter((i) => i.type === 'task').slice(0, MAX_PER_TYPE),
  };
}
