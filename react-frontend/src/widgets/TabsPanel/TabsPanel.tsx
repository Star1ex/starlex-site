import React from 'react';

type Tab = { id: string; name: string; emails: string[] };

type Props = {
  tabs: Tab[];
  onAddClick: () => void;
};

export const TabsPanel = ({ tabs, onAddClick }: Props) => {
  return (
    <aside className="w-[320px] border-l border-[#e7d3c8] bg-[#F3E6DE] p-4 flex flex-col">
      <div className="flex items-center justify-between px-2 py-2">
        <h3 className="tracking-widest text-xs text-[#9b7a6f] uppercase">TABS</h3>
        <button
          onClick={onAddClick}
          className="w-7 h-7 flex items-center justify-center rounded bg-transparent border border-[#d4a89a] text-[#7b5a4f] hover:bg-[#ead4ca]"
          title="New Tab"
        >
          +
        </button>
      </div>

      {tabs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-[#9b7a6f]">
          <p className="mb-1">No tabs yet</p>
          <button
            onClick={onAddClick}
            className="text-[#b68f84] hover:text-[#a57f74] underline"
          >
            Create your first tab
          </button>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {tabs.map(tab => (
            <li key={tab.id} className="px-3 py-2 rounded hover:bg-[#ead4ca] text-[#60392f]">
              {tab.name}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};
