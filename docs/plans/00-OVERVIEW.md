# Starlex Frontend Finish — Master Plan & Sequencing

> Owner: critiq17 · Branch base: `feature/projects` · Date: 2026-06-09
> **Backend is done and healthy — do not touch it.** This program finishes the **frontend** only.
> Three focused, sequential sessions. Each is one Sonnet working session, self-contained, ends green.
>
> - `SESSION-1-FUNCTIONALITY.md` — wire every missing feature so the app actually *works*.
> - `SESSION-2-DESIGN-SYSTEM.md` — rebuild the look on shadcn/ui + Liquid Glass; kill the ugly old-theme pages.
> - `SESSION-3-POLISH-QA.md` — motion, keyboard, responsive, cleanup, final verification.
>
> Read this file first. It holds the honest current state, the frozen API contracts the
> backend already exposes, the design tokens, and the skill toolkit each session must use.

---

## 1. Why this plan exists

Yesterday's rebuild got the **scaffolding** in (glass tokens, app shell, onboarding, routing,
split pages, dnd board skeleton, settings/profile stubs, realtime hooks). It **builds and
type-checks clean**, but it's a "троечка":

- Half the backend power is **not wired** into the UI (project status, smooth board dnd, a real
  task explorer, a real members-management surface).
- The design is **inconsistent** — the shell is glass, but Profile + Settings are still old
  inline-`var(--bg-primary)` themes that look bad. shadcn/ui is installed but barely used.
- Dead code (folders) and duplicate components (two Profile pages, two markdown editors,
  a 467-line legacy `TaskView`) still ship.

Goal: turn it into a **Linear-grade, fully-functional, uniformly glass** task manager.

## 2. Honest current state (verified 2026-06-09)

**Build/type:** `npm run type-check` → 0 errors. `npm run build` → green. Keep it that way every session.

**✅ Done & keep:**
- Liquid-Glass tokens live in `src/index.css` (`.glass-card`, `.liquid-button`, `.glass-input`,
  Hanken Grotesk / Inter / JetBrains Mono, accent var). Playfair removed.
- shadcn/ui installed (`components.json`, style `radix-nova`, lucide icons, `@/lib/utils`, CVA, tailwind-merge).
- App shell: `widgets/Layout`, `widgets/GlobalSidebar`, `widgets/Topbar`, `widgets/SettingsModal`.
- Onboarding (`pages/onboarding`) + workspace-as-dashboard routing (`DashboardRedirect`).
- `WorkspacePage` split (`WorkspaceBento`/`WorkspaceProjects`/`WorkspaceWelcome`); `ProjectPage`
  split (`ProjectBoard`/`ProjectHeader`/`ProjectTaskList`).
- `features/members/MembersPanel.tsx` (uses `workspaceService.updateMemberRole`).
- `ProjectBoard.tsx` — `@dnd-kit` board skeleton calling `taskService.updateTaskStatus` (status PATCH).
- Settings pages (Appearance, ChangePassword, ConnectedAccounts, EmailChange, GeneralSettings,
  LabelsManager, NotificationsSettings, SecuritySessions, WorkspaceSettings).
- `pages/tasks/MyIssuesPage.tsx` (uses `taskService.queryTasks`).
- `pages/invite/InviteAcceptPage.tsx`, realtime (`shared/lib/realtime.ts`, `useRealtime`, `usePresence`),
  `shared/lib/workspaceIcon.tsx`, `shared/lib/permissions.ts`, `shared/lib/savedViews.ts`.

**❌ Broken / missing (the work):**
- **No task explorer page** — `queryTasks`/`categories` exist server-side, but there's no
  `/workspace/:id/tasks` page with filter rail, saved-view tabs, list+board. Only MyIssues uses query.
- **Members has no home** — `MembersPanel` is only embedded in `WorkspacePage`; no dedicated
  manageable surface/route; invite-link generation + role gating unproven.
- **Project status can't change** — `project.service.ts` has `updateProject` but **no status/priority
  mutation method**; project header can't move a project through its lifecycle.
- **Board dnd is rough** — no drag overlay, no visual drop target, optimistic reconcile is shaky,
  position persistence (`PATCH /tasks/:id/position`) not wired.
- **Legacy `TaskView` (467 lines)** is still the `/task/*` route — old, non-glass, over the 300-line rule.
- **Two Profile pages** (`UserProfile.tsx` + `UserProfilePage.tsx`), both old inline-var themes → ugly.
- **Settings pages** are functional but visually old/inconsistent — need the glass rewrite.
- **Dead folder code** still present: `services/api/folder.service.ts`, `hooks/useFolders.ts`,
  `moveTaskToFolder`, folder refs in `task.service.ts`/`useTasks.ts`. Folders are gone backend-side.
- **Duplicate markdown editors** — `components/MarkdownEditor.tsx` (stub) vs `features/markdown/RichEditor.tsx`.

## 3. Session sequencing

| Session | Theme | Gate (Definition of Done) |
|---------|-------|---------------------------|
| **1** | **Functionality** — wire every backend capability into working UI | Status (task+project), roles, members surface, task explorer, smooth board dnd all work end-to-end; dead folder code removed; legacy `TaskView` replaced. type-check + build green. |
| **2** | **Design system** — shadcn + Liquid Glass everywhere; rewrite Profile + Settings | Atoms composed on shadcn primitives + glass; Profile and all Settings panels rewritten to the glass spec; no old-theme page remains; one consistent look. green. |
| **3** | **Polish & QA** — motion, keyboard, responsive, cleanup, verify | Micro-interactions, command palette, empty/loading/error states, responsive, a11y, duplicate/legacy code gone, manual + e2e verification of core flows. green. |

Run them **in order**. Session 2 styles the surfaces Session 1 built (through shared atoms, so the
restyle propagates — minimal rework). Session 3 only polishes what already works and looks right.

**Rule of thumb every session:** build new UI on the existing glass atoms + shadcn primitives from
the first line — never ship a temporary old-theme screen "to fix later."

## 4. Frozen backend contracts (already implemented — code against these)

### 4.1 Auth & session
- `POST /api/auth/register` `{ email }` → `{ pending: true }`, sets `device_id` cookie.
- `POST /api/auth/verify` `{ email, code }` → `{ access_token, needs_onboarding }`, device-bound refresh cookie.
- `POST /api/auth/login` → `{ access_token, needs_onboarding }` (`needs_onboarding = workspace_count==0`).
- `POST /api/auth/logout` → 204, revokes device session. **Await before redirect to `/sign-in`.**
- `GET /api/auth/sessions` · `DELETE /api/auth/sessions/:id` → device sessions (Settings → Security).

### 4.2 Workspace
```jsonc
Workspace { id, name, description, icon, color, role /* owner|admin|member|guest */,
            member_count, project_count, created_at }
```
- `POST /api/workspaces` `{ name, icon?, color? }` → caller becomes `owner` (the onboarding call).
- `GET /api/users/workspaces` → Workspace[] (onboarding decision + sidebar list).
- `PATCH /api/workspaces/:id` (name/description/icon) · `PATCH /api/workspaces/:id/color`.

### 4.3 Members, roles, invites
- Roles per workspace: `owner | admin | member | guest`.
- `GET /api/workspaces/:id/members` → `[{ user, role, joined_at }]`.
- `POST /api/workspaces/:id/members` `{ email, role }` (admin+).
- `PATCH /api/workspaces/:id/members/:userId` `{ role }` (admin+).
- `DELETE /api/workspaces/:id/members/:userId`.
- `POST /api/workspaces/:id/invites` `{ role, expires_in_hours?, max_uses? }` → `{ token, url }`.
- `GET /api/invites/:token` → `{ workspace:{name,icon,color}, valid }`.
- `POST /api/invites/:token/accept` → joins caller, returns Workspace.

### 4.4 Projects
```jsonc
Project { id, workspace_id, name, description, icon, color, status, priority,
          leader, deadline?, goal?, member_ids, created_at }
```
- `GET /api/workspaces/:id/projects` · `POST /api/workspaces/:id/projects`.
- `PATCH /api/projects/:id` (name/desc/icon/color/**status**/**priority**/leader/deadline/goal).
- Project management = project leader or workspace `admin+`.

### 4.5 Task (extended)
```jsonc
Task { id, key /* "WS3-128" */, workspace_id, project_id?, title, description, icon,
       status /* backlog|todo|in_progress|in_review|done|canceled */,
       priority /* none|low|medium|high|urgent */, progress /* 0..100 */,
       due_date?, labels:[{id,name,color}], assignees:[User], subtasks:[Subtask],
       position, created_at, updated_at, creator }
```
- **Query (use this for all list/board/my-issues):** `GET /api/workspaces/:id/tasks/query` —
  filters `project_id, sprint_id, status, priority, assignee_id, label_id, q, due_from, due_to`;
  sort `updated_at|created_at|due_date|priority|status|key`; cursor pagination `next_cursor`.
- **Facets:** `GET /api/workspaces/:id/tasks/categories` → counts for projects/statuses/priorities/assignees/labels/due buckets.
- Mutations: `PATCH /api/tasks/:id/status` · `/labels` · `/due-date` · `/position` · `/assignees` (additive).
- Labels: `GET/POST /api/workspaces/:id/labels` · `PATCH/DELETE /api/labels/:id`.
- **Folders are gone.** No `folder_id`, no folder nav, no personal-task fallback.
- Assignees must be workspace members; backend error `assignee must belong to workspace`.

### 4.6 Permissions (enforce in UI via `shared/lib/permissions.ts`)
- `guest`: read-only — hide create/edit/delete/drag/assign/label controls.
- `member+`: create/edit tasks, assignees, labels-on-task, subtasks, status, due date, position.
- Task delete: creator or workspace `admin|owner`.
- Sprint lifecycle: `admin+`. Project management: project leader or `admin+`.
- Workspace settings/labels/invites/members: `admin+`.

### 4.7 Realtime
- WS `GET /api/ws?workspace_id=…`, authed by access token. Envelope `{ type, workspace_id, payload, actor_id, ts }`.
- Types: `task.created|updated|deleted|moved`, `project.*`, `member.added|removed|role_changed`,
  `discussion.message`, `presence.sync`. Resubscribe on workspace switch; reconnect with backoff;
  dedupe vs local optimistic by `actor_id` + entity id + ts.

## 5. Design tokens (already in `src/index.css` — the canon)

- **Canvas** pure black `#000`. **Panels** `.glass-card` (white 3% bg, `blur(24px)`, 1px white/8%
  border, inner highlight). **Buttons** `.liquid-button`. **Inputs** `.glass-input`.
- **Accent** indigo/lavender (`--accent: #6366f1`), overridden per active workspace to its `color`.
- **Type** Hanken Grotesk (headlines) · Inter (body) · JetBrains Mono (`label-caps`, tabular-nums
  for task keys) · lucide icons (shadcn default). White-opacity text ramp `white → /60 → /50 → /40 → /30`.
- **Shell** 240px glass sidebar (`rounded-r-3xl`) + 80px ⌘K topbar + `max-w-1400` main, bento `grid-cols-12 gap-4`.
- **Status pills:** backlog/todo white/10 · in_progress `status-progress`/20 · in_review `status-review`/20
  · done `status-done`/20 · canceled white/5 + white/40 text.
- **Priority chips:** urgent/high warm, medium lavender, low slate. **Motion** 120–300ms, `active:scale-90`
  on nav, hover lifts; respect `prefers-reduced-motion`.

## 6. Skill toolkit (Sonnet MUST use these)

Invoke skills proactively — they carry the up-to-date recipes and component APIs.

| Skill | When | Why |
|-------|------|-----|
| **`/shadcn`** | Every time you add/compose a UI primitive (dialog, dropdown-menu, popover, select, command, tabs, tooltip, switch, avatar, badge, sheet, scroll-area) | Manages `components.json`, fetches correct component source + usage. The project is already shadcn-initialised — *use the registry, don't hand-roll primitives.* |
| **`liquid-glass-design`** (`everything-claude-code:liquid-glass-design`) | Every styling pass — applying the glass look to a shadcn primitive or a page | This is the "glass-ui" skill. Authoritative glass recipes (blur, inner highlight, hairline borders, accent glow). Pair with `/shadcn`: shadcn for behavior/structure, liquid-glass for skin. |
| **`frontend-patterns`** | Building pages/state/data-fetching | React state, data-loading, optimistic UI, performance patterns. |
| **`coding-standards`** | Throughout | TS/React conventions: no `any`, props typing, immutability, ≤300-line components. |
| **`vercel:react-best-practices`** | Hooks, effects, memoization, re-render perf | Catch effect/cleanup and render pitfalls. |
| **`vercel:shadcn`** | shadcn theming/registry edge cases | Complements `/shadcn` for config + theming. |
| **`e2e-testing` / `/e2e`** | Session 3 verification | Playwright journeys for register→onboard→workspace, task status drag, role change. |
| **`find-skills`** | When unsure a helper exists | Discover an installed skill before hand-rolling. |

**Pairing rule:** for any interactive component — reach for `/shadcn` to get the accessible
primitive, then `liquid-glass-design` to skin it with `.glass-card`/`.liquid-button` tokens. Never
build a raw dropdown/dialog/command-palette from scratch when shadcn provides it.

## 7. Working rules (all sessions)
- Git identity `critiq17 <critiq17@gmail.com>`. Conventional commits, one focused commit per logical step.
- No `any`. FSD import direction `pages → widgets → features → entities → shared` (never upward).
- ≤300 lines/component; every state handled (loading/error/empty); `useEffect` cleanup for async/subs.
- Source UI primitives from shadcn (`/shadcn`); skin with Liquid Glass tokens (`liquid-glass-design`).
- Never create/update a task/project with `workspace_id: null`; never reuse cross-workspace entities after a switch.
- End every session: `npm run type-check && npm run build` green, then commit.
