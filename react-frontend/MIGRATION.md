# Legacy → FSD Migration Map

Status as of F0 (2026-06-08).

## `src/components/` inventory

| Legacy path | FSD destination | Status |
|-------------|-----------------|--------|
| `components/MarkdownEditor.tsx` (133B stub) | Re-exports `components/TaskView/MarkdownEditor.tsx` — **delete stub in F4** | stub resolved |
| `components/TaskView/MarkdownEditor.tsx` | `features/markdown/` | move in F4 |
| `components/TaskView/MarkdownPreview.tsx` | `features/markdown/` | move in F4 |
| `components/Tasks/TaskView.tsx` | `features/tasks/TaskDetail/` | move in F3 |
| `components/Sidebar/` (entire dir) | **Deleted** — replaced by `widgets/GlobalSidebar/GlobalSidebar.tsx` | ✅ F0 done |
| `components/Dropdown/` | `shared/ui/Dropdown/` | move in F3 |
| `components/Virtualized/VirtualList.tsx` | `shared/ui/VirtualList/` | move when first needed |
| `components/ErrorBoundary.tsx` | duplicate of `shared/ui/ErrorBoundary.tsx` — **delete in F5** | pending |
| `components/shared/IconPicker.tsx` | duplicate of `shared/ui/IconPicker.tsx` — **delete in F5** | pending |
| `components/shared/InlineEdit.tsx` | `shared/ui/InlineEdit/` | move when needed |

## Folder routes (backend-dead)

Folders have been removed from the backend. The following are quarantined:

- `hooks/useFolders.ts` — **delete in F3** (no backend)
- `components/Sidebar/FolderInlineCreate.tsx` — **delete in F3**
- `components/Sidebar/FolderItem.tsx` — **delete in F3**
- `components/Sidebar/FolderTree.tsx` — **delete in F3**
- `services/api/folder.service.ts` — **delete in F3**
- Folder-related CSS in `index.css` — **clean in F3**

## Done in F0

- `widgets/GlobalSidebar/GlobalSidebar.tsx` — full glass sidebar (was thin wrapper → legacy Sidebar)
- `widgets/Layout/Layout.tsx` — glass shell (240px sidebar + 80px topbar)
- `widgets/Topbar/Topbar.tsx` — new, centered ⌘K search
- `shared/ui/Button.tsx` — liquid-button variants
- `shared/ui/Input.tsx` — glass-input
- `shared/ui/Modal.tsx` — glass-card modal
- `shared/contexts/ThemeContext.tsx` — added `setAccent`/`clearAccent`
- `tailwind.config.js` — Liquid Glass tokens
- `index.css` — full Liquid Glass rewrite + glass-card/liquid-button/glass-input recipes
- `index.html` — Hanken Grotesk / Inter / JetBrains Mono / Material Symbols
