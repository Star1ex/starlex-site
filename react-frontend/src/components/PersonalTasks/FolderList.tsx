import React, { useMemo } from 'react';
import type { FolderDTO } from '@/types/dto.js';
import VirtualList from '@/components/Virtualized/VirtualList.js';

function FolderListComponent({ folders }: { folders: FolderDTO[] }) {
  if (!folders || folders.length === 0) {
    return <div className="text-sm text-gray-500">No folders yet</div>;
  }

  const renderItem = useMemo(
    () => (f: FolderDTO) => (
      <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
        <img src={f.icon ? `/assets/${f.icon}.svg` : '/assets/code.svg'} alt="icon" className="w-5 h-5" />
        <span className="truncate">{f.name}</span>
      </div>
    ),
    []
  );

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Folders</div>
      <VirtualList items={folders} renderItem={renderItem} threshold={80} estimatedItemHeight={44} className="space-y-1" />
    </div>
  );
}

const FolderList = React.memo(FolderListComponent);
FolderList.displayName = 'FolderList';
export default FolderList;
