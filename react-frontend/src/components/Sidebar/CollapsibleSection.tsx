import React, { useEffect, useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  storageKey?: string; // top-level storage key
  sectionKey?: string; // key inside storage object
  className?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

const readState = (storageKey: string | undefined, sectionKey: string | undefined) => {
  if (!storageKey || !sectionKey) return undefined;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return undefined;
    const obj = JSON.parse(raw);
    return !!obj[sectionKey];
  } catch (err) {
    return undefined;
  }
};

const writeState = (storageKey: string | undefined, sectionKey: string | undefined, val: boolean) => {
  if (!storageKey || !sectionKey) return;
  try {
    const raw = localStorage.getItem(storageKey);
    const obj = raw ? JSON.parse(raw) : {};
    obj[sectionKey] = !!val;
    localStorage.setItem(storageKey, JSON.stringify(obj));
  } catch (err) {
    // ignore
  }
};

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, defaultExpanded = true, storageKey, sectionKey, className = '', action, children }) => {
  const [expanded, setExpanded] = useState(() => {
    const persisted = readState(storageKey, sectionKey);
    return persisted !== undefined ? persisted : defaultExpanded;
  });

  useEffect(() => {
    writeState(storageKey, sectionKey, expanded);
  }, [expanded, storageKey, sectionKey]);

  const toggle = () => setExpanded(v => !v);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div className={`collapsible-section ${className}`}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-border px-3 py-2 rounded-md transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className={`chevron-icon w-3 h-3 text-gray-500 transition-transform ${expanded ? 'expanded rotate-90' : ''}`} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4l6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          {action}
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${expanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-1 pt-2 pb-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
