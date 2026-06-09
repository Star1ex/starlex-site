# Session 1 — Functionality: make every backend capability work in the UI

> Read `00-OVERVIEW.md` first (state + contracts §4 + permissions §4.6 + skills §6).
> **Theme of this session:** the app must *work*. Wire status, roles, the task explorer, a real
> members surface, and a smooth board. Build on the existing glass atoms — don't invent new styling
> here (that's Session 2), but never ship an old-theme screen either.
> **Skills:** `/shadcn` (dropdown-menu, select, popover, dialog, command, context-menu, tabs),
> `frontend-patterns` (optimistic data flow), `vercel:react-best-practices` (effects/dnd hooks),
> `coding-standards`. Skin new primitives with `liquid-glass-design` tokens already in `index.css`.
> End green: `npm run type-check && npm run build`.

---

## Goal
Close the functional gap. After this session a user can, end-to-end and persisted:
change a task's status (menu **and** by dragging on the board), change a project's status/priority,
manage members + roles + invites on a real screen, browse/filter all workspace tasks in a task
explorer, and open a task in a proper detail view. No dead folder code remains.

## Tasks

### 1. Service layer — close the API gaps  *(`src/services/api/`)*
Audit each service against `00-OVERVIEW.md` §4. Add what's missing, typed (no `any`):
1. **`project.service.ts`:** add `updateProjectStatus(projectId, status)` and
   `updateProjectPriority(projectId, priority)` (or one `updateProject` patch that accepts
   `status`/`priority`). Back them with `PATCH /api/projects/:id`. Export from `index.ts`.
2. **`task.service.ts`:** confirm `updateTaskStatus` hits `PATCH /api/tasks/:id/status` with the
   **status enum** (not progress) — there's an older progress-based `updateTaskStatus(id, progress)`;
   make the enum path the canonical one and name it clearly (`setTaskStatus(id, status)`). Add
   `setTaskPosition(id, { position, status? })` → `PATCH /tasks/:id/position`,
   `setTaskAssignees(id, userIds)` → `/assignees`, `setTaskDueDate(id, iso|null)` → `/due-date`,
   `setTaskLabels(id, labelIds)` → `/labels`. Keep `queryTasks` + add `getTaskCategories(workspaceId, params)`.
3. **`workspace.service.ts`:** confirm members CRUD + invites (`createInvite`, `getInvite`,
   `acceptInvite`) exist and are typed to §4.3.
4. Verify DTOs in `src/types/dto.ts` match §4.4–4.5 (Task `assignees: User[]` objects, `labels`,
   `due_date`, `key`, `status` enum). Fix any `string[]` assignee leftover.

### 2. Kill the dead folder code  *(do this early — it removes noise)*
- Delete `src/services/api/folder.service.ts`, `src/hooks/useFolders.ts`.
- Remove `moveTaskToFolder` from `task.service.ts` and all folder refs in `useTasks.ts`,
  `services/api/index.ts`, and any importing component.
- Grep `folder` across `src/` and remove every remaining reference (nav, payloads, types).
- type-check must stay green after removal. Commit: `refactor(frontend): remove dead folder code`.

### 3. Task status — menu mutation  *(everywhere a task is shown)*
- Build a reusable **`StatusMenu`** (`src/features/taskStatus/StatusMenu.tsx`): a `/shadcn`
  **dropdown-menu** (or **select**) of the 6 statuses, each with its status-pill color, current one checked.
- On select → optimistic update + `taskService.setTaskStatus(id, status)`; on error revert + toast.
- Gate by permissions (`canEditTask`) — `guest` sees a read-only pill, no menu.
- Use it in: task explorer rows, board cards, task detail, MyIssues rows. One component, reused.

### 4. Board drag-and-drop — make it smooth & persistent  *(`ProjectBoard.tsx` + new explorer board)*
The dnd skeleton exists; finish it to Linear quality:
- Use `@dnd-kit` with a **`DragOverlay`** so the dragged card follows the cursor with a slight lift.
- **Visual drop target:** highlight the hovered column with an accent border/glow (per `00-OVERVIEW.md`
  §5), not a full gradient. Show an insertion gap where the card will land.
- **Cross-column drop** → optimistic move + `setTaskStatus`; **within-column reorder** → optimistic +
  `setTaskPosition`. Reconcile on response; revert + toast on failure. Dedupe against realtime
  `task.moved` events by `actor_id`.
- `PointerSensor` with an activation distance (so clicks still open the card); `KeyboardSensor` for a11y.
- `guest` cannot drag (sensors disabled). Respect `prefers-reduced-motion` (no overlay spring).
- Extract the board into a reusable `src/features/taskBoard/TaskBoard.tsx` consumed by both the
  project page and the workspace task explorer (don't duplicate dnd logic).

### 5. Task explorer page  *(`src/pages/tasks/TaskExplorerPage.tsx` + route)*
The biggest missing surface. Backed by `/tasks/query` + `/tasks/categories` (never client-side filtering):
- **Route:** `/workspace/:workspaceId/tasks` (add to `app/routes.tsx`, inside `Layout`). Add a
  **Projects/Tasks** entry to the sidebar nav.
- **Layout** (per `00-OVERVIEW.md` §5 + design §7): header row → saved-view tabs → filter/search row →
  content (list **or** board toggle), with an optional left filter rail (`260–300px` glass card).
- **Filter rail** groups: Project, Status, Priority, Assignee, Label, Due — counts from
  `/tasks/categories`. Selecting a facet hydrates `/tasks/query`. `__none` labels are human
  ("No project", "Unassigned"). Multi-select via small check indicators.
- **Saved-view tabs** (reuse `shared/lib/savedViews.ts`): My open, Due soon, Backlog, By project,
  Recently updated, plus user-created. A view = query params + display mode (list/board), not a folder.
- **URL is the state:** keep `view, status, project_id, priority, assignee_id, label_id, due, q,
  sort_by, direction, cursor` in the query string so links are shareable and back works.
- **List view:** dense rows (52–64px): key (JetBrains mono, tabular-nums, white/50), title, `StatusMenu`,
  priority chip, assignee avatars, label chips (+N overflow), due date (warm only when overdue/soon).
- **Board view:** reuse `TaskBoard` from task #4, kanban by status.
- All states handled: loading skeletons, empty ("No tasks match"), error with retry.
- Wire MyIssues to reuse the same data layer (`assignee_id={me}`), don't fork query logic.

### 6. Members management surface  *(`src/features/members/` + route)*
- Promote `MembersPanel` to a real managed surface. Add route `/workspace/:workspaceId/members`
  (inside `Layout`) **and** keep the compact preview in `WorkspacePage` (preview links to the page).
- Capabilities (gate every mutation by `workspace.role` via `permissions.ts`):
  - List members with **role badges** + joined date.
  - **Add by email** (`POST /members`, admin+), with `assignee must belong to workspace`-style error handling.
  - **Change role** via a `/shadcn` select/dropdown (`PATCH /members/:userId`, admin+); owner row is
    protected (can't demote the last owner — disable + tooltip).
  - **Remove member** (`DELETE`), with a confirm dialog (`/shadcn` alert-dialog).
  - **Invite link** generator (`POST /invites` → copyable URL + toast "copied"); choose role + expiry.
- `guest`/`member` see a read-only roster (no mutate controls).
- Confirm `InviteAcceptPage` flow works end-to-end (preview → accept → land in workspace).

### 7. Project header — lifecycle controls  *(`ProjectHeader.tsx`)*
- Wire **status** + **priority** controls using the new service methods (`/shadcn` select, skinned glass).
- Show only for project leader or workspace `admin+` (else read-only pills).
- Edit-project (name/desc/icon/color/leader/deadline/goal) via a glass dialog; delete-project with confirm.
- Optimistic update + toast; reconcile against realtime `project.updated`.

### 8. Task detail — replace legacy `TaskView`  *(`src/pages/tasks/TaskDetailPage.tsx`)*
- The 467-line legacy `src/components/Tasks/TaskView.tsx` is the current `/task/*` route — replace it.
- New glass detail page: title (inline-editable), `StatusMenu`, priority, assignee picker (workspace
  members only), labels (`LabelPicker`), due-date picker, subtasks, and the **description** via the
  existing `features/markdown/RichEditor.tsx` (drop the `components/MarkdownEditor.tsx` stub).
- Create flow: always `POST /workspaces/:id/tasks` within the **active workspace** — no
  `workspace_id: null` path. Optimistic insert + reconcile against `task.created`.
- Point `/task/new` and `/task/:taskId` routes at the new page; delete the legacy `TaskView` +
  the markdown stub once nothing imports them.

### 9. Sanity wiring
- Active-workspace context drives every mutation (id + role). Switching workspace resets caches.
- Every new mutating control is permission-gated and shows loading/disabled state while pending.

## Acceptance (Session 1 done when…)
- [ ] Change task status from a menu **and** by dragging on the board — both persist + survive reload.
- [ ] Board dnd has a drag overlay, visible drop targets, smooth motion, optimistic + revert-on-error.
- [ ] Change project status & priority from the project header (gated; persists).
- [ ] Members page: add-by-email, change role, remove, generate invite link — all gated & working.
- [ ] Task explorer at `/workspace/:id/tasks`: filter rail + saved views + list/board, all from
      `/tasks/query` + `/tasks/categories`, state in URL. MyIssues reuses the same layer.
- [ ] New glass task-detail page replaces legacy `TaskView`; create runs in active workspace.
- [ ] All dead folder code + the markdown stub deleted; `grep folder src/` is clean.
- [ ] No `any`; new components ≤300 lines; every state handled. `type-check && build` green.

## Suggested commits
`refactor(frontend): remove dead folder code` ·
`feat(frontend): task + project status/role service methods` ·
`feat(frontend): reusable StatusMenu + permission gating` ·
`feat(frontend): smooth dnd task board (overlay + drop targets + position persist)` ·
`feat(frontend): workspace task explorer (query/categories/saved views, list+board)` ·
`feat(frontend): members management page (roles, add, remove, invite links)` ·
`feat(frontend): project lifecycle controls` ·
`feat(frontend): glass task detail page` · `refactor(frontend): delete legacy TaskView + markdown stub`
