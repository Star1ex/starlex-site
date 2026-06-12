# Starlex Liquid Glass V2 — The Transparency Doctrine

> Date: 2026-06-11
> Scope: `react-frontend` only. Backend untouched.
> Supersedes: the **visual goals** of `docs/plans/liquid-glass/` (v1). The v1 *architecture* — token contract, `<Glass>` component, 2-theme `data-theme` switch, motion tokens, chip doctrine — is correct and **stays**. What changes is the material physics, the backdrop, and where glass is allowed to live.
> Goal: the most minimal liquid-glass product UI possible. **Light theme: white canvas, sidebar and every control literally transparent — yet perfectly legible.** Ultra Dark: the same physics over near-black. The reaction we want: *"this is actual glass."*

---

## 1. Verdict on V1 — confirmed against the owner's live screenshots

V1 ran all 5 phases (lint+build green every time) and still produced flat panels. The owner's screenshots of the running app (both themes) are committed under `shots/baseline/` — **look at them before touching anything**. Findings, each confirmed in those pixels:

1. **The canvas is dead flat in both themes.** `shots/baseline/dark-home.png`: a sea of pure black; the depth field (1.5–3% alpha) is invisible, so `blur(36px)` has nothing to bend — the sidebar reads as a gray box. Light (`light-projects.png`): flat pale gray, same problem.
2. **The rim reads as a uniform 1px border** — the exact thing v1 Law 3 tried to kill. At these fill levels the rim gradient's asymmetry is imperceptible; every slab in `dark-members.png` looks border-soup boxed, not light-caught.
3. **Light theme is washed white-on-white.** White panels (`--sx-surface: #ffffff`, glass fills 0.65–0.85) on `#f4f5f7` with 10%-alpha shadows: panels don't lift, controls vanish (`light-members.png`, `light-login.png` — OAuth buttons are invisible). The settings modal (`light-settings-modal.png`) reads as a muddy gray sheet: an 0.85-white fill blurring a dark scrim.
4. **Every control is opaque in both themes.** Workspace pill, Settings button, user card, search pill, table rows — solid hex boxes (`--sx-surface`). Zero translucency anywhere except the sidebar slab.
5. **A purple haze leaks through the dark settings modal** (`dark-settings-modal.png`, top band). Blurred content pushed through `saturate(160%)` (and/or the `refract` displacement) smears accent/status hues into a violet fog — a direct Law-2 violation that shipped because nobody looked.
6. **Violet tokens survived in the palette.** `--priority-medium-text` (#a190d9/#7a64c2) and `--status-progress-text` (#8f8ae0/#6257c9) render as the forbidden purple — see the "Medium" chip in `dark-projects.png`/`light-projects.png`.
7. **Native OS scrollbars with arrow buttons** are visible at the content edge (`dark-my-issues.png`, `light-tasks.png`, `light-members-scroll.png`). Nothing premium survives a Windows-95 scrollbar.
8. **Glass was spent on content instead of chrome.** Tables/panels/bento wrapped in `<Glass>`; the board alone (N cards × blur) blows v1's own ≤6-blur law. Apple's system is the inverse: content is plain, **chrome is glass**.
9. **No phase ever looked at the result.** Every gate was lint+build+grep; all five PROGRESS entries admit "live visual QA not run". That is how 0.85-alpha "glass", purple fog, and OS scrollbars shipped five times in a row.

(Minor, noted for scope: the Home page's Create Task/Create Project buttons float mid-air at the top right, disconnected from content — a composition nit folded into Phase 3.)

---

## 2. Doctrine V2 — three material tiers

```
Tier A — CHROME GLASS   real backdrop-filter; ≤6 per viewport
         sidebar · topbar search pill's parent dock · dropdown menus ·
         modals · ⌘K · toasts
Tier B — TRANSLUCENT SURFACE   alpha fill over canvas; NO blur, near-free
         buttons · pills · chips · inputs · table rows · board cards
Tier C — CANVAS   the depth field; content typography sits directly on it
```

- **Glass is for chrome, not for content.** Tables, lists, bento panels lose their `<Glass>` wrappers and sit naked on the canvas (Linear-style). Separation = typography, spacing, tier-B row tint.
- **Transparency is alpha, not white paint.** Tier B gets its translucency from low-alpha fills (the depth field shows through) — physically honest and costs nothing. A 32px button has nothing meaningful to blur anyway; blur is reserved for surfaces that *content passes behind*.
- **The canvas must be alive.** A depth field you can actually see (5–9% amplitude + noise + scroll parallax) is what makes both tiers read as glass. This is the single highest-leverage change in the whole plan.

Because v1's token contract is real, **most of V2 is token re-values, not call-site churn**: re-value `--sx-surface*` to alpha and the entire app's tier B converts at once.

---

## 3. Design Laws V2

Laws 1–10 from v1 `00-MASTER.md` §3 remain in force (two themes; no glow; borders last resort; one `<Glass>` source; accent as scalpel; transform/opacity-only animation; typography carries premium; both themes ship together) **with these amendments and additions**:

11. **No opaque hex on any interactive or container surface.** Buttons, chips, rows, pills, inputs, cards = alpha fills over canvas. The only opaque values in the app: `--sx-canvas`, `--sx-canvas-elevated`, text, and the explicit escape hatch `--sx-opaque` (for sticky headers / scroll-clip contexts where bleed-through is a bug, applied case-by-case when a screenshot shows an artifact).
12. **Every glass surface must have something to show.** Depth field ≥5% luminance amplitude in dark, visible cool-slate structure in light, fine noise in both, subtle scroll parallax. Glass over a flat canvas is a bug.
13. **Cards and rows never blur** (replaces v1 Law 8's "pills are solid"): tier B exactly. The ≤6 live-blur cap now applies only to tier A chrome.
14. **Light glass is defined by edge + shadow, not fill.** Light theme slabs get a dual edge — outer slate hairline (`--sx-edge`, in the box-shadow stack, transparent in dark) + the existing inner white rim — and a **two-layer** slate shadow (tight contact + soft ambient). Fill stays near-transparent.
15. **No phase is done without screenshots.** The gate for every phase is `npm run lint && npm run build && npm run visual-qa` **and a human/agent look at the produced PNGs in both themes**. Grep is not a design tool.
16. **A rim is not a border.** If a slab's edge reads as a uniform 1px line in a screenshot, the rim is wrong: bright segment top-left only, fully transparent from ~45% down. Verified per phase in the lab.
17. **No violet anywhere** — not in chips, not blurred *behind* glass. The saturate/refract chain must never smear hues into fog (the `dark-settings-modal.png` bug class).
18. **No native scrollbars.** Every scroll container shows the styled thin overlay scrollbar from the contract tokens.

---

## 4. Token spec V2 (the exact re-values)

Phase 2 applies this diff to `styles/tokens.css` (`:root`, ultra-dark) and `styles/themes/light.css`. Values marked ± are lab-tunable within the stated range; everything else is fixed. Tokens not listed are unchanged.

### 4.1 Ultra-dark (`:root`)

| Token | v1 | **v2** | Why |
|---|---|---|---|
| `--sx-depth-a` | `rgb(255 255 255 / 0.03)` | `rgb(255 255 255 / 0.07)` ±0.02 | field must be visible (§1.1) |
| `--sx-depth-b` | `0.015` | `rgb(255 255 255 / 0.04)` ±0.01 | |
| `--sx-depth-c` | — | `rgb(255 255 255 / 0.05)` | new third blob (see §5.4) |
| `--sx-depth-noise` | — | `0.5` | noise opacity, theme-tokenized |
| `--sx-glass-fill-top` | `0.055` | `rgb(255 255 255 / 0.05)` | keep thin |
| `--sx-glass-fill-bottom` | `0.02` | `rgb(255 255 255 / 0.015)` | |
| `--sx-glass-fill-top-raised` | `0.07` | `rgb(255 255 255 / 0.06)` | |
| `--sx-glass-fill-top-strong` | `0.10` | `rgb(255 255 255 / 0.12)` | overlays keep legibility |
| `--sx-glass-brightness` | — | `1.12` ±0.04 | new: lifts the blurred field through the glass |
| `--sx-glass-saturate` | `160%` (shared) | `130%` ±20 | per-theme now; prime suspect of the purple smear (§1.5) |
| `--sx-edge` | — | `transparent` | dark slabs are edged by the rim alone |
| `--sx-rim-bright` | `0.28` | `rgb(255 255 255 / 0.38)` | rim must read as light-catch, not border (Law 16) |
| `--sx-surface` | `#100f13` | `rgb(255 255 255 / 0.045)` | tier B translucency |
| `--sx-surface-hover` | `#17161b` | `rgb(255 255 255 / 0.08)` | |
| `--sx-surface-active` | `#1d1c22` | `rgb(255 255 255 / 0.115)` | |
| `--sx-opaque` | — | `#121116` | escape hatch (Law 11) |
| `--sx-shadow-soft` | single layer | `0 1px 2px rgb(0 0 0 / 0.40), 0 16px 48px rgb(0 0 0 / 0.50)` | contact + ambient |
| `--sx-shadow-elevated` | single layer | `0 2px 6px rgb(0 0 0 / 0.45), 0 32px 80px rgb(0 0 0 / 0.60)` | |
| `--sx-scrollbar-thumb` | — | `rgb(255 255 255 / 0.14)` | Law 18 |
| `--status-progress-text` | `#8f8ae0` (violet) | `#d4c06b` ± hue | Law 17 — In-Progress goes gold |
| `--priority-medium-text` | `#a190d9` (violet) | `#cdb964` ± hue | Law 17 — any non-violet hue, decide in lab |

### 4.2 Light (`:root[data-theme="light"]`)

| Token | v1 | **v2** | Why |
|---|---|---|---|
| `--sx-canvas` | `#f4f5f7` | `#f0f2f5` ± | a step darker so white-ish glass can exist above it |
| `--sx-depth-a` | `rgb(20 24 33 / 0.02)` | `rgb(20 24 33 / 0.055)` ±0.015 | white canvas needs visible structure or transparent glass is invisible |
| `--sx-depth-b` | `0.015` | `rgb(20 24 33 / 0.035)` | |
| `--sx-depth-c` | — | `rgb(20 24 33 / 0.04)` | |
| `--sx-depth-noise` | — | `0.3` | full noise on white looks dirty |
| `--sx-glass-fill-top` | **`0.65`** | `rgb(255 255 255 / 0.12)` ±0.04 | THE fix: glass, not paint |
| `--sx-glass-fill-bottom` | **`0.40`** | `rgb(255 255 255 / 0.03)` | |
| `--sx-glass-fill-top-raised` | **`0.72`** | `rgb(255 255 255 / 0.16)` ±0.04 | sidebar fully transparent |
| `--sx-glass-fill-top-strong` | **`0.85`** | `rgb(255 255 255 / 0.45)` ±0.08 | modals/⌘K: translucent, still legible over arbitrary content |
| `--sx-glass-brightness` | — | `1.06` ±0.03 | |
| `--sx-glass-saturate` | `160%` (shared) | `170%` ±10 | light benefits from saturation lift |
| `--sx-edge` | — | `rgb(15 23 42 / 0.12)` | Law 14 dual edge |
| `--sx-rim-bright` | `rgb(255 255 255 / 0.85)` | `rgb(255 255 255 / 0.95)` | crisp inner highlight |
| `--sx-surface` | **`#ffffff`** | `rgb(15 23 42 / 0.045)` | tier B = faint slate tint over white (white-alpha is invisible on white) |
| `--sx-surface-hover` | `#f0f1f4` | `rgb(15 23 42 / 0.07)` | |
| `--sx-surface-active` | `#e8eaee` | `rgb(15 23 42 / 0.10)` | |
| `--sx-opaque` | — | `#ffffff` | |
| `--sx-shadow-soft` | `0 16px 48px / 0.10` | `0 1px 2px rgb(20 24 33 / 0.08), 0 16px 48px rgb(20 24 33 / 0.14)` | §1.3: panels must actually lift |
| `--sx-shadow-elevated` | `0 32px 80px / 0.16` | `0 2px 6px rgb(20 24 33 / 0.10), 0 32px 80px rgb(20 24 33 / 0.22)` | |
| `--sx-overlay` | `rgb(20 24 33 / 0.32)` | `rgb(20 24 33 / 0.22)` ± | lighter scrim so light modals stop reading muddy gray (§1.3) |
| `--sx-scrollbar-thumb` | — | `rgb(15 23 42 / 0.18)` | |
| `--status-progress-text` | `#6257c9` (violet) | `#8f7426` ± hue | AA on white |
| `--priority-medium-text` | `#7a64c2` (violet) | `#8f7426` ± hue | |

Notes:
- Legibility floor (hard): `--sx-text-muted` ≥4.5:1 against the *brightest* depth-field area seen through tier-A glass and against tier-B fills, both themes. Tune fills up, never text down.
- Tier-B fills are translucent and **stack**: a hover tint inside a tinted card double-darkens. Rule: rows inside a tier-B container are transparent at rest, tint on hover only.
- Gold for In-Progress/Medium may collide visually where a gold status chip and gold priority chip share a row — acceptable (low/todo already share blue); if it bothers in the lab, shift one ±20° hue. **Hard requirement is only: no violet.**

---

## 5. Material spec V2 (`shared/ui/glass/glass.css` + `styles/base.css`)

### 5.1 Filter chain
```css
backdrop-filter: blur(var(--glass-blur, var(--sx-glass-blur)))
                 saturate(var(--sx-glass-saturate))
                 brightness(var(--sx-glass-brightness, 1));
```
(+ `-webkit-` twin, + `url(#sx-refract)` appended in `--refract` as today).

**Purple-smear diagnosis (Law 17, §1.5):** in the lab, render the modal specimen over the busy content block and isolate the violet band by toggling, one at a time: `saturate` → 100%, `refract` off, noise layer off. Fix at the source found (expected: saturate clamp in dark and/or `refract` removed from `modal` variant in dark). Do not ship any configuration that shows hue fog behind glass.

### 5.2 Shadow stack gains the outer edge (Law 14)
```css
box-shadow:
  0 0 0 1px var(--sx-edge),                      /* light-theme definition; transparent in dark */
  var(--glass-shadow, var(--sx-shadow-soft)),
  inset 0 -12px 24px -16px var(--sx-thickness);
```

### 5.3 Rim asymmetry (Law 16, §1.2)
The `::before` rim gradient is re-cut so it cannot read as a uniform border:
```css
background: linear-gradient(160deg,
  var(--sx-rim-bright),
  var(--sx-rim-faint) 22%,
  transparent 45%,          /* fully gone by 45% — was visible to 100% */
  transparent 100%);
```
Verify in the lab at 200% zoom: bright top-left arc, *nothing* on the bottom edge.

### 5.4 Variant demotions (tier doctrine)
- `--pill` and `--card`: **no backdrop-filter** (card currently blurs — remove), background `var(--sx-surface)` (now alpha ⇒ translucent), keep rim-on-hover for pill, keep hover lift + shadow-tier raise for card. These become the canonical tier-B recipes.
- `--panel`: deprecated. Phase 3 removes its call-sites; delete the variant after.
- `--sidebar | --menu | --modal | --dock`: unchanged structure, new token values flow in.
- Specular rim, noise layer: keep. Refraction: keep on sidebar; modal pending §5.1 diagnosis.

### 5.5 Depth field v2 (`styles/depth.css`)
- Three blobs (add `--sx-depth-c`, ~700×500px at 70% 30%), plus a faint vertical luminance ramp (`linear-gradient(180deg, var(--sx-depth-a), transparent 40%)`) so the field has large-scale structure top-to-bottom.
- Noise opacity from `--sx-depth-noise` (0.5 dark / 0.3 light) — token, not a theme selector.
- **Scroll parallax** (phase 3): the field translates `scrollY * -0.04` via one rAF listener writing `--depth-shift`, consumed as `transform: translateY(var(--depth-shift))`. Transform-only, `prefers-reduced-motion` disables. This is what makes the sidebar glass *move* and read as glass while scrolling.

### 5.6 Scrollbars (Law 18, §1.7) — `styles/base.css`
```css
* { scrollbar-width: thin; scrollbar-color: var(--sx-scrollbar-thumb) transparent; }
*::-webkit-scrollbar { width: 8px; height: 8px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb { background: var(--sx-scrollbar-thumb); border-radius: 4px; }
*::-webkit-scrollbar-button { display: none; }
```
Thumb hover one step up via `color-mix`. Verify on: tasks table, my-issues, members, settings modal inner scroll, ⌘K results.

---

## 6. How to run this plan

| Phase | File | Theme |
|---|---|---|
| 1 | `01-lab-harness.md` | Eyes first: `/glass-lab` route + `npm run visual-qa` screenshot harness |
| 2 | `02-material-retune.md` | Token tables §4 + material §5 applied; tuned **in the lab** until both themes read as glass |
| 3 | `03-chrome-vs-content.md` | Strip content glass (minimalism pass); buttons/rows/cards → tier B; depth parallax; real routes verified |
| 4 | `04-signature-motion-qa.md` | ⌘K morph, nav-tick spring, press physics; full dual-theme QA walk on real routes |

- **Never run phases out of order** — 2–4 depend on the harness existing.
- Start every session with: `Read docs/plans/liquid-glass-v2/00-MASTER.md fully, look at shots/baseline/, then execute docs/plans/liquid-glass-v2/0N-<phase>.md.`
- Gate, every phase: `cd react-frontend && npm run lint && npm run build && npm run visual-qa` → **open the PNGs, check both themes against the phase's checklist**. Append a PROGRESS.md entry (what shipped / deviations / what the screenshots showed).
- Commit per phase as `critiq17 <critiq17@gmail.com>`: `feat(frontend): [glass-v2 N/4] <summary>`.
- For Codex sessions: paste §2–§5 of this file + the phase file verbatim.

### Non-goals (do not drift into these)
- Marketing pages (`HomePage`, `AboutUs`, `Dashboard`) — separate pass.
- The `components.css` monolith refactor & legacy-alias deletion — `FRONTEND-REVIEW-01-REFACTOR-CLEANUP.md` owns it. V2 only *re-values tokens*, so the monolith follows automatically.
- New layout structure, new fonts. The typography scale, motion tokens, and chip doctrine from v1 are final. Palette changes are limited to the two violet tokens (§4).
