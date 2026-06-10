# Phase 4 — Overlays: Settings, dialogs, menus, ⌘K, toasts

> Prereq: Phases 1–3.
> Skills: `/shadcn` (command, popover, switch, sonner primitives), `everything-claude-code:liquid-glass-design`.
> Libraries to add THIS phase: `cmdk`, `sonner` (`npm i cmdk sonner`), optional `vaul` for mobile settings drawer.
> Output: every floating layer is true liquid glass — the settings modal becomes a showcase piece ("немного прозрачные, очень красиво, минимализм, минимум бордеров").

## Overlay doctrine

- Overlays are the **only** surfaces allowed heavy glass: `<Glass variant="modal">` (blur 40px, boosted fill for legibility, `--sx-shadow-elevated`).
- Backdrop: `--sx-overlay` flat dim + `backdrop-filter: blur(8px)` on the backdrop itself (background recedes — the iOS sheet feel). No gradient backdrops.
- Inside an overlay: **zero further blur**, max ONE hairline (header divider). Sections separate by spacing + `label-caps` headers, controls are solid `--sx-surface`.
- Enter/exit: scale 0.97→1 + opacity, 180ms `--ease-out-expo`; exit 120ms. Menus: 0.98→1 from trigger origin (`transform-origin` from Radix side data attr). Nothing slides across the screen.

## Tasks

### 4.1 Settings modal (`widgets/SettingsModal/*`, `pages/settings/*`, `.settings-*` css)
The owner's explicit showcase request. Rebuild:
- Shell: `<Glass variant="modal" refract>` (settings floats over the app — refraction here is a wow moment), radius `--radius-xl`, max-w 960, h 640.
- Sidebar nav inside: **transparent** column (no inner panel!), items = ghost rows with active `--sx-surface-active` + accent tick — mirrors the global sidebar language. Profile mini-card at top: solid surface, no border.
- Right pane: section title (15px, −0.015em) + `label-caps` kickers; rows = borderless grid (label left `--sx-text-muted`, control right); hairline only between *groups*.
- Controls via shadcn restyled to tokens: `switch` (add via `npx shadcn add switch`), select/dropdown already glass-menus. Inputs: radius-md solid `--sx-surface`, focus ring token.
- Appearance tab: live theme cards rendered from real tokens (mini sidebar+rows preview), selected = accent ring 2px, no red border+badge combo.
- Delete the whole `.settings-*` light-theme remnants and shrink `.settings-*` in components.css to the new minimal set.

### 4.2 Dialogs & alert dialogs (`components/ui/dialog.tsx`, `alert-dialog.tsx`)
- Content slot → `sx-glass sx-glass--modal` classes (or wrap `<Glass>`); destructive confirm: title + sentence + ghost-cancel + solid danger button (`--sx-danger`); no icon circles.

### 4.3 Dropdowns / selects / popovers (`dropdown-menu.tsx`, `select.tsx`, StatusMenu, label picker, date picker)
- All content slots → `variant="menu"` recipe (mostly done in Phase 2 via `.glass-menu`) — this phase: remove their remaining `!important` ring-kill hacks by fixing at the source (shadcn slot classNames), unify item height 30px, radius-sm, check-mark = accent dot not full-row tint.
- Calendar (`tasks-calendar-*`): glass menu shell, solid day cells, selected = accent circle, today = rim ring.

### 4.4 ⌘K Command palette (replace `widgets/SearchModal` internals with `cmdk`)
- `<Glass variant="modal" refract>` centered at 18vh; input borderless 16px; groups via `label-caps`; results = ghost rows with icon + key chip (mono). Recent items from `shared/lib/recentItems.ts`.
- Register global shortcut once (existing ⌘K handler); add actions: navigation, "New task", "New project", theme toggle (instant theme switch from palette = cheap wow).

### 4.5 Toasts → `sonner`
- Replace `shared/lib/toast.ts` implementation with sonner's `<Toaster>` styled: `variant="menu"` glass, bottom-right, icon hue from status palette, NO colored backgrounds (tint via icon + 3px left accent bar only).

### 4.6 Workspace create modal (`widgets/WorkspaceCreateModal`)
- Same modal doctrine; icon/color presets as solid swatches with rim-on-hover; live preview card = `<Glass variant="card">`.

## Definition of Done
- [ ] Settings modal is glass with transparent inner nav, ≤2 hairlines total visible per tab
- [ ] All Radix content slots render through the material; zero `!important` left in overlay styles
- [ ] ⌘K palette on cmdk with theme-toggle action; toasts on sonner
- [ ] Backdrop blur present behind every modal layer; ESC/scroll-lock/focus-trap intact (Radix)
- [ ] Both themes verified for every overlay
- [ ] `npm run lint && npm run build` green

Commit: `feat(frontend): [glass 4/5] glass overlays — settings showcase, cmdk palette, sonner toasts`
Append handoff to `PROGRESS.md`.
