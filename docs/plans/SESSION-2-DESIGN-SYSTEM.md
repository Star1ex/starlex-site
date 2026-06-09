# Session 2 — Design system: shadcn + Liquid Glass everywhere, kill the ugly pages

> Read `00-OVERVIEW.md` first (tokens §5 + skills §6). Session 1 made it *work*; this session
> makes it **look like one product** — Linear-grade, uniformly glass — and rewrites the screens
> the owner specifically hates (Profile + Settings, still on old inline themes).
> **Primary skills:** `/shadcn` (get the accessible primitive) **paired with**
> `liquid-glass-design` (skin it with the glass recipe). Also `coding-standards`,
> `vercel:shadcn` (theming), `vercel:react-best-practices`.
> End green: `npm run type-check && npm run build`.

---

## Goal
One coherent design system. Every interactive primitive comes from shadcn and is skinned with the
Liquid Glass tokens. Profile and all Settings panels are rewritten from scratch to the glass spec —
no `var(--bg-primary)` inline old-theme page survives. Every page reads visually identical in
language: black canvas, glass panels, hairline borders, accent glow, the white-opacity text ramp.

## Tasks

### 1. shadcn baseline + theme bridge  *(`/shadcn`, `vercel:shadcn`)*
- Add the primitives the app needs via `/shadcn` (don't hand-roll): `dialog`, `alert-dialog`,
  `dropdown-menu`, `select`, `popover`, `command`, `tabs`, `tooltip`, `switch`, `avatar`, `badge`,
  `sheet`, `scroll-area`, `separator`, `skeleton`. Confirm they land in `components/ui/` per `components.json`.
- **Theme bridge:** map shadcn's CSS variables (`--background`, `--card`, `--popover`, `--border`,
  `--ring`, `--primary`, `--muted-foreground`, …) onto the existing Liquid-Glass tokens in
  `src/index.css` so shadcn components are black-glass by default. Verify `tailwind.config` content
  globs include `components/ui`. The accent (`--ring`, `--primary`) must follow `--accent` (workspace color).

### 2. Glass-ify the shadcn primitives  *(`liquid-glass-design`)*
For each primitive create a thin skin so the whole app inherits glass once:
- **Dialog / Sheet / Popover / Dropdown / Command** content surfaces → `.glass-card` body over a
  `bg-black/60 backdrop-blur` scrim; hairline white/8 border; inner highlight.
- **Select / Dropdown items** → hover `bg-white/5`, active `bg-white/10`, check in accent.
- **Tabs** → glass pills (active `bg-white/10 border-white/20`, idle `text-white/50 hover:text-white`).
- **Badge** → status/priority pill variants from `00-OVERVIEW.md` §5 (one source of truth for pill colors).
- **Tooltip** → small dark glass, `label-sm`.
- **Skeleton** → `bg-white/5` shimmer.
Keep these in `src/shared/ui/` as the canonical atoms; have feature code import from there, not raw shadcn.

### 3. Reconcile the existing `shared/ui` atoms
The repo already has hand-written `Button`, `Input`, `Dropdown`, `Modal`, `Avatar`, `Skeleton`,
`ToastHost`, `LabelPicker`, `IconPicker`. Decide per atom: **rebuild on the shadcn primitive** (preferred
for Dropdown/Modal/Dialog/Avatar/Skeleton) or **keep + retune** (Button/Input as plain glass classes are fine).
Update all imports; delete the superseded versions. No two components doing the same job.

### 4. Rewrite Profile  *(the owner called this out — `src/pages/profile/`)*
- There are **two** old-theme files: `UserProfile.tsx` (self, `/profile`) and `UserProfilePage.tsx`
  (other user, `/profile/:userId`). Both use inline `var(--bg-primary)` + `BreadcrumbBack` — rebuild both.
- New glass profile: hero with avatar (rounded-full, **accent rim**), `headline-lg` name, role badge,
  glass cards for sections (account info, workspaces, activity). Edit mode for own profile via glass
  inputs/dialog. Other-user profile is read-only.
- Share a single `ProfileView` presentational component between self/other (DRY). Drop `BreadcrumbBack`
  in favor of the shell's back affordance. All states handled.

### 5. Rewrite Settings  *(`src/pages/settings/*` + `SettingsModal` + `SettingsSidebar`)*
Every settings panel must become glass per `00-OVERVIEW.md` design notes (left glass sub-nav rail,
content panels as `.glass-card`, section eyebrows in `label-caps`, dock-style toggle rows). Rewrite each:
- **Appearance** — theme (light/dark/ultra-dark), accent color picker (drives `--accent`),
  density (comfortable/compact), reduced motion. Live preview.
- **Account & Security** — `ChangePassword`, `EmailChange` (re-verify), `ConnectedAccounts`
  (OAuth link/unlink), `SecuritySessions` (device list from `GET /auth/sessions`, revoke).
- **Workspace** — `WorkspaceSettings` (name/desc/icon/color, key prefix, default invite role,
  default task status, danger zone), `LabelsManager` (admin+ label CRUD with color picker).
- **Notifications** — email-on-assign / on-mention toggles (shadcn `switch`, glass).
- **General / Support / Contributing** — bring to glass; trim anything dev-only/irrelevant.
- Use shadcn `tabs`/`sheet` for the modal; gate admin-only panels by role (read-only for members/guests).

### 6. Whole-app glass sweep  *(consistency pass)*
Walk every route and align to the spec — no surface left half-styled:
- Auth pages (sign-in/up, forgot/reset, verify, oauth-callback): black canvas, single centered
  `.glass-card`, accent CTA, `headline-xl` title.
- Onboarding, Workspace dashboard/bento, Project page/board, Task explorer, Task detail, Members,
  Invite accept: confirm they use the shared glass atoms + shell, pill/badge from the single source,
  accent = workspace color.
- Empty/loading/error states everywhere use glass cards + muted `white/50` copy + a lucide icon + glass skeletons.
- Kill any remaining inline `var(--bg-*)` ad-hoc styling in favor of tokens/utilities.

### 7. Workspace identity polish
- Wire `shared/lib/workspaceIcon.tsx` (generated minimalist glyph from name + color) into onboarding,
  sidebar brand, switcher, invite preview, members — consistent everywhere, paired with `IconPicker`
  for emoji/asset override.
- Setting a workspace active sets `--accent` to its color so pills/progress/focus-rings/glow tint to it.

## Acceptance (Session 2 done when…)
- [ ] All interactive primitives come from shadcn and are skinned glass via shared atoms (no raw,
      no duplicate atoms).
- [ ] shadcn CSS vars bridged to Liquid-Glass tokens; accent follows the active workspace color.
- [ ] Both Profile pages rewritten to glass (shared presentational component); no `BreadcrumbBack`,
      no inline old theme.
- [ ] Every Settings panel rewritten to glass (rail + glass cards + eyebrows + dock toggles); admin
      gating intact.
- [ ] Auth/onboarding/workspace/project/tasks/members/invite all read as one product; pills/badges
      from a single source; generated workspace icon used consistently.
- [ ] No `var(--bg-primary)` inline-theme page remains; no `any`; components ≤300 lines.
      `type-check && build` green.

## Suggested commits
`feat(frontend): shadcn primitives + glass theme bridge` ·
`refactor(frontend): glass-skin shared UI atoms on shadcn` ·
`feat(frontend): rewrite profile pages (glass)` ·
`feat(frontend): rewrite settings panels (glass)` ·
`refactor(frontend): whole-app glass consistency sweep` ·
`feat(frontend): consistent generated workspace icons + accent theming`
