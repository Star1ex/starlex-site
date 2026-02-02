import React, { useState } from 'react';
import { usePersonalTasksActions } from '@/contexts/PersonalTasksContext.js';

const FolderInlineCreate = React.memo(function FolderInlineCreate({ parentId, onClose }: { parentId?: string | null; onClose?: () => void }) {
  const { createFolder } = usePersonalTasksActions();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('code');
  const [color, setColor] = useState('#3B82F6');
  const [isCreating, setIsCreating] = useState(false);

  const iconOptions = ['code', 'health', 'finance', 'study'];

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsCreating(true);
    try {
      await createFolder({ name: name || 'New Folder', icon, color, parent_id: parentId ?? null });
      if (onClose) onClose();
    } catch (err) {
      console.error('Inline create folder failed', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleCreate} className="inline-create p-2 bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-md shadow-sm max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name"
          className="flex-1 p-2 border rounded text-sm"
          autoFocus
        />
        <button type="button" onClick={() => { if (onClose) onClose(); }} className="text-sm px-2 py-1">✕</button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        {iconOptions.map(i => (
          <button key={i} type="button" onClick={() => setIcon(i)} className={`p-1 rounded ${icon === i ? 'ring-2 ring-blue-400' : ''}`}>
            <img src={`/assets/${i}.svg`} alt={i} className="w-5 h-5" />
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-8 p-0 border-0" />
        <div className="flex gap-2">
          <button type="button" onClick={() => { if (onClose) onClose(); }} className="px-3 py-1 border rounded text-sm">Cancel</button>
          <button type="submit" disabled={isCreating || !name.trim()} className="px-3 py-1 bg-black text-white rounded text-sm">{isCreating ? 'Creating...' : 'Create'}</button>
        </div>
      </div>
    </form>
  );
});

FolderInlineCreate.displayName = 'FolderInlineCreate';
export default FolderInlineCreate;
