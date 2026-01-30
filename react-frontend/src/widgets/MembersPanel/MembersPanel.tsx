import React from 'react';
import UserSidebar from '@/widgets/UserSideBar/UserSideBar.js';
import type { User } from '@/entities/types.js';

interface MembersPanelProps {
  isOpen: boolean;
  users: User[];
  onClose: () => void;
  teamId: string;
  onUserRemoved?: (userId: string) => void;
  onViewProfile?: (userId: string, userData?: User) => void;
}

const MembersPanel: React.FC<MembersPanelProps> = ({ isOpen, users, onClose, teamId, onUserRemoved, onViewProfile }) => {
  const getWidthClass = () => {
    // Mobile uses full width for better usability; larger screens use compact widths depending on member count
    if (users.length <= 1) return 'w-full sm:w-56 md:w-64';
    if (users.length <= 3) return 'w-full sm:w-64 md:w-72';
    if (users.length <= 6) return 'w-full sm:w-80 md:w-96';
    return 'w-full sm:w-96 md:w-[28rem]';
  };

  const widthClass = getWidthClass();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!isOpen}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      </div>

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full z-50 bg-white dark:bg-dark-surface shadow-xl transform transition-all duration-300 ease-out ${isOpen ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'} ${widthClass}`}
        role="dialog"
        aria-modal="true"
      >
        <UserSidebar
          users={users}
          teamId={teamId}
          onClose={onClose}
          onUserRemoved={onUserRemoved}
          onViewProfile={onViewProfile}
          className="h-full"
        />
      </div>
    </>
  );
};

export default MembersPanel;
