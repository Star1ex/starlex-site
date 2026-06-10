# Starlex Liquid Glass Redesign — Master Plan

> Date: 2026-06-10
> Scope: `react-frontend` only. Backend untouched.
> Goal: a premium Apple-Liquid-Glass × Linear product in exactly **two themes — Ultra Dark and Light** — with zero "AI-generated" visual tells: no glow, no purple haze, no border soup, no flat soap-glass. The reaction we are engineering for: **"How did you build this?"**

This plan **supersedes** `SESSION-1/2/3-*.md` and the theming part of `FRONTEND-REVIEW-03-LIGHT-THEME.md`. `FRONTEND-REVIEW-01-REFACTOR-CLEANUP.md` and `FRONTEND-REVIEW-02-PERFORMANCE.md` remain valid as later follow-ups.

---

## 1. How to run this plan

Five phases, each is a self-contained session prompt. Recommended grouping:

| Session | Phases | Theme of the session |
|---------|--------|----------------------|
| **A** | `01-foundation.md` | Token contract, 2-theme reset, depth-field background, kill light.css override layer |
| **B** | `02-glass-core-sidebar.md` | The `<Glass>` material system + the hero glass sidebar + topbar |
| **C** | `03-surfaces.md` | Tables, lists, cards, pills — every content surface |
| **D** | `04-overlays-settings.md` | Settings, dialogs, menus, command palette, toasts |
| **E** | `05-motion-polish-qa.md` | Motion choreography, wow details, dual-theme QA gate |

Each phase can also run as its own session (5 sessions) — phases declare their prerequisites. **Never run phases out of order.** Start every session with:

```
Read docs/plans/liquid-glass/00-MASTER.md fully, then execute docs/plans/liquid-glass/0N-<phase>.md.
```

### Skills/tools to load per session (Claude Code)
- `/shadcn` — when adding/restyling primitives (sessions B, C, D)
- `everything-claude-code:liquid-glass-design` — material principles (sessions B, C, D, E)
- `everything-claude-code:frontend-patterns`, `vercel:react-best-practices` — component hygiene (all)
- For Codex sessions: paste §3 "Design Laws" + the phase file verbatim; they are written to be executor-agnostic.

### Verification gate (every phase, no exceptions)
```bash
cd react-frontend && npm run lint && npm run build
```
Build must be green before commit. Commit per phase as `critiq17 <critiq17@gmail.com>`:
`feat(frontend): [glass N/5] <phase summary>`.

---

## 2. Review findings (why it currently looks cheap)

Full review of `react-frontend` (2026-06-10, branch `feature/projects`, commit `after checkpoint`):

### 2.1 The glow/haze problem — the #1 "AI style" tell
- `tokens.css` `--sx-body-bg` paints a **purple radial glow** (`--starlex-accent-rgb / 0.10`) in the top-left of every page; `--ambient-glow` adds more. The reference screenshots show it as the smoky violet fog around the sidebar.
- `--star-glow`, `sidebarGlassDrift` animation, accent-tinted shadows (`--starlex-accent-glow`) all push the same "neon mist" language.
- **Verdict: remove the entire glow vocabulary.** Premium glass reads through *luminance structure*, not color fog.

### 2.2 Soap-glass: uniform fill + uniform border
- `.glass-card` = flat `rgb(255 255 255 / 0.035)` fill + uniform 1px `--sx-border` on **all four sides** + a single inset highlight. That is frosted plexiglass, not liquid glass. Real glass has: a *rim* that catches light unevenly (bright top edge, dark bottom), interior thickness (bottom inner shadow), and content-dependent refraction.
- Border inflation: panels, rows, chips, inputs, pills each carry their own 1px border → the "million borders" the owner hates. Elevation must come from **luminance deltas + shadow**, borders only where semantically necessary.

### 2.3 Theme architecture is inverted and 4-way diluted
- 4 themes exist (`dark` default, `light`, `ultra-dark`, `solarized`); the product needs **2**. The default `:root` dark in `tokens.css` is *not* the Ultra Dark in `themes/ultra-dark.css` — two competing darks.
- `themes/light.css` is **640 lines of `!important` overrides** targeting hardcoded utility classes (`.text-white\/68`, `.bg-white\/5`) and ~80 page-specific class names. Every new component silently breaks light theme. This file must die; both themes must feed the **same token contract**.

### 2.4 Monolith CSS, weak system
- `components.css` is **2,906 lines** of per-page semantic classes (`.tasks-*`, `.settings-*`, `.project-*`) with duplicated glass recipes inline. There is no single material source of truth; 13 files use `.glass-card`, 9 use raw `backdrop-blur`, others hand-roll.
- Legacy alias tokens (`--bg-secondary: #051424` — a *blue* that no longer matches anything) still leak into components.

### 2.5 Stock-palette tells
- Accent is default Tailwind indigo `#6366f1`; status colors are stock Tailwind 300/400-series hexes. Instantly recognizable as template output. The brand mark in the topbar is crimson — the UI accent ignores it.

### 2.6 What is already good (keep)
- Geist Variable + JetBrains Mono label-caps direction; semantic class naming discipline in newer pages; framer-motion with custom springs (`--ease-out-expo`); shadcn primitives present (`components.json`, radix-nova style, Tailwind 3.4); FSD layout; route preloading; the Ultra Dark warm-black base `#0b090a` is a tasteful choice — it becomes the canonical dark canvas.

---

## 3. Design Laws (paste into every session, non-negotiable)

1. **Two themes only.** `ultra-dark` (default) and `light`. Same token names, different values. No theme-specific selectors in component CSS — *ever*. If a component needs `:root.light …` you are doing it wrong; fix the token.
2. **No glow. No haze. No colored fog.** Zero radial accent gradients, zero accent-tinted shadows, zero "ambient" anything. Shadows are neutral black (dark theme: deep & soft; light theme: cool slate, low alpha).
3. **Borders are a last resort.** Default separation = background luminance delta + shadow + spacing. A surface may have a *rim* (gradient mask, uneven, light-catching) — never a uniform 4-side hairline. Interior dividers: max 1 per logical group, at 4–6% alpha.
4. **Glass is a material, not a paint.** Every glass surface comes from the one `<Glass>` component / `glass()` recipe (Phase 2). Hand-rolled `backdrop-filter` outside it is a review-blocker.
5. **Glass needs something behind it.** The app shell renders a *depth field* (monochrome, ≤4% luminance variation + fine noise). Glass over flat `#000` is invisible; glass over fog is cheap. Depth field is the only thing allowed behind the sidebar.
6. **One accent, used like a scalpel.** Accent appears only on: primary CTA, focus ring, selection indicator, active nav tick. Never on panel fills, shadows, or backgrounds. Everything else is monochrome.
7. **Animate transform & opacity only.** Never animate `backdrop-filter`, `blur`, `box-shadow`, or layout properties. Springs from the motion tokens (Phase 5). Respect `prefers-reduced-motion`.
8. **Limit live glass.** Max ~6 `backdrop-filter` surfaces per viewport (sidebar, topbar, 1 floating panel, overlays). Tables/rows/chips use *solid* token surfaces that emulate glass (pre-mixed colors) — zero per-row blur.
9. **Typography carries the premium.** Tight tracking on titles (−0.01em to −0.02em), 13px base UI size, mono `label-caps` for keys/metadata, generous line-height nowhere above 1.5 in dense UI.
10. **Both themes ship together.** A task is done only when verified in Ultra Dark *and* Light. No `text-white` literals — semantic tokens only.

---

## 4. Target architecture

### 4.1 Token contract (Phase 1 builds this)
```
styles/
  tokens.css        ← contract: every --sx-* token DECLARED once with ultra-dark values on :root
  themes/light.css  ← the SAME token list re-valued under :root[data-theme="light"]  (≈120 lines, zero !important)
  glass.css         ← material recipes consuming only tokens
  motion.css        ← duration/spring/stagger tokens
  components.css    ← shrinking; consumes tokens; no colors, no blurs inline
```
Theme switching = `data-theme` attribute on `<html>`. `Theme` type becomes `'ultra-dark' | 'light'`; stored prefs migrate (`dark|ultra-dark→ultra-dark`, `light|solarized→light`).

### 4.2 The material: `<Glass>` (Phase 2 builds this)
One component, CVA variants, layered construction (fill gradient → rim mask → inner thickness → noise → optional Chromium refraction). Variants: `sidebar | panel | card | menu | modal | pill | dock`. Spec in `02-glass-core-sidebar.md`.

### 4.3 Libraries
Already present: shadcn CLI (radix-nova), radix-ui, framer-motion, CVA, tailwind-merge, Tailwind 3.4, Geist.
Add in Phase 4 (not earlier): `cmdk` (command palette), `sonner` (toasts), `vaul` (mobile drawer, optional). Add nothing else without a stated reason.

### 4.4 Decisions made (do not relitigate mid-phase)
| Decision | Value |
|---|---|
| Themes | `ultra-dark` (default), `light` — solarized & old `dark` deleted |
| Dark canvas | `#08070a` (near-black, slightly warm; sidebar glass must survive on it) |
| Light canvas | `#f4f5f7` cool paper, white glass panels |
| Accent | Brand crimson family, single hue: `#e6455a` (dark) / `#d63852` (light) — replaces stock indigo `#6366f1` everywhere |
| Status/priority palette | Custom desaturated set defined in Phase 1 (not Tailwind stock) |
| Fonts | Geist Variable (UI) + JetBrains Mono (label-caps) — unchanged |
| Refraction filter | Optional progressive enhancement, Chromium-only, sidebar + dock only |

---

## 5. Phase index

| File | Output |
|---|---|
| `01-foundation.md` | Token contract, theme reset to 2, depth field, accent swap, light.css override layer deleted |
| `02-glass-core-sidebar.md` | `<Glass>` material system; sidebar rebuilt as the hero glass slab; topbar/search |
| `03-surfaces.md` | Projects table, tasks explorer, my-issues, members, home bento — all on the material system |
| `04-overlays-settings.md` | Settings modal (glass), dialogs, dropdowns, ⌘K palette, toasts |
| `05-motion-polish-qa.md` | Motion tokens & choreography, wow micro-interactions, full dual-theme QA gate |

Every phase ends with: verification gate → commit → one-paragraph handoff note appended to `docs/plans/liquid-glass/PROGRESS.md`.
