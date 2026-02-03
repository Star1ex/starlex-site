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
            value === icon ? 'border-blue-500' : 'border-transparent'
          } hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
        >
          <span className="text-sm">{icon}</span>
        </button>
      ))}
    </div>
  );
};

export default IconPicker;
