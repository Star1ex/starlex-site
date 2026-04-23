import React, { useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { CreateFolderRequest } from '@/types/dto.js';
import { useAuth } from '@/contexts/AuthContext.js';

const FolderInlineCreate = React.memo(function FolderInlineCreate({
  parentId,
  onClose,
  onCreate,
  ownerId,
}: {
  parentId?: string | null;
  onClose?: () => void;
  onCreate: (data: CreateFolderRequest) => Promise<any>;
  ownerId?: string | null;
}) {
  const { userId } = useAuth();
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const hasSubmittedRef = useRef(false);

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (hasSubmittedRef.current) return;
    if (!name.trim()) {
      onClose?.();
      return;
    }
    hasSubmittedRef.current = true;
    setIsCreating(true);
    try {
      const resolvedOwnerId = ownerId ?? userId ?? '';
      await onCreate({
        name: name.trim(),
        icon: 'code',
        color: '#3B82F6',
        parent_id: parentId ?? null,
        owner_id: resolvedOwnerId,
        team_id: null,
        position: 0,
      });
      if (onClose) onClose();
    } catch (err) {
      hasSubmittedRef.current = false;
      console.error('Inline create folder failed', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleCreate} className="inline-create flex items-center gap-2 px-2 py-1">
      <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
      <div className="flex items-center gap-2 flex-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name"
          className="flex-1 text-sm bg-transparent border-0 outline-none p-0 focus:outline-none"
          autoFocus
          onBlur={() => {
            if (!name.trim()) {
              onClose?.();
              return;
            }
            handleCreate();
          }}
        />
        <button
          type="button"
          onClick={() => { if (onClose) onClose(); }}
          className="text-xs text-gray-400 hover:text-gray-600"
          aria-label="Cancel"
        >
          ✕
        </button>
      </div>
    </form>
  );
});

FolderInlineCreate.displayName = 'FolderInlineCreate';
export default FolderInlineCreate;
