import React, { useEffect, useRef, useState } from 'react';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  onChange?: (value: string) => void;
  className?: string;
}

export const InlineEdit: React.FC<InlineEditProps> = ({ value, onSave, onCancel, onChange, className }) => {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (draft.trim()) onSave(draft.trim());
      else onCancel();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => {
        const next = e.target.value;
        setDraft(next);
        onChange?.(next);
      }}
      onBlur={() => (draft.trim() ? onSave(draft.trim()) : onCancel())}
      onKeyDown={handleKeyDown}
      className={className || 'w-full text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'}
    />
  );
};

export default InlineEdit;
