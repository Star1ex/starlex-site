# Starlex Frontend Review — Start Here

> Date: 2026-06-10  
> Scope: `react-frontend` only  
> Goal: preserve the current Starlex functionality and Liquid Glass + Ultra Dark design while cleaning the frontend, reducing duplication, improving runtime performance, tightening data-safety issues, and adding a harmonious Liquid Glass light theme.

This review is written as a Codex-ready execution program. It is intentionally split into three independent plans:

1. `FRONTEND-REVIEW-01-REFACTOR-CLEANUP.md` — architecture, duplication removal, naming, dead code, lint/type health, security-sensitive frontend cleanup.
2. `FRONTEND-REVIEW-02-PERFORMANCE.md` — bundle splitting, lazy loading, data loading, smooth transitions, runtime rendering performance, 400 ms interaction target.
3. `FRONTEND-REVIEW-03-LIGHT-THEME.md` — semantic tokens, Liquid Glass light theme, theme parity, CSS cleanup without breaking Ultra Dark.

Run the plans in order. Do not start theme work before the core structure is stable, and do not start aggressive performance work while the build is failing.

---

## 1. Non-Negotiable Product Constraints

These constraints are more important than any cleanup preference:

- Preserve the existing app behavior and routes unless a file explicitly says to remove legacy dead code.
- Preserve the current Liquid Glass + Ultra Dark visual direction.
- Do not simplify the product into a different UI. Refactors must be internal unless the plan explicitly calls for a controlled UX improvement.
- Improvements to animations are welcome only when they do not increase bundle cost or make the app feel heavier.
- Prefer better reuse, naming, structure, and state/data boundaries over visual redesign.
- Every major step must end with a green verification command or an explicit note explaining why it cannot be green yet.
- Do not touch backend code for this program unless a later task explicitly expands the scope.

---

## 2. Current Verified State

The frontend was inspected after the Liquid Glass + Ultra Dark refactor. The important findings:

### Build Health

- `npm run build` currently fails in `react-frontend`.
- Blocking TypeScript error:
  - `src/pages/tasks/TaskExplorerPage.tsx(583,54): 'activeWorkspace' is possibly 'null'`.
- `npm run lint` currently reports many errors, mostly:
  - `no-explicit-any`;
  - React Fast Refresh violations from files exporting components plus constants/hooks;
  - React hook/compiler violations;
  - unused or legacy wrappers;
  - unsafe/unclear hook patterns.

### Bundle Health

Running Vite directly (`npm exec vite build`) succeeds, which means the bundler can emit assets after bypassing the TypeScript step.

Key emitted chunks observed:

- `editor-vendor-*.js`: about `1,391 kB` minified, `428 kB` gzip.
- `index-*.js`: about `463 kB` minified, `149 kB` gzip.
- `native-*.js`: about `433 kB` minified, `83 kB` gzip.
- `index-*.css`: about `148 kB` minified, `26 kB` gzip.

Critical issue: the app entry imports React/runtime dependencies from the `editor-vendor` chunk. That means the massive editor chunk is effectively on the initial path, even when the user is not editing rich text.

### Static Imports That Increase Initial Cost

Important static imports found:

- `src/main.tsx` statically imports `@sentry/react`.
- `src/app/routes.tsx` statically imports `SettingsModal` and `AboutUs`.
- `src/widgets/SettingsModal/SettingsModal.tsx` statically imports all settings pages and `AboutUs`.
- Layout-level UI statically imports `SearchModal`.

These are not necessarily bugs, but they are performance work items because they increase the first route cost.

### CSS and Theme Health

- `src/index.css` is very large and mixes global tokens, app shell, tasks, projects, settings, auth, utilities, shadcn tokens, and theme-specific rules.
- There are many hardcoded `rgba(255, 255, 255, ...)` values that make light-theme work risky.
- shadcn variables and Starlex variables compete over names such as `--accent`.
- Rich editor theme CSS is partly embedded in component code instead of being fully tokenized.

### Architecture and Duplication

Likely cleanup targets:

- Old API wrappers:
  - `src/app/api/api.ts`
  - `src/app/api/token.ts`
  - `src/shared/lib/apiClient.ts`
  - `src/entities/user.ts`
- Canonical API client appears to be `src/services/api/client.ts`.
- Large mixed-responsibility pages:
  - `src/pages/tasks/TaskExplorerPage.tsx`
  - `src/pages/tasks/TaskDetailPage.tsx`
  - `src/pages/workspace/WorkspaceProjects.tsx`
  - `src/features/taskBoard/TaskBoard.tsx`
- Shared metadata appears duplicated across task status, priority, pills, menus, board columns, filters, and detail views.

### Data-Safety Concerns

Frontend-sensitive issues to review and fix:

- `src/shared/lib/realtime.ts` passes the access token in a WebSocket query parameter.
- `src/app/LastVisitedManager.tsx` stores the full current URL in a cookie. Full URLs can contain invite tokens, reset tokens, OAuth codes, or other sensitive query params.
- `src/shared/lib/authManager.ts` stores user profile data in `localStorage`.
- `src/contexts/AuthContext.tsx` manually decodes JWT payloads and uses broad `any` typing in places.

These are not necessarily exploitable alone, but they are avoidable leak surfaces and should be cleaned as part of the refactor plan.

---

## 3. Execution Order

### Phase 0: Stabilize

Do this before any large refactor:

1. Fix the blocking TypeScript error in `TaskExplorerPage`.
2. Run `npm run build`.
3. Run `npm run lint`.
4. Classify lint failures:
   - real bugs;
   - generated shadcn export-shape issues;
   - legacy unused files;
   - refactor-required structural issues.

Do not hide real errors by weakening lint globally. If an exception is needed for shadcn-generated files, isolate it narrowly.

### Phase 1: Refactor and Cleanup

Use `FRONTEND-REVIEW-01-REFACTOR-CLEANUP.md`.

Expected output:

- one canonical API/client path;
- deleted dead code;
- split page-level components;
- shared task/project metadata;
- safer local/session persistence;
- green build and lint or a documented intentional exception.

### Phase 2: Performance

Use `FRONTEND-REVIEW-02-PERFORMANCE.md`.

Expected output:

- no editor, dnd, settings, search, or Sentry code on the first route unless required;
- cleaner route-level chunks;
- smoother skeleton/data transitions;
- fewer unnecessary renders;
- measured before/after bundle sizes.

### Phase 3: Light Theme

Use `FRONTEND-REVIEW-03-LIGHT-THEME.md`.

Expected output:

- semantic theme tokens;
- Ultra Dark preserved;
- light theme implemented through tokens, not one-off overrides;
- route screenshot QA across auth, workspace, tasks, task detail, settings, and editor.

---

## 4. Baseline Commands

Run from `react-frontend`:

```bash
npm run build
npm run lint
npm exec vite build
```

If the project has a dedicated type-check command, run it too:

```bash
npm run type-check
```

For bundle inspection:

```bash
npm exec vite build
du -h dist/assets/*
```

If adding a visual regression pass:

```bash
npm run dev
```

Then capture the main routes in desktop and mobile widths.

---

## 5. Working Rules For Codex

### Preserve User Work

The worktree may already contain uncommitted user changes. Before editing:

```bash
git status --short
```

Read any target file before modifying it. Do not revert unrelated changes.

### Keep Commits Small

Suggested commit boundaries:

- build/lint stabilization;
- dead-code deletion;
- API client consolidation;
- metadata/config extraction;
- page decomposition;
- performance chunk split;
- dynamic imports;
- light theme token migration;
- light theme route fixes.

### Do Not Mix Large Concerns

Bad combined change:

- split `TaskExplorerPage`;
- rewrite CSS tokens;
- change route lazy loading;
- fix WebSocket auth;
- modify settings UI.

Good separated changes:

- first extract task metadata;
- then split task explorer;
- then adjust lazy imports;
- then theme tokens.

### Acceptance Standard

Each plan is complete only when:

- the app builds;
- lint is green or only has documented scoped exceptions;
- affected routes were manually checked;
- no current feature was removed;
- before/after behavior is described in the final note.

