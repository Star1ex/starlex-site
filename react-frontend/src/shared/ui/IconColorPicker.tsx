import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Search } from 'lucide-react';
import { Glass } from '@/shared/ui/glass/index.js';
import {
  PROJECT_ICONS,
  PROJECT_ICON_NAMES,
  PROJECT_ICON_COLORS,
  DEFAULT_PROJECT_ICON_COLOR,
  buildLucideIcon,
  parseProjectIcon,
} from '@/shared/lib/projectIcon.js';
import { ProjectIcon } from '@/shared/ui/ProjectIcon.js';
import { ICONS as EMOJI_ICONS } from '@/shared/ui/IconPickerIcons.js';

interface IconColorPickerProps {
  value: string;
  onChange: (token: string) => void;
  disabled?: boolean;
  /** Class for the trigger button. */
  triggerClassName?: string;
  /** Icon size inside the trigger. */
  triggerIconSize?: number;
}

type Tab = 'icons' | 'emojis';

const POPOVER_W = 288;
const POPOVER_H = 360;

export function IconColorPicker({
  value,
  onChange,
  disabled,
  triggerClassName = '',
  triggerIconSize = 18,
}: IconColorPickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [tab, setTab] = useState<Tab>('icons');
  const [query, setQuery] = useState('');

  const parsed = parseProjectIcon(value);
  // Selected swatch: follow the saved colour while one is set, otherwise keep
  // the user's pending choice for the next icon they pick.
  const [pendingColor, setPendingColor] = useState(DEFAULT_PROJECT_ICON_COLOR);
  const color = parsed.kind === 'lucide' && parsed.color ? parsed.color : pendingColor;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleOpen = () => {
    if (disabled || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    let top = rect.bottom + 6;
    let left = rect.left;
    if (top + POPOVER_H > window.innerHeight) top = Math.max(8, rect.top - POPOVER_H - 6);
    if (left + POPOVER_W > window.innerWidth) left = window.innerWidth - POPOVER_W - 8;
    setPos({ top, left });
    setQuery('');
    setOpen(true);
  };

  const filteredIcons = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PROJECT_ICON_NAMES;
    return PROJECT_ICON_NAMES.filter((n) => n.toLowerCase().includes(q));
  }, [query]);

  const filteredEmojis = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EMOJI_ICONS.filter((e) => e.value && (!q || e.label.toLowerCase().includes(q)));
  }, [query]);

  const pickColor = (c: string) => {
    setPendingColor(c);
    if (parsed.kind === 'lucide' && parsed.name) onChange(buildLucideIcon(parsed.name, c));
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        title="Set icon"
        className={triggerClassName || 'icon-picker-trigger'}
      >
        <ProjectIcon icon={value} size={triggerIconSize} chip />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
              <Glass
                as={motion.div}
                variant="menu"
                depth="floating"
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.13, ease: 'easeOut' } }}
                exit={{ opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.09 } }}
                className="icon-color-picker fixed z-[9999]"
                style={{ top: pos.top, left: pos.left, width: POPOVER_W }}
              >
                {/* colour row */}
                <div className="icp-colors">
                  {PROJECT_ICON_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      aria-label={c.label}
                      onClick={() => pickColor(c.value)}
                      className="icp-swatch"
                      data-active={color === c.value ? 'true' : undefined}
                      style={{ background: c.value }}
                    >
                      {color === c.value && <Check size={11} strokeWidth={3} color="#fff" />}
                    </button>
                  ))}
                </div>

                {/* tabs */}
                <div className="icp-tabs">
                  <button type="button" className="icp-tab" data-active={tab === 'icons' || undefined} onClick={() => setTab('icons')}>Icons</button>
                  <button type="button" className="icp-tab" data-active={tab === 'emojis' || undefined} onClick={() => setTab('emojis')}>Emojis</button>
                </div>

                {/* search */}
                <div className="icp-search">
                  <Search size={14} className="icp-search-icon" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={tab === 'icons' ? 'Search icons…' : 'Search emojis…'}
                  />
                </div>

                {/* grid */}
                <div className="icp-grid">
                  {tab === 'icons'
                    ? filteredIcons.map((nm) => {
                        const Glyph = PROJECT_ICONS[nm];
                        const active = parsed.kind === 'lucide' && parsed.name === nm;
                        return (
                          <button
                            key={nm}
                            type="button"
                            title={nm}
                            onClick={() => { onChange(buildLucideIcon(nm, color)); setOpen(false); }}
                            className="icp-cell"
                            data-active={active || undefined}
                          >
                            <Glyph size={18} strokeWidth={2} color={active ? color : 'currentColor'} />
                          </button>
                        );
                      })
                    : filteredEmojis.map((e) => (
                        <button
                          key={e.value}
                          type="button"
                          title={e.label}
                          onClick={() => { onChange(e.value); setOpen(false); }}
                          className="icp-cell"
                          data-active={value === e.value || undefined}
                          style={{ fontSize: 18 }}
                        >
                          {e.value}
                        </button>
                      ))}
                  {tab === 'icons' && filteredIcons.length === 0 && <p className="icp-empty">No icons</p>}
                  {tab === 'emojis' && filteredEmojis.length === 0 && <p className="icp-empty">No emojis</p>}
                </div>
              </Glass>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

export default IconColorPicker;
