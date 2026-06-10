type PreloadFn = () => Promise<unknown>;

const preloaded = new Map<string, Promise<unknown>>();

function preload(key: string, load: PreloadFn) {
  if (preloaded.has(key)) return;

  const request = load().catch((error: unknown) => {
    preloaded.delete(key);
    throw error;
  });

  preloaded.set(key, request);
  void request.catch(() => {});
}

export function preloadWorkspaceShell() {
  preload('workspace-shell', () => import('@/pages/workspace/WorkspacePage.js'));
}

export function preloadProjectShell() {
  preload('project-shell', () => import('@/pages/workspace/ProjectPage.js'));
}

export function preloadTaskExplorerShell() {
  preload('task-explorer-shell', () => import('@/pages/tasks/TaskExplorerPage.js'));
}

export function preloadTaskDetailShell() {
  preload('task-detail-shell', () => import('@/pages/tasks/TaskDetailPage.js'));
}

export function preloadMembersShell() {
  preload('members-shell', () => import('@/features/members/MembersPage.js'));
}

export function preloadMyIssuesShell() {
  preload('my-issues-shell', () => import('@/pages/tasks/MyIssuesPage.js'));
}

export function preloadTaskBoard() {
  preload('task-board', () => import('@/features/taskBoard/TaskBoard.js'));
}

export function preloadSettingsModal() {
  preload('settings-modal', () => import('@/widgets/SettingsModal/SettingsModal.js'));
}

export function preloadSearchModal() {
  preload('search-modal', () => import('@/widgets/SearchModal/SearchModal.js'));
}

export function preloadCoreWorkspaceRoutes() {
  preloadWorkspaceShell();
  preloadProjectShell();
}
