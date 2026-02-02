import React, { useState } from 'react';
import { folderService } from '@/services/api/index.js';
import { usePersonalTasksState } from '@/contexts/PersonalTasksContext.js';

import { useAuth } from '@/contexts/AuthContext.js';

export default function FolderCreateModal({ onClose, parentId }: { onClose?: () => void; parentId?: string | null }) {
  const { refreshFolders } = usePersonalTasksState();
  const { userId } = useAuth();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('code');
  const [color, setColor] = useState('#3B82F6');
  const [isCreating, setIsCreating] = useState(false);
  const parent_id = parentId ?? null;

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await folderService.createFolder({ name, icon, color, parent_id, team_id: null, owner_id: userId || '' });
      await refreshFolders();
      if (onClose) onClose();
    } catch (err) {
      console.error('Create folder failed', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4 bg-white border rounded max-w-sm">
      <h3 className="font-medium mb-2">Create New Folder</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Folder name" className="w-full p-2 border rounded mb-2" />
      <div className="mb-2">
        <div className="text-xs text-gray-500 mb-1">Icon</div>
        <div className="flex gap-2">
          {['code', 'health', 'finance', 'study'].map((i) => (
            <button key={i} onClick={() => setIcon(i)} className={`p-2 border rounded ${icon === i ? 'ring-2 ring-blue-400' : ''}`}>{i}</button>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">Color</div>
        <input value={color} onChange={(e) => setColor(e.target.value)} type="color" />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
        <button onClick={handleCreate} disabled={isCreating || !name.trim()} className="px-3 py-1 bg-black text-white rounded">{isCreating ? 'Creating...' : 'Create Folder'}</button>
      </div>
    </div>
  );
}
