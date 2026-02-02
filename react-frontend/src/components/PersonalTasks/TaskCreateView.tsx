import React, { useState } from 'react';
import { usePersonalTasks } from '../../contexts/PersonalTasksContext.js';

export default function TaskCreateView({ onClose, initialFolderId }: { onClose?: () => void; initialFolderId?: string | null }) {
  const { createTask } = usePersonalTasks();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState<string | null>(initialFolderId || null);

  const handleCreate = async () => {
    await createTask({ task: title, description, priority: 'medium', progress: 'not_started', folder_id: folderId });
    setTitle('');
    setDescription('');
    if (onClose) onClose();
  };

  return (
    <div className="p-4 bg-white border rounded">
      <div className="flex items-center gap-2 mb-3">
        <button className="text-sm text-gray-500">← Back</button>
        <h3 className="text-lg font-medium">New Personal Task</h3>
      </div>

      <div className="space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full p-2 border rounded" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (markdown)" className="w-full p-2 border rounded h-40" />
        <div className="flex items-center gap-2">
          <button onClick={handleCreate} className="px-3 py-1 bg-black text-white rounded">Create</button>
        </div>
      </div>
    </div>
  );
}
