import React, { useState } from 'react';
import type { FolderDTO } from '@/types/dto.js';

interface FolderTreeProps {
  folders: FolderDTO[];
  level?: number;
  onFolderClick: (folderId: string) => void;
  onFolderRightClick: (folderId: string, event: React.MouseEvent) => void;
}

export const FolderTree: React.FC<FolderTreeProps> = ({ folders, level = 0, onFolderClick, onFolderRightClick }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId); else next.add(folderId);
      return next;
    });
  };

  const rootFolders = folders.filter(f => f.parent_id == null);
  const getSubfolders = (parentId: string) => folders.filter(f => f.parent_id === parentId);

  const renderFolder = (folder: FolderDTO, currentLevel: number) => {
    const subfolders = getSubfolders(folder.id);
    const hasChildren = subfolders.length > 0;
    const isExpanded = expandedFolders.has(folder.id);

    return (
      <div key={folder.id}>
        <button
          className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-all text-left group ${
            isExpanded ? 'bg-gray-50 dark:bg-dark-border/30' : 'hover:bg-gray-50 dark:hover:bg-dark-border/50'
          }`}
          style={{ paddingLeft: `${12 + currentLevel * 12}px` }}
          onClick={() => onFolderClick(folder.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFolderRightClick(folder.id, e);
          }}
        >
          <span className="flex-1 truncate text-gray-700 dark:text-dark-text">{folder.name}</span>
          {hasChildren ? (
            <svg
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className={`w-3 h-3 text-gray-500 dark:text-dark-text-muted transition-all duration-200 ease-in-out opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <div className="w-3 h-3 flex-shrink-0 opacity-0" />
          )}
        </button>

        {hasChildren && isExpanded && (
          <div className="ml-3">
            {subfolders.map(sf => renderFolder(sf, currentLevel + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="folder-tree">
      {rootFolders.map(f => renderFolder(f, level))}
    </div>
  );
};

export default FolderTree;
