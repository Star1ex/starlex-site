# Frontend Review Plan 03 — Liquid Glass Light Theme

> Start after the refactor plan has split CSS and the performance plan has isolated heavy components.  
> Primary goal: add a harmonious Liquid Glass light theme without weakening the current Ultra Dark identity.

The light theme should feel like the same product in a brighter environment, not a generic white UI. It must keep the Liquid Glass language: translucent surfaces, soft borders, depth, precise typography, and workspace accent color. The theme should be clean, cool, and professional.

---

## 1. Success Criteria

This plan is done when:

- Ultra Dark still looks the same or better.
- Light theme is controlled by semantic tokens, not hundreds of one-off overrides.
- Hardcoded white/black alpha usage is replaced where it affects theming.
- shadcn tokens and Starlex tokens no longer fight over `--accent`.
- All main routes are visually checked in light and Ultra Dark.
- Rich editor, settings, dropdowns, popovers, dialogs, task board, task detail, and auth pages are readable and polished in light mode.
- Theme switch has no layout shift and no flash of wrong theme.

---

## 2. Theme Direction

### Ultra Dark Must Stay

Keep the current product direction:

- very dark canvas;
- glass panels;
- subtle white borders;
- workspace accent glow;
- restrained motion;
- high-contrast task/workspace operations UI.

Do not make dark mode blue, purple-heavy, beige, or generic.

### Light Theme Direction

Use a cool Liquid Glass light palette:

- canvas: near-white with a slight cool tint;
- panels: translucent white with soft borders;
- text: deep neutral/slate, not pure black everywhere;
- muted text: blue-gray/slate;
- borders: low-contrast cool gray;
- accent: workspace accent remains visible but controlled;
- destructive/warning/status colors remain semantic and accessible.

Avoid:

- beige/cream/tan dominant palette;
- heavy purple gradients;
- flat white cards with no glass feeling;
- dark-mode-only white alpha values;
- decorative blobs/orbs;
- excessive blur on every small element.

---

## 3. Token Architecture

### 3.1 Separate Starlex Accent From shadcn Accent

Current concern:

- shadcn uses `--accent`.
- Starlex also uses `--accent` for workspace accent.
- This creates naming collisions and theme confusion.

Recommended naming:

- `--starlex-accent`
- `--starlex-accent-rgb`
- `--starlex-accent-soft`
- `--starlex-accent-border`
- `--starlex-accent-glow`

Then map shadcn tokens separately:

- `--background`
- `--foreground`
- `--card`
- `--card-foreground`
- `--popover`
- `--popover-foreground`
- `--primary`
- `--primary-foreground`
- `--secondary`
- `--secondary-foreground`
- `--muted`
- `--muted-foreground`
- `--accent`
- `--accent-foreground`
- `--border`
- `--input`
- `--ring`

Rule:

- shadcn `--accent` means "shadcn hover/accent surface".
- Starlex `--starlex-accent` means "workspace/product accent".

Acceptance:

- Changing workspace color updates Starlex accent without breaking shadcn components.

### 3.2 Define Semantic Starlex Tokens

Add tokens for product surfaces:

```css
:root {
  --sx-canvas: ...;
  --sx-canvas-elevated: ...;
  --sx-panel: ...;
  --sx-panel-strong: ...;
  --sx-panel-muted: ...;
  --sx-border: ...;
  --sx-border-strong: ...;
  --sx-text: ...;
  --sx-text-muted: ...;
  --sx-text-subtle: ...;
  --sx-text-disabled: ...;
  --sx-shadow-soft: ...;
  --sx-shadow-elevated: ...;
  --sx-glass-blur: 24px;
  --sx-glass-saturate: 150%;
}
```

For RGB alpha composition, add:

```css
--sx-panel-rgb: 255 255 255;
--sx-text-rgb: 15 23 42;
--sx-border-rgb: 148 163 184;
```

Then use:

```css
background: rgb(var(--sx-panel-rgb) / 0.68);
border-color: rgb(var(--sx-border-rgb) / 0.24);
```

Acceptance:

- Components do not need to know whether theme is light or dark.
- Most hardcoded `rgba(255,255,255,...)` values disappear from theme-sensitive components.

---

## 4. Proposed Token Values

These are starting values. Adjust after screenshots.

### Ultra Dark

```css
.ultra-dark {
  --sx-canvas: #000000;
  --sx-canvas-elevated: #050508;
  --sx-panel-rgb: 255 255 255;
  --sx-panel-alpha: 0.035;
  --sx-panel-strong-alpha: 0.075;
  --sx-border-rgb: 255 255 255;
  --sx-border-alpha: 0.08;
  --sx-border-strong-alpha: 0.14;
  --sx-text: #ffffff;
  --sx-text-muted: rgb(255 255 255 / 0.68);
  --sx-text-subtle: rgb(255 255 255 / 0.48);
  --sx-text-disabled: rgb(255 255 255 / 0.32);
  --sx-shadow-soft: 0 18px 60px rgb(0 0 0 / 0.32);
  --sx-shadow-elevated: 0 24px 90px rgb(0 0 0 / 0.45);
}
```

### Light

```css
.light {
  --sx-canvas: #f7f9fc;
  --sx-canvas-elevated: #ffffff;
  --sx-panel-rgb: 255 255 255;
  --sx-panel-alpha: 0.72;
  --sx-panel-strong-alpha: 0.88;
  --sx-border-rgb: 100 116 139;
  --sx-border-alpha: 0.18;
  --sx-border-strong-alpha: 0.28;
  --sx-text: #0f172a;
  --sx-text-muted: #475569;
  --sx-text-subtle: #64748b;
  --sx-text-disabled: #94a3b8;
  --sx-shadow-soft: 0 18px 55px rgb(15 23 42 / 0.08);
  --sx-shadow-elevated: 0 26px 90px rgb(15 23 42 / 0.12);
}
```

### Light Canvas Background

Keep it subtle:

```css
.light body {
  background:
    radial-gradient(circle at 18% 0%, rgb(var(--starlex-accent-rgb) / 0.08), transparent 34rem),
    linear-gradient(180deg, #fbfdff 0%, #f4f7fb 46%, #eef3f8 100%);
}
```

Do not add visible decorative blobs/orbs. The gradient should read as ambient light, not decoration.

---

## 5. Component Migration Order

Do not try to theme everything at once. Work from global surfaces to nested controls.

### 5.1 Global App Shell

Targets:

- `src/widgets/Layout/Layout.tsx`
- `src/widgets/GlobalSidebar`
- `src/widgets/Topbar`
- main content wrapper CSS.

Check:

- sidebar background;
- topbar background;
- active nav item;
- workspace switcher;
- borders between shell and content;
- text contrast;
- mobile sidebar/sheet if present.

Acceptance:

- App shell clearly feels glass in light theme.
- Active workspace accent remains tasteful.

### 5.2 Core Product Pages

Targets:

- workspace overview;
- workspace projects;
- project page;
- task explorer;
- task board;
- task detail.

Check:

- panels are visible on light canvas;
- row hover states are subtle;
- task keys and metadata are readable;
- status and priority chips do not become washed out;
- board columns have enough separation;
- drag/drop states are visible but not loud.

Acceptance:

- Dense operational screens stay scannable.
- No task row/card loses hierarchy.

### 5.3 Settings Modal

Targets:

- `src/widgets/SettingsModal`
- all settings pages.

Check:

- modal overlay;
- modal shell;
- settings nav;
- form labels/inputs;
- toggles;
- destructive actions;
- focus rings.

Acceptance:

- Settings looks like part of the product, not an old theme.
- Form controls are readable and accessible.

### 5.4 Auth and Onboarding

Targets:

- sign in/register/verify;
- onboarding workspace creation;
- invite accept.

Check:

- hero/login panel contrast;
- input backgrounds;
- OTP/code fields;
- error and success states;
- mobile layout.

Acceptance:

- Light theme auth screens look premium but not marketing-heavy.

### 5.5 Rich Editor

Target:

- `src/features/markdown/RichEditor.tsx`
- related CSS moved out of inline `<style>` where practical.

Plan:

- Move editor theme CSS into a stylesheet.
- Tokenize:
  - editor background;
  - editor text;
  - placeholder;
  - slash menu;
  - toolbar;
  - selected block;
  - code blocks;
  - links.

Acceptance:

- Editor is readable in light and Ultra Dark.
- Inline editor CSS is reduced.
- Editor does not bring dark-only hardcoded styles into light mode.

---

## 6. Replace Hardcoded Dark-Theme Colors

Run:

```bash
rg "rgba\\(255,\\s*255,\\s*255|rgb\\(255\\s+255\\s+255|white/" src/index.css src
rg "rgba\\(0,\\s*0,\\s*0|rgb\\(0\\s+0\\s+0|black/" src/index.css src
```

Classify each result:

- intentional dark-only theme token;
- semantic text color;
- panel/background;
- border;
- shadow;
- hover state;
- icon color;
- non-theme asset/style.

Replace with semantic tokens:

- text: `--sx-text`, `--sx-text-muted`, `--sx-text-subtle`;
- panels: `--sx-panel-rgb` with alpha;
- borders: `--sx-border-rgb` with alpha;
- shadows: `--sx-shadow-soft`, `--sx-shadow-elevated`;
- accent: `--starlex-accent-*`.

Acceptance:

- Light theme no longer depends on dark-mode white alpha values.
- Ultra Dark still uses white alpha through tokens.

---

## 7. Status, Priority, and Semantic Colors

Status and priority colors should work in both themes.

Recommended tokens:

```css
:root {
  --status-backlog-bg: ...;
  --status-backlog-text: ...;
  --status-progress-bg: ...;
  --status-progress-text: ...;
  --status-review-bg: ...;
  --status-review-text: ...;
  --status-done-bg: ...;
  --status-done-text: ...;
  --status-canceled-bg: ...;
  --status-canceled-text: ...;

  --priority-urgent-bg: ...;
  --priority-urgent-text: ...;
  --priority-high-bg: ...;
  --priority-high-text: ...;
  --priority-medium-bg: ...;
  --priority-medium-text: ...;
  --priority-low-bg: ...;
  --priority-low-text: ...;
}
```

Rules:

- Do not use color alone for status; labels/icons still matter.
- Keep contrast readable on both themes.
- Avoid neon colors in light mode.

Acceptance:

- All chips remain readable on white/glass backgrounds.

---

## 8. Theme Toggle and Persistence

Target:

- `src/shared/contexts/ThemeContext.tsx`

Current themes:

- `dark`
- `light`
- `ultra-dark`
- `solarized`

Plan:

1. Confirm which themes are product-supported.
2. If `solarized` is not part of product direction, either hide it from UI or clearly mark it unsupported. Do not delete it without checking callers.
3. Apply theme class before first paint to avoid flash.
4. Store theme preference in one place.
5. Keep workspace accent persistence separate from theme preference.

Acceptance:

- Reload does not flash wrong theme.
- Switching workspace accent does not reset theme.
- Switching theme does not reset workspace accent.

---

## 9. Accessibility Checks

Minimum checks:

- normal text contrast;
- muted text contrast;
- chip contrast;
- input border and focus ring visibility;
- keyboard focus states;
- disabled states;
- selected nav state;
- modal overlay contrast;
- error/destructive states.

Use practical manual checks first. If tooling exists, add automated contrast/a11y checks later.

Acceptance:

- Light theme is not just pretty; it is usable for dense task management.

---

## 10. Animation in Light Theme

Keep animation behavior shared across themes.

Light-specific guidance:

- shadows can be slightly more visible than dark mode;
- hover lift should be subtle;
- focus rings should use workspace accent;
- avoid animating blur strength;
- avoid heavy glowing effects on white canvas.

Acceptance:

- Light theme feels responsive, not floaty or distracting.

---

## 11. Screenshot QA Matrix

Capture or manually inspect these routes in both `ultra-dark` and `light`:

- sign in;
- onboarding;
- workspace home;
- workspace projects;
- project page;
- task explorer list;
- task explorer board;
- task detail with editor loaded;
- settings modal general page;
- settings modal appearance page;
- members page if present;
- mobile workspace route;
- mobile task detail;
- mobile settings modal.

For each route check:

- no unreadable text;
- no dark-only borders on light background;
- no light-only shadows on dark background;
- no overlapping text;
- no layout shift after theme switch;
- glass panels still have depth;
- workspace accent still works.

---

## 12. Suggested Implementation Sequence

1. Rename Starlex workspace accent tokens away from shadcn `--accent`.
2. Add semantic Starlex surface/text/border/shadow tokens.
3. Map Ultra Dark values to the new tokens first.
4. Verify Ultra Dark has not changed.
5. Add initial light token values.
6. Migrate app shell classes from hardcoded white alpha to tokens.
7. Migrate core product pages.
8. Migrate task/status/priority chips.
9. Migrate settings modal/pages.
10. Migrate auth/onboarding.
11. Migrate rich editor theme CSS.
12. Fix remaining hardcoded dark-only values.
13. Verify desktop/mobile screenshot matrix.

---

## 13. Verification

Commands:

```bash
npm run build
npm run lint
```

Search checks:

```bash
rg "rgba\\(255,\\s*255,\\s*255|rgba\\(0,\\s*0,\\s*0" src
rg "--accent" src/index.css src/styles src
```

Manual checks:

- theme switch works;
- reload preserves theme;
- workspace accent still applies;
- Ultra Dark preserved;
- light theme route matrix checked;
- editor readable;
- settings readable;
- mobile layout readable.

Final note must include:

- token names added/changed;
- hardcoded color classes replaced;
- routes checked;
- known remaining theme debt;
- confirmation that Ultra Dark was preserved.

