# Phase 2 — The Glass material system + the hero sidebar

> Prereq: Phase 1 merged (token contract live, 2 themes, depth field).
> Skills: `/shadcn`, `everything-claude-code:liquid-glass-design` (translate its container/merge/interactive principles to web).
> Output: one reusable `<Glass>` material that scales to every surface type, and the sidebar rebuilt as a floating glass slab — the single most important screen element. This phase is where "wow" is won or lost.

## Why a component, not just CSS classes

The current `.glass-card` is one flat fill + uniform border — paint, not material. Real liquid glass is **layered**: backdrop treatment, body gradient, light-catching rim, interior thickness, surface noise, and (where supported) edge refraction. Maintaining 6 coordinated layers by hand in 30 call-sites is impossible; one component with variants makes it trivial and consistent. This is the "переиспользуемый ультра-качественный Liquid Glass компонент" the product owner asked for.

## Tasks

### 2.1 `src/shared/ui/glass/Glass.tsx` — the material

API (CVA-based, polymorphic `as`, forwards ref — needed for framer-motion):

```tsx
type GlassVariant = 'sidebar' | 'panel' | 'card' | 'menu' | 'modal' | 'pill' | 'dock';
type GlassProps<T extends ElementType> = {
  as?: T; variant?: GlassVariant;
  depth?: 'rest' | 'raised' | 'floating';   // shadow tier, not border tier
  interactive?: boolean;                     // hover/press physics — opt-in (skill: not all glass reacts)
  refract?: boolean;                          // Chromium edge refraction, sidebar/dock only
  className?: string; children: ReactNode;
} & ComponentPropsWithoutRef<T>;
```

Construction — one wrapper, layers via `::before`/`::after` + one inner node (in `src/shared/ui/glass/glass.css`, consuming only Phase-1 tokens):

```css
.sx-glass {
  position: relative; border-radius: var(--glass-radius, var(--radius-lg));
  background: linear-gradient(180deg, var(--sx-glass-fill-top), var(--sx-glass-fill-bottom));
  backdrop-filter: blur(var(--sx-glass-blur)) saturate(var(--sx-glass-saturate));
  -webkit-backdrop-filter: blur(var(--sx-glass-blur)) saturate(var(--sx-glass-saturate));
  box-shadow: var(--glass-shadow, var(--sx-shadow-soft)),
              inset 0 -12px 24px -16px var(--sx-thickness);   /* interior thickness, bottom */
}
/* Rim: gradient drawn as a masked 1px ring — bright top-left, near-invisible bottom.
   This REPLACES borders (Design Law 3). */
.sx-glass::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px;
  background: linear-gradient(160deg,
    var(--sx-rim-bright), var(--sx-rim-faint) 28%, transparent 55%, var(--sx-rim-faint) 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  pointer-events: none;
}
/* Noise: same data-URI as depth field, opacity 0.35, mix-blend overlay */
.sx-glass::after { /* … */ }
```

Variant deltas (CSS custom-prop overrides per variant class, no new colors):
- `sidebar`: radius `--radius-xl`, blur 36px, `depth=floating`, fill-top slightly higher (0.07 dark / 0.72 light)
- `panel` / `card`: blur 24px, `depth=rest|raised`
- `menu` / `modal`: blur 40px, `depth=floating`, fill-top boosted for legibility over content, `--sx-shadow-elevated`
- `pill`: radius full, blur **0** (solid `--sx-surface` — pills are too small/numerous for live blur, Design Law 8), rim only on hover
- `dock`: like sidebar, horizontal

`interactive`: hover lifts fill-top by ~0.02 alpha + `translateY(-1px)`; press `scale(0.985)` (framer `whileTap` where wrapped, CSS `:active` otherwise). No color changes, no glow.

### 2.2 Refraction edge (the "How did you do that" layer)
`src/shared/ui/glass/RefractionFilter.tsx` mounts one hidden SVG once (in `Layout`):

```html
<svg width="0" height="0" aria-hidden>
  <filter id="sx-refract" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="7" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="14" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>
```
Applied as `backdrop-filter: blur(…) saturate(…) url(#sx-refract)` **only** when `refract` prop set AND runtime check passes (Chromium-only: feature-detect once via `CSS.supports('backdrop-filter','url(#x)')` + UA fallback; store in a module constant). Content scrolling *under* the sidebar visibly bends at the edge — that is the reference-photo effect. Firefox/Safari silently get the (already premium) blur stack. Keep `scale` ≤16 — subtlety is the difference between Apple and a codepen demo.

### 2.3 Rebuild the sidebar as a floating glass slab
`widgets/GlobalSidebar/GlobalSidebar.tsx` + `layout.css`:
- Geometry: detached slab — `position: fixed; inset: 12px auto 12px 12px; width: 248px;` radius `--radius-xl`. Content area gets `padding-left: 272px`. **Main content must scroll under/past the slab edge** so the glass has something to refract (Design Law 5; on routes with tables, let the page background pattern + depth field do the work).
- Replace `.app-sidebar` CSS body with `<Glass as={motion.aside} variant="sidebar" refract>`; delete `sidebarGlassDrift`, `--bg-sidebar`, `--border-sidebar` consumers.
- Nav items: **no borders, no pills-with-borders.** Rest = transparent; hover = `--sx-surface-hover` rounded-md; active = `--sx-surface-active` + a 2px accent tick on the left edge (the only accent in the sidebar) + text `--sx-text`. Icon stroke 1.55 stays.
- Workspace switcher button + profile dock: solid `--sx-surface` (no nested blur inside glass — nested backdrop-filters don't compose and tank perf), rim-on-hover only.
- Dropdowns (switcher, profile) become `<Glass variant="menu">`.
- Light theme check: slab must read as **white frosted glass with a soft slate shadow**, not a gray box — verify rim flips correctly from tokens.

### 2.4 Topbar & search
- Topbar: `<Glass variant="dock" depth="rest">` strip OR borderless transparent bar with only the search slab floating — pick the one that keeps ≤6 live-blur surfaces (Design Law 8) and matches the sidebar visually.
- Search field: `<Glass variant="pill" interactive>` with `⌘K` kbd chip in `label-caps`. Focus = accent focus ring token, nothing else.

### 2.5 Migrate `glass.css` recipes
- `.glass-card`, `.glass-menu`, `.glass-menu-item`, `.liquid-button`, `.glass-input`, `.glass-pill` re-implemented on the new layer system (same class names kept so all call-sites upgrade for free this phase; Phase 3 migrates call-sites to `<Glass>` where structure allows).
- `.liquid-button:active { transform: scale(0.90) }` → `0.97` (0.90 is cartoonish).
- Delete duplicated glass recipes inside `components.css` (search `backdrop-filter` there).

## Performance guardrails
- Count live `backdrop-filter` nodes on each main route (sidebar, topbar/search, open menu = ~3–4). Hard cap 6.
- Glass slabs get `transform: translateZ(0)` (own layer); never `will-change` on more than the sidebar.
- Scroll a 50-row task table with DevTools FPS meter: stay at 60 (rows are solid surfaces, so this should pass trivially).

## Definition of Done
- [ ] `<Glass>` exists with 7 variants, used by sidebar/topbar/menus; storybook-style demo route NOT needed — verify in app
- [ ] Sidebar = floating slab, refraction live in Chromium, graceful in Firefox; zero uniform borders inside it
- [ ] Old `.glass-*` classes render through the new layer system
- [ ] Both themes verified side-by-side on Home, Projects, Tasks
- [ ] `npm run lint && npm run build` green

Commit: `feat(frontend): [glass 2/5] Glass material system, refraction filter, floating sidebar + topbar`
Append handoff to `PROGRESS.md`.
