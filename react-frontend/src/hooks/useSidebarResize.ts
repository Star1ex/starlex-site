import { useCallback, useEffect, useState } from 'react';

const SIDEBAR_WIDTH_KEY = 'sidebar-width';
const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

export const useSidebarResize = (minWidth = 200, maxWidth = 600, defaultWidth = 280) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const savedWidth = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    const savedCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (savedWidth) setWidth(Number(savedWidth));
    if (savedCollapsed) setIsCollapsed(savedCollapsed === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
  }, [width]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
      if (newWidth < minWidth - 50) setIsCollapsed(true);
      if (isCollapsed && newWidth >= minWidth) setIsCollapsed(false);
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isCollapsed, minWidth, maxWidth]);

  const collapse = useCallback(() => setIsCollapsed(true), []);
  const expand = useCallback(() => setIsCollapsed(false), []);

  return { width, isCollapsed, isResizing, handleMouseDown, collapse, expand, setWidth } as const;
};
