import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ContextMenuState = {
  show: boolean;
  x: number;
  y: number;
  type: 'root' | 'folder' | 'task';
  folderId?: string | null;
  taskId?: string | null;
};

type ContextMenuContextValue = {
  contextMenu: ContextMenuState;
  openContextMenu: (e: React.MouseEvent, data: Omit<ContextMenuState, 'show' | 'x' | 'y'>) => void;
  closeContextMenu: () => void;
};

const ContextMenuContext = createContext<ContextMenuContextValue | undefined>(undefined);

const initialState: ContextMenuState = { show: false, x: 0, y: 0, type: 'root', folderId: null, taskId: null };

export const ContextMenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(initialState);

  const openContextMenu = useCallback((e: React.MouseEvent, data: Omit<ContextMenuState, 'show' | 'x' | 'y'>) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      ...data,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(initialState);
  }, []);

  const value = useMemo(() => ({ contextMenu, openContextMenu, closeContextMenu }), [contextMenu, openContextMenu, closeContextMenu]);

  return <ContextMenuContext.Provider value={value}>{children}</ContextMenuContext.Provider>;
};

export const useContextMenu = () => {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) throw new Error('useContextMenu must be used within ContextMenuProvider');
  return ctx;
};
