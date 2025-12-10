import React, { useState } from 'react';
import { TabsPanel } from '@/widgets/TabsPanel/TabsPanel.js';
import { NewTabModal } from '@/widgets/NewTabModal/NewTabModal.js';
import { RightSidebar } from '@/widgets/ProfilePanel/ProfilePanel.js'; 
import { useModal } from '@/shared/hooks/useModal.js';

type Team = {
  id: string;
  name: string;
  description: string;
  emails: string[];
};

export const Dashboard: React.FC = () => {
  const { open, onOpen, onClose } = useModal(false);
  const [teams, setTeams] = useState<Team[]>([]);

  const handleTeamCreated = (team: Team) => {
    setTeams(prev => [...prev, team]);
  };

  return (
    <div className="min-h-screen bg-white transition-colors duration-300">
      <div className="grid grid-cols-[64px_1fr_320px] h-screen">
        <div className="bg-white text-black transition-colors duration-300">
          <TabsPanel
            tabs={teams.map(t => ({ id: t.id, name: t.name, emails: t.emails }))}
            onAddClick={onOpen}
          />
        </div>

        <main className="ml-[320px] mr-[80px] bg-white transition-colors duration-300">

        </main>

        <div className="bg-white text-black transition-colors duration-300">
          <RightSidebar />
        </div>
      </div>

      {open && (
        <div className="bg-white text-black transition-colors duration-300">
          <NewTabModal
            open={open}
            onClose={onClose}
            onTeamCreated={handleTeamCreated}
          />
        </div>
      )}
    </div>
  );
};
