import React from 'react';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isResizing: boolean;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({ onMouseDown, isResizing }) => {
  return (
    <div
      className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors ${
        isResizing ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-500/70'
      }`}
      onMouseDown={onMouseDown}
      aria-hidden
    >
      <div className="absolute right-0 top-0 bottom-0 w-4 -mr-2" />
    </div>
  );
};

export default ResizeHandle;
