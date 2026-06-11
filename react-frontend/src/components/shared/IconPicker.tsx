import React from 'react';

const DEFAULT_ICONS = ['📁', '📂', '🗂️', '✅', '🧠', '🚀', '📌', '📝'];

export const IconPicker: React.FC<{ value?: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
  return (
    <div className="flex flex-wrap gap-1">
      {DEFAULT_ICONS.map((icon) => (
        <button
          key={icon}
          type="button"
          onClick={() => onChange(icon)}
          className={`w-7 h-7 flex items-center justify-center rounded border ${
            value === icon ? 'border-[color:var(--sx-accent)]' : 'border-transparent'
          } hover:bg-[color:var(--sx-surface-hover)] transition-colors`}
        >
          <span className="text-sm">{icon}</span>
        </button>
      ))}
    </div>
  );
};

export default IconPicker;
