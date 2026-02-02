import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { folderService } from '@/services/api/index.js';
import type { FolderDTO } from '@/types/dto.js';
import ContextMenu from '@/components/Dropdown/ContextMenu.js';
import MenuItem from '@/components/Dropdown/MenuItem.js';
import FolderInlineCreate from './FolderInlineCreate.js';

interface FolderItemProps {
  folder: FolderDTO;
  level: number;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}

export const FolderItem: React.FC<FolderItemProps> = React.memo(({ folder, level, isExpanded, hasChildren, onToggle, onNavigate }) => {
  const navigate = useNavigate();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [showActions, setShowActions] = useState(false);
  const [showInlineSubfolder, setShowInlineSubfolder] = useState(false);
  const itemRef = useRef<HTMLDivElement | null>(null);

  const handleContextMenu = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, []);

  const handleCreateTask = React.useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setShowContextMenu(false);
    // Navigate to new task with folder prefilled
    navigate('/task/new', { state: { folder_id: folder.id } });
    // Also trigger modal creation hooks
    window.dispatchEvent(new CustomEvent('openPersonalTaskCreate', { detail: { folder_id: folder.id } }));
  }, [navigate, folder.id]);
  
  const handleCreateSubfolder = React.useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setShowContextMenu(false);
    // Toggle inline subfolder creation under this folder
    setShowInlineSubfolder(true);
  }, []);

  const handleRename = React.useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setShowContextMenu(false);
    const newName = prompt('New folder name:', folder.name);
    if (newName && newName.trim()) {
      try {
        await folderService.updateFolder(folder.id, { name: newName.trim() });
        window.dispatchEvent(new CustomEvent('personalFolderCreated'));
      } catch (err) {
        console.error('Failed to rename folder:', err);
        alert('Failed to rename folder');
      }
    }
  }, [folder.id, folder.name]);

  const handleDelete = React.useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setShowContextMenu(false);
    if (!confirm(`Delete folder "${folder.name}" and all its contents?`)) return;
    try {
      await folderService.deleteFolder(folder.id);
      window.dispatchEvent(new CustomEvent('personalFolderCreated'));
    } catch (err) {
      console.error('Failed to delete folder:', err);
      alert('Failed to delete folder');
    }
  }, [folder.id, folder.name]);

  const paddingLeft = 12 + level * 16;

  return (
    <>
      <div
        ref={itemRef}
        className="folder-item group relative"
        style={{ paddingLeft: `${paddingLeft}px` }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onContextMenu={handleContextMenu}
      >
        <div className="flex items-center gap-4 px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors cursor-pointer" style={{ minHeight: '36px' }}>
          {/* Chevron */}
          {hasChildren ? (
            <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              <svg className={`w-3 h-3 text-gray-500 dark:text-dark-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Folder icon */}
          <div className="flex-shrink-0 text-gray-600 dark:text-dark-text-muted" onClick={onNavigate}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>

          {/* Name */}
          <span className="flex-1 text-sm text-gray-700 dark:text-dark-text truncate" onClick={onNavigate}>{folder.name}</span>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={(e) => { e.stopPropagation(); const rect = itemRef.current?.getBoundingClientRect(); if (rect) { setContextMenuPos({ x: rect.right, y: rect.top }); setShowContextMenu(true); } }} className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-dark-border transition-colors">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
              </button>

              <button onClick={(e) => { e.stopPropagation(); handleCreateTask(e); }} className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-dark-border transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {showContextMenu && (
        <ContextMenu x={contextMenuPos.x} y={contextMenuPos.y} onClose={() => setShowContextMenu(false)}>
          <MenuItem label="New Task" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>} onClick={handleCreateTask} />
          <MenuItem label="New Subfolder" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>} onClick={handleCreateSubfolder} />
          <div className="border-t border-gray-100 dark:border-dark-border my-1" />
          <MenuItem label="Rename" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>} onClick={handleRename} />
          <MenuItem label="Delete" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>} onClick={handleDelete} danger />
        </ContextMenu>
      )}

      {/* Inline subfolder create form, shown under this folder when requested */}
      {showInlineSubfolder && (
        <div style={{ marginLeft: `${paddingLeft + 12}px` }} className="mt-1">
          <FolderInlineCreate parentId={folder.id} onClose={() => setShowInlineSubfolder(false)} />
        </div>
      )}
    </>
  );
});

export default FolderItem;
