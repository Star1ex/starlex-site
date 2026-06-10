# Frontend Review Plan 02 — Performance, Loading, Animation Smoothness

> Start only after `FRONTEND-REVIEW-01-REFACTOR-CLEANUP.md` has stabilized build/lint and isolated large page/editor modules.  
> Primary goal: make Starlex feel immediate while preserving the current UI and functionality.

The user's hard target is that pages should load within about `400 ms` where possible. For a real web app this should be interpreted as:

- route transitions feel responsive within 400 ms;
- app shell appears quickly;
- current route shows stable skeleton/content quickly;
- heavy feature code loads only when needed;
- data can stream or load after shell render, but without layout jumps or long blank states.

This plan does not chase fake benchmark wins by removing features. It reduces unnecessary initial work and makes async loading feel smooth.

---

## 1. Success Criteria

This plan is done when:

- Initial route does not import rich editor code.
- Initial route does not import Sentry code when Sentry DSN is absent.
- Settings pages, About page, search modal, editor, and board/DnD code are lazy-loaded where practical.
- React/runtime dependencies are not trapped inside the editor vendor chunk.
- No initial JavaScript chunk exceeds the agreed budget unless documented.
- Loading states use stable dimensions and do not shift layout.
- Animations are smooth, short, and respect reduced motion.
- Main workspace/task routes are manually checked on desktop and mobile.

---

## 2. Performance Budgets

Use these as practical targets, not dogma:

### Bundle Budgets

- Initial app entry JavaScript: under `180 kB gzip`.
- Largest initial-route vendor chunk: under `250 kB gzip`.
- Rich editor chunk: lazy only; can be large but must not block app shell.
- Sentry chunk: lazy only and only loaded if configured.
- CSS: keep under `35 kB gzip` unless there is a documented reason.

### UX Budgets

- App shell visible: under `400 ms` on a normal development machine after assets are cached.
- Route transition feedback: under `100 ms`.
- Skeleton-to-content transition: no layout jump.
- Modal open: under `100 ms` after first load; first open may lazy-load with a compact loading state.
- Drag interaction: no visible frame drops during normal board sizes.

### Network/Data Budgets

- Avoid duplicate session refresh on initial load.
- Avoid duplicate workspace/task query on route mount.
- Query lists with pagination or virtualization when item count is large.
- Fetch route data after rendering stable shell.

---

## 3. Measure Before Changing

Run from `react-frontend`:

```bash
npm exec vite build
du -h dist/assets/*
```

Optional analyzer if available:

```bash
npm exec vite-bundle-visualizer
```

If no analyzer is installed, inspect emitted files manually:

- search for `@blocknote`, `prosemirror`, `tiptap`, `yjs`, `shiki`;
- search for `@sentry/react`;
- check which file imports React runtime;
- inspect generated chunk names.

Document:

- initial chunks loaded by the default authenticated route;
- biggest route chunks;
- editor chunk size;
- CSS size;
- whether Sentry appears in the entry.

---

## 4. Fix Manual Chunking First

Target:

- `vite.config.ts`

Current problem:

- `editor-vendor` is huge and the entry imports React/runtime code from it.
- This likely comes from a broad `manualChunks` rule that captures shared dependencies into the editor bucket.

Goal:

- React and common runtime code live in a stable `react-vendor` or framework chunk.
- Editor-only packages live in an editor chunk that is loaded only by editor routes/components.

Recommended chunk groups:

```ts
manualChunks(id) {
  if (id.includes("node_modules")) {
    if (
      id.includes("/react/") ||
      id.includes("/react-dom/") ||
      id.includes("react-router") ||
      id.includes("scheduler")
    ) {
      return "react-vendor";
    }

    if (
      id.includes("@blocknote") ||
      id.includes("@tiptap") ||
      id.includes("prosemirror") ||
      id.includes("yjs") ||
      id.includes("unified") ||
      id.includes("remark") ||
      id.includes("rehype") ||
      id.includes("shiki")
    ) {
      return "editor-vendor";
    }

    if (id.includes("@dnd-kit")) {
      return "dnd-vendor";
    }

    if (id.includes("@sentry")) {
      return "sentry-vendor";
    }

    if (id.includes("lucide-react") || id.includes("react-icons")) {
      return "icons-vendor";
    }
  }
}
```

Rules:

- React must be checked before editor packages.
- Do not group everything into a generic chunk that becomes initial by accident.
- After changing chunk rules, rebuild and inspect the emitted `index-*.js` imports.

Acceptance:

- Entry does not import from `editor-vendor`.
- Editor chunk is requested only when an editor component is rendered.

---

## 5. Lazy-Load Heavy Features

### 5.1 Rich Editor

Targets:

- `src/features/markdown/RichEditor.tsx`
- task detail page;
- any markdown preview/editor import.

Problem:

- BlockNote and editor dependencies are too heavy for initial app load.

Plan:

1. Create a lightweight wrapper:

```tsx
const RichEditor = lazy(() => import("@/features/markdown/RichEditor"));
```

2. Render a stable editor skeleton while loading:

- same min-height as editor;
- same border radius;
- glass background;
- no layout shift when editor appears.

3. Load editor only when:

- task detail is open;
- description panel is visible;
- user focuses/edit mode begins, if preview mode exists.

4. Keep markdown preview lighter than full editor when possible.

Acceptance:

- Opening workspace/task list does not download editor code.
- Task detail remains stable while editor loads.

### 5.2 Board and DnD

Targets:

- `src/features/taskBoard/TaskBoard.tsx`
- `@dnd-kit/*`

Plan:

- List view should not import board/DnD.
- Board tab lazy-loads `TaskBoard`.
- Project page can lazy-load board if board is below the fold or behind a mode toggle.

Acceptance:

- `dnd-vendor` is not loaded by task list-only routes.
- Board first paint has a stable skeleton.

### 5.3 Settings Modal

Targets:

- `src/widgets/SettingsModal/SettingsModal.tsx`
- settings page components;
- `AboutUs`.

Problem:

- Settings modal statically imports all settings pages.

Plan:

- Keep the modal shell small.
- Lazy-load each panel:
  - Appearance;
  - General;
  - Notifications;
  - Security;
  - Connected accounts;
  - Labels;
  - Workspace settings;
  - About.
- Render panel skeleton inside the modal body.
- Optionally prefetch the default settings panel on idle after the app shell is ready.

Acceptance:

- Opening the main app does not download every settings page.
- First settings open feels controlled, not blank.

### 5.4 Search Modal

Target:

- `src/widgets/Layout/Layout.tsx`
- `SearchModal`

Plan:

- Lazy-load SearchModal on first `Cmd/Ctrl+K` or search button click.
- Prefetch on idle only after core route is stable.
- Keep keyboard listener small and independent from modal implementation.

Acceptance:

- Search modal code does not inflate the initial layout chunk.
- First open has a small, fixed-height loading shell if needed.

### 5.5 Sentry

Target:

- `src/main.tsx`

Problem:

- `@sentry/react` is statically imported even when DSN is undefined.

Plan:

```ts
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

if (sentryDsn) {
  import("@sentry/react").then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      // existing config
    });
  });
}
```

Also configure scrubbing:

- remove auth headers;
- remove URL query strings from events where possible;
- do not capture invite/reset/token query values.

Acceptance:

- `@sentry/react` does not appear in entry when DSN is absent.
- Sentry still works when DSN is configured.

---

## 6. Route Prefetch Policy

Target:

- `src/app/routes.tsx`
- any `preloadRoutes()` helper.

Concern:

- Blanket protected-route preloading after idle can download heavy pages too early.

Policy:

- Preload only the next likely route.
- Do not preload editor-heavy routes until user intent is clear.
- Do not preload settings/about/search immediately.

Recommended behavior:

- After login/workspace load:
  - preload workspace overview;
  - preload project list if it is linked above the fold;
  - do not preload task detail/editor.
- On hover/focus of a nav item:
  - preload that route.
- On task row hover:
  - preload task detail shell, not editor vendor.
- On "Board" tab hover:
  - preload board component and dnd vendor.

Acceptance:

- Idle preloading improves perceived speed without turning first load into a background download storm.

---

## 7. Data Loading and Caching

### 7.1 Remove Duplicate Initial Requests

Targets:

- `AuthContext`
- `RequireAuth`
- `WorkspaceContext`
- route loaders/hooks

Plan:

- AuthProvider restores session once.
- WorkspaceProvider loads workspace list once after auth is ready.
- Route guard only consumes state.
- Workspace routes request route data only after active workspace ID is known.

Acceptance:

- Browser network tab shows no duplicate refresh/workspace requests on initial authenticated load.

### 7.2 Add a Lightweight Query Layer

If the app already has a query library, use it. If not, keep the first pass simple and local.

Recommended minimal approach:

- shared request hooks per domain:
  - `useWorkspaceProjects(workspaceId)`
  - `useTaskExplorerQuery(workspaceId, filters)`
  - `useTaskDetail(taskId)`
  - `useWorkspaceMembers(workspaceId)`
- each hook handles:
  - loading;
  - error;
  - refetch;
  - abort on unmount;
  - stale response protection when workspace changes.

If adding a library is acceptable, choose TanStack Query. It will improve:

- cache identity;
- stale times;
- optimistic mutations;
- request dedupe;
- background refetch.

Do not add it blindly if the project is close to shipping and the team does not want another dependency.

Acceptance:

- Switching between task list and detail does not refetch everything unnecessarily.
- Workspace switch clears or keys cache correctly.

### 7.3 Smooth Loading States

Rules:

- Never show a full blank page while route data loads.
- Keep app shell visible.
- Use skeleton rows with fixed heights.
- Use the same grid/list dimensions before and after data loads.
- Delay tiny spinners by about 150 ms so fast requests do not flicker.
- Use optimistic updates for status/priority/drag changes.

Acceptance:

- Loading feels calm.
- No large layout shift when data arrives.

---

## 8. Rendering Performance

### 8.1 Large Lists

The project already includes `react-virtuoso`.

Use virtualization for:

- task explorer list when count can exceed roughly 100 rows;
- members only if count is very large;
- project list only if real workspaces can have many projects.

Rules:

- Do not virtualize tiny lists.
- Give rows stable heights if possible.
- Keep row components memoized only when props are stable and there is a measured benefit.

Acceptance:

- Task explorer scroll remains smooth with large task counts.

### 8.2 Stable Props and Callbacks

Targets:

- task rows;
- board columns/cards;
- settings tabs;
- sidebar workspace/project rows.

Plan:

- Move constant arrays outside components.
- Use shared metadata modules.
- Avoid inline object creation for frequently rendered rows.
- Use `useCallback` only for callbacks passed to memoized children or expensive subtrees.
- Avoid overusing `memo`; measure obvious hotspots first.

Acceptance:

- Status changes update only the affected row/card where practical.

### 8.3 Avoid Expensive Glass Everywhere

Liquid Glass can be expensive if every nested element uses blur.

Rules:

- Use `backdrop-filter` on major surfaces only:
  - sidebar;
  - topbar;
  - modal shell;
  - major cards/panels.
- Do not apply blur to every row, chip, menu item, and nested card.
- Prefer translucent background + border for small elements.
- Avoid nested glass panels inside glass panels.

Acceptance:

- UI still looks like Liquid Glass.
- Scroll and drag interactions do not stutter from excessive blur layers.

---

## 9. Animation Policy

Animations are welcome only when they improve clarity and stay lightweight.

### Good Animations

- route/page content fade/slide under 180 ms;
- modal scale/fade under 180 ms;
- row hover background and border transition;
- drag overlay lift;
- dropdown enter/exit;
- skeleton shimmer if subtle and cheap;
- optimistic status chip transition.

### Avoid

- `transition: all`;
- large blur animations;
- animating layout properties like width/height/top/left when transform can do it;
- spring animations on large lists;
- long choreographed page transitions;
- per-row entrance animations for hundreds of items;
- multiple nested animated glass layers.

### Reduced Motion

Use:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

Then override product-specific components if needed.

Acceptance:

- Motion feels smooth.
- Reduced-motion users are respected.
- No animation makes first load heavier by importing a large library unnecessarily.

---

## 10. CSS Performance

Targets:

- global CSS;
- repeated utility-like custom classes;
- broad selectors.

Plan:

1. Remove unused CSS only after `rg` confirms class usage.
2. Replace broad `transition: all` with targeted transitions:
   - `background-color`;
   - `border-color`;
   - `color`;
   - `box-shadow`;
   - `transform`;
   - `opacity`.
3. Reduce repeated hardcoded glass declarations by using reusable classes.
4. Keep theme tokens in CSS variables so theme switch is cheap.

Acceptance:

- CSS size decreases or stays similar while becoming easier to maintain.
- No visual regression from accidental class deletion.

---

## 11. Suggested Implementation Sequence

1. Measure current Vite output.
2. Fix `manualChunks` so React is not in `editor-vendor`.
3. Lazy-load rich editor.
4. Lazy-load Sentry initialization.
5. Lazy-load SettingsModal panels and About page.
6. Lazy-load SearchModal.
7. Lazy-load board/DnD where the board is behind a view toggle.
8. Replace blanket route preloading with intent-based prefetch.
9. Remove duplicate initial auth/workspace requests.
10. Add stable skeletons and delayed spinners.
11. Virtualize task explorer list if needed.
12. Audit glass blur layers and animation CSS.
13. Re-measure and document before/after sizes.

---

## 12. Verification Checklist

Commands:

```bash
npm run build
npm run lint
npm exec vite build
du -h dist/assets/*
```

Manual performance checks:

- hard reload sign-in route;
- hard reload authenticated workspace route;
- open task explorer;
- switch list/board;
- open task detail;
- focus editor;
- open settings;
- press Cmd/Ctrl+K;
- drag a task card;
- switch workspace.

Inspect network:

- editor chunk loads only on editor use;
- dnd chunk loads only on board use;
- settings chunks load only on settings use;
- Sentry chunk loads only if DSN exists;
- no duplicate session refresh on initial route.

Final note must include:

- before/after chunk sizes;
- what moved out of initial load;
- any remaining large chunk and why it remains;
- route checks performed;
- unresolved performance risks.

