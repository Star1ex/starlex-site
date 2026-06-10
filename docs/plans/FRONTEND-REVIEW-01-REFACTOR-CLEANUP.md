# Frontend Review Plan 01 — Refactor, Cleanup, Structure, Naming

> Start after reading `FRONTEND-REVIEW-00-START-HERE.md`.  
> Primary goal: make the frontend understandable, typed, reusable, and safe to continue improving without changing the product experience.

This plan focuses on removing duplication, dead code, unclear naming, unsafe wrappers, and oversized files. It must preserve current functionality and the Liquid Glass + Ultra Dark design.

---

## 1. Success Criteria

This plan is done when:

- `npm run build` is green.
- `npm run lint` is green, or only has a tiny documented generated-code exception.
- There is one obvious API client path.
- Old API wrappers and unused compatibility files are removed.
- Task status/priority/project metadata is defined once and reused.
- Large page files are split into focused modules without changing route behavior.
- Sensitive URL/token/profile persistence is reduced.
- No visual redesign is introduced.

---

## 2. First 60 Minutes: Stabilize Before Refactor

### 2.1 Fix the Current Build Break

Target:

- `src/pages/tasks/TaskExplorerPage.tsx`

Current issue:

- TypeScript says `activeWorkspace` may be `null`.

Expected fix:

- Use a null-safe expression or an early return.
- Do not change behavior.

Example intent:

```ts
const role =
  activeWorkspace && activeWorkspace.id === workspaceId
    ? activeWorkspace.role
    : undefined;
```

Then run:

```bash
npm run build
```

### 2.2 Capture Lint Failures

Run:

```bash
npm run lint
```

Classify each lint failure into:

- `delete`: unused legacy file or wrapper;
- `fix`: real bug or unsafe code;
- `move`: Fast Refresh violation because constants/hooks are exported beside components;
- `scope-exception`: generated shadcn component export pattern if changing it would fight the library.

Do not start deleting files until imports are verified with `rg`.

---

## 3. API and Data Layer Cleanup

### 3.1 Choose the Canonical API Client

Canonical path:

- `src/services/api/client.ts`

Likely legacy/duplicate paths to remove or migrate:

- `src/app/api/api.ts`
- `src/app/api/token.ts`
- `src/shared/lib/apiClient.ts`
- old user entity helpers if unused: `src/entities/user.ts`

Execution:

1. Search all imports:

```bash
rg "app/api|shared/lib/apiClient|entities/user|services/api/client" src
```

2. For every import outside `src/services/api/client.ts`, move the caller to the canonical service/client.
3. Delete the old wrapper only after `rg` shows no imports.
4. Re-run build.

Acceptance:

- All HTTP requests go through `src/services/api/client.ts` or a typed service under `src/services/api`.
- No component imports low-level axios directly.
- Access token refresh and CSRF behavior remain centralized.

### 3.2 Normalize Service Naming

Use action names that describe backend intent, not UI wording.

Recommended service method naming:

- `queryTasks(workspaceId, params)`
- `getTaskCategories(workspaceId, params)`
- `createTask(workspaceId, payload)`
- `updateTask(taskId, patch)`
- `setTaskStatus(taskId, status)`
- `setTaskPosition(taskId, payload)`
- `setTaskAssignees(taskId, userIds)`
- `setTaskLabels(taskId, labelIds)`
- `setTaskDueDate(taskId, isoDateOrNull)`
- `updateProject(projectId, patch)`
- `setProjectStatus(projectId, status)`
- `setProjectPriority(projectId, priority)`

Rules:

- Avoid duplicate names with different meanings.
- Avoid `updateTaskStatus(id, progress)` if status now means the enum `todo | in_progress | ...`.
- Payload and response DTOs must live near the service or in a shared `types` module, not inside pages.

### 3.3 Remove Broad `any`

Targets seen during review:

- `src/contexts/AuthContext.tsx`
- auth pages;
- markdown preview/editor wrappers;
- old API wrappers;
- `src/shared/lib/authManager.ts`

Execution:

1. Delete unused files first. Do not spend time typing dead code.
2. Replace `any` with known DTOs where backend responses are stable.
3. For unknown external payloads, use `unknown`, validate/narrow, then use typed values.
4. For JWT payload decoding, define the narrow fields actually used:

```ts
type AccessTokenPayload = {
  sub?: string;
  email?: string;
  exp?: number;
};
```

Acceptance:

- New code has no `any`.
- Existing `any` is either removed or converted to a narrow type.
- No data path becomes less safe to satisfy lint.

---

## 4. Security-Sensitive Frontend Cleanup

This is frontend hardening. It does not replace backend security.

### 4.1 Stop Putting Access Tokens In WebSocket URLs

Target:

- `src/shared/lib/realtime.ts`

Current concern:

- WebSocket connection includes `token=` in the URL query string.
- Query strings can leak through logs, browser history tooling, reverse proxies, crash reports, or analytics.

Preferred options, in order:

1. If backend supports cookie-authenticated WebSocket, use cookies and remove token query param.
2. If backend supports a short-lived WebSocket ticket endpoint, request a ticket and pass only that ticket.
3. If backend currently only supports query token, isolate the behavior behind one function and add a TODO tied to a backend change.

Acceptance:

- No raw long-lived access token is assembled into a visible URL when a supported alternative exists.
- Reconnect/backoff behavior stays intact.

### 4.2 Sanitize Last-Visited URL Storage

Target:

- `src/app/LastVisitedManager.tsx`

Current concern:

- Full current URL is saved to a cookie.
- Full URLs may include invite tokens, reset tokens, auth codes, workspace invite links, etc.

Required behavior:

- Store only safe internal pathnames.
- Drop query parameters by default.
- Allowlist harmless query keys only if needed for UX.
- Never store paths for:
  - auth callback routes;
  - invite accept routes with tokens;
  - password reset routes;
  - email verification routes;
  - OAuth routes;
  - any route containing `token`, `code`, `secret`, `invite`, `reset`.

Acceptance:

- Cookie cannot contain sensitive query values.
- Last-visited redirect still works for normal workspace/task pages.

### 4.3 Reconsider User Profile In `localStorage`

Target:

- `src/shared/lib/authManager.ts`

Current concern:

- User profile data is stored in `localStorage`.
- This is usually not catastrophic, but it broadens XSS impact.

Preferred behavior:

- Keep access tokens in memory.
- Keep refresh in httpOnly cookie.
- Store only non-sensitive display cache if needed, such as display name/avatar, and clear it on logout.
- Prefer fetching `/me` after refresh/session restore if backend supports it.

Acceptance:

- No credentials or sensitive auth artifacts are stored in localStorage.
- Logout clears all auth-related local storage keys.

---

## 5. Shared Domain Metadata

### 5.1 Create One Task Metadata Module

Problem:

- Status, priority, colors, labels, board columns, filters, and pills tend to drift when each page defines them locally.

Create:

- `src/entities/task/model/taskMeta.ts`

Suggested contents:

```ts
export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "canceled",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_META: Record<TaskStatus, {
  label: string;
  shortLabel: string;
  tone: "neutral" | "progress" | "review" | "success" | "muted";
  columnTitle: string;
}> = { ... };
```

Also define:

- `TASK_PRIORITIES`
- `TASK_PRIORITY_META`
- helper `isTaskStatus(value): value is TaskStatus`
- helper `normalizeTaskStatus(value)`

Use this module in:

- task explorer;
- task detail;
- task board;
- status menu;
- filters;
- saved views;
- CSS class mapping;
- test fixtures.

Acceptance:

- Changing a status label requires one edit.
- No page owns its own status array.

### 5.2 Create One Project Metadata Module

Create:

- `src/entities/project/model/projectMeta.ts`

Suggested contents:

- project statuses;
- project priorities;
- lifecycle labels;
- icon/color tone helpers;
- permission helper if it is project-specific.

Acceptance:

- Project header, project list, project filter, and settings use the same status/priority definitions.

---

## 6. Page Decomposition Plan

Do not rewrite the whole page in one patch. Split by stable seams and keep behavior unchanged after each step.

### 6.1 Task Explorer

Target:

- `src/pages/tasks/TaskExplorerPage.tsx`

Goal:

- Page file becomes orchestration only: params, data hook, layout composition.

Create:

- `src/pages/tasks/explorer/TaskExplorerHeader.tsx`
- `src/pages/tasks/explorer/TaskExplorerFilters.tsx`
- `src/pages/tasks/explorer/TaskExplorerSavedViews.tsx`
- `src/pages/tasks/explorer/TaskExplorerList.tsx`
- `src/pages/tasks/explorer/TaskExplorerBoard.tsx`
- `src/pages/tasks/explorer/TaskExplorerEmptyState.tsx`
- `src/pages/tasks/explorer/useTaskExplorerQuery.ts`
- `src/pages/tasks/explorer/useTaskExplorerUrlState.ts`

Rules:

- URL state belongs in `useTaskExplorerUrlState`.
- Backend query mapping belongs in `useTaskExplorerQuery`.
- List row UI does not fetch.
- Board UI does not fetch.
- Filter components emit typed filter changes only.

Acceptance:

- Main page file should ideally be under 200 lines.
- No child component knows about router internals unless it is the URL-state hook.

### 6.2 Task Detail

Target:

- `src/pages/tasks/TaskDetailPage.tsx`

Create:

- `src/pages/tasks/detail/TaskDetailHeader.tsx`
- `src/pages/tasks/detail/TaskPropertiesPanel.tsx`
- `src/pages/tasks/detail/TaskDescriptionEditor.tsx`
- `src/pages/tasks/detail/TaskSubtasks.tsx`
- `src/pages/tasks/detail/TaskActivityPanel.tsx` if activity exists;
- `src/pages/tasks/detail/useTaskDetail.ts`
- `src/pages/tasks/detail/useTaskAutosave.ts`

Rules:

- The detail page owns routing and high-level save lifecycle.
- Property controls are reusable and do not hardcode route params.
- Editor loading can later be lazy-loaded by the performance plan.

Acceptance:

- Opening, editing, and saving a task behaves the same.
- Rich editor is isolated enough to lazy-load later.

### 6.3 Workspace Projects

Target:

- `src/pages/workspace/WorkspaceProjects.tsx`

Create:

- `src/pages/workspace/projects/WorkspaceProjectsHeader.tsx`
- `src/pages/workspace/projects/ProjectList.tsx`
- `src/pages/workspace/projects/ProjectRow.tsx`
- `src/pages/workspace/projects/ProjectActionsMenu.tsx`
- `src/pages/workspace/projects/useWorkspaceProjects.ts`

Rules:

- Row rendering should be dumb and stable.
- Menus use shared project metadata and shared permission helpers.
- No project mutation logic inside list row markup.

Acceptance:

- Project list looks and behaves the same.
- Add/edit/status/priority/delete paths are easier to find.

### 6.4 Task Board

Target:

- `src/features/taskBoard/TaskBoard.tsx`

Split into:

- `src/features/taskBoard/TaskBoard.tsx`
- `src/features/taskBoard/TaskBoardColumn.tsx`
- `src/features/taskBoard/TaskBoardCard.tsx`
- `src/features/taskBoard/TaskDragOverlay.tsx`
- `src/features/taskBoard/useTaskBoardDnd.ts`
- `src/features/taskBoard/taskBoardOrdering.ts`

Rules:

- DnD math goes in hooks/utilities.
- Card UI stays small.
- Board accepts typed callbacks:
  - `onStatusChange(taskId, status)`
  - `onReorder(taskId, payload)`
  - `onOpenTask(taskId)`

Acceptance:

- Board can be reused by project page and workspace task explorer.
- DnD behavior remains smooth.

---

## 7. UI Primitive Consolidation

### 7.1 Pick One Primitive Layer

The project already uses shadcn. Keep it as the behavior/accessibility base.

Rule:

- Use `src/components/ui/*` for shadcn primitives.
- Use `src/shared/ui/*` for Starlex product components built on top of those primitives.
- Do not create duplicate dropdown/select/modal implementations if shadcn already provides them.

Likely cleanup target:

- `src/shared/ui/Dropdown.tsx` if unused or inferior to shadcn dropdown-menu.

Execution:

1. Search imports:

```bash
rg "shared/ui/Dropdown|components/ui/dropdown|components/ui/select" src
```

2. Migrate callers to shadcn-backed product components.
3. Delete unused primitive wrappers.

Acceptance:

- One dropdown behavior path.
- One select behavior path.
- Starlex-specific styling lives in wrapper components/classes, not copied primitive logic.

### 7.2 Product-Level Reusable Components

Create or normalize:

- `src/shared/ui/GlassPanel.tsx`
- `src/shared/ui/GlassButton.tsx` if class-only usage is too inconsistent;
- `src/shared/ui/EmptyState.tsx`
- `src/shared/ui/InlineError.tsx`
- `src/shared/ui/LoadingRows.tsx`
- `src/features/taskStatus/StatusMenu.tsx`
- `src/features/taskPriority/PriorityMenu.tsx`
- `src/features/labels/LabelPicker.tsx`
- `src/features/assignees/AssigneePicker.tsx`

Keep these focused. Do not create a huge "common components" folder.

Acceptance:

- Repeated task row/status/priority/empty/loading UI is not copied across pages.

---

## 8. Context and State Cleanup

### 8.1 Auth Initialization

Targets:

- `src/contexts/AuthContext.tsx`
- `src/app/routes.tsx`
- `RequireAuth`

Concern:

- Auth/client initialization appears to happen in more than one place.

Goal:

- AuthProvider performs session restore/init exactly once.
- Route guard consumes auth state and renders:
  - loading;
  - redirect unauthenticated;
  - children authenticated.

Acceptance:

- No route-level extra API client initialization unless strictly required.
- No double refresh request on initial load.

### 8.2 Workspace State

Target:

- `src/contexts/WorkspaceContext.tsx`

Concerns:

- Effects set state in patterns that lint/compiler dislikes.
- Workspace accent side effects are mixed with workspace data state.

Goal:

- Keep active workspace data and visual accent side effects separated.
- Avoid effects that immediately set derived state where `useMemo` or initialization can do it.
- Persist only the last workspace ID, not large workspace objects.

Acceptance:

- No hook/compiler lint errors.
- Workspace switch does not reuse stale tasks/projects from the previous workspace.

---

## 9. CSS Structure Cleanup Without Redesign

Do not change the visual system in this plan. Only split and prepare.

Current issue:

- `src/index.css` is too large and mixes unrelated concerns.

Create:

- `src/styles/tokens.css`
- `src/styles/base.css`
- `src/styles/glass.css`
- `src/styles/shadcn.css`
- `src/styles/layout.css`
- `src/styles/components.css`
- `src/styles/themes/ultra-dark.css`
- `src/styles/themes/light.css` as a placeholder for plan 03

Then import these from `src/index.css` in a clear order:

```css
@import "./styles/tokens.css";
@import "./styles/shadcn.css";
@import "./styles/base.css";
@import "./styles/glass.css";
@import "./styles/layout.css";
@import "./styles/components.css";
@import "./styles/themes/ultra-dark.css";
@import "./styles/themes/light.css";
```

Rules:

- This phase is mechanical.
- Do not recolor the app here.
- Keep selectors stable.
- Avoid deleting a class unless `rg` confirms it is unused.

Acceptance:

- Same visual output.
- CSS is navigable.
- Theme plan can work with semantic files instead of a 3,000+ line monolith.

---

## 10. Dead Code Removal Checklist

Run:

```bash
rg "folder|Folder|useFolders|moveTaskToFolder" src
rg "MarkdownEditor" src
rg "TaskView" src
rg "shared/lib/apiClient|app/api/api|app/api/token" src
rg "UserProfilePage|UserProfile" src
```

For each candidate:

1. Confirm whether it is imported.
2. Confirm whether a route still points to it.
3. Confirm whether it has a modern replacement.
4. Delete only when all callers are migrated.
5. Re-run build.

Likely removals after migration:

- dead folder service/hooks;
- duplicate markdown editor stub if `features/markdown/RichEditor.tsx` is canonical;
- legacy API wrappers;
- duplicate profile page if one route is canonical;
- unused hooks such as `useTasks.ts` only if no route uses them.

Acceptance:

- `rg` confirms removed symbols are gone.
- Deleted files are not referenced by routes, tests, or exports.

---

## 11. Suggested Implementation Sequence

1. Fix current build error.
2. Delete or migrate unused API wrappers.
3. Fix or delete lint-problem legacy files.
4. Extract task and project metadata modules.
5. Extract reusable task status/priority UI.
6. Split TaskExplorer into subcomponents and hooks.
7. Split TaskDetail into subcomponents and isolate editor.
8. Split WorkspaceProjects and TaskBoard.
9. Sanitize last-visited URL storage.
10. Improve WebSocket token handling if backend supports it, otherwise isolate and document the constraint.
11. Split CSS files mechanically.
12. Run full verification.

---

## 12. Verification

Run from `react-frontend`:

```bash
npm run build
npm run lint
```

Manual route checks:

- sign in / auth gate;
- workspace home;
- project page;
- task explorer;
- task detail;
- settings modal;
- workspace switch;
- task status change;
- board drag if available;
- logout.

Final note must include:

- files deleted;
- files split;
- canonical API/client decision;
- remaining intentional debt;
- build/lint result.

