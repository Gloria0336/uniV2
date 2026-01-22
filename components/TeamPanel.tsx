
import React from 'react';
import { MyFaction, Follower } from '../types';

interface TeamPanelProps {
  faction?: MyFaction;
}

export const TeamPanel: React.FC<TeamPanelProps> = ({ faction }) => {
  if (!faction) {
    return (
      <div className="flex-1 flex flex-col bg-black/80 font-mono border-l border-neon-blue/10 p-8 items-center justify-center text-center">
        <div className="text-4xl mb-4 opacity-20 text-neon-blue">∅</div>
        <h2 className="text-neon-blue font-bold mb-2">NO FACTION ESTABLISHED</h2>
        <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
          You are currently operating as a solo agent. 
          <br/><br/>
          Seek opportunities to [RECRUIT] followers or [ESTABLISH] your own organization.
        </p>
      </div>
    );
  }

  const safePerks = Array.isArray(faction.perks) ? faction.perks : [];
  const safeFollowers = Array.isArray(faction.followers) ? faction.followers : [];

  return (
    <div className="flex-1 flex flex-col bg-black/80 font-mono overflow-y-auto custom-scrollbar border-l border-neon-blue/10 p-4">
      {/* 組織概況 */}
      <div className="mb-6 border border-white/20 bg-white/5 p-4 rounded relative overflow-hidden">
         <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl font-bold">HQ</div>
         <h2 className="text-xl text-white font-bold tracking-wider mb-1">{faction.name}</h2>
         <div className="text-[10px] text-neon-blue uppercase border border-neon-blue/30 inline-block px-2 py-0.5 rounded mb-4">
             Level {faction.level} Organization
         </div>
         <p className="text-xs text-gray-400 italic leading-relaxed border-l-2 border-gray-600 pl-3">
             "{faction.description}"
         </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-black/50 border border-gray-800 p-3 rounded text-center">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest">Members</div>
              <div className="text-xl text-white font-bold">{faction.members}</div>
          </div>
          <div className="bg-black/50 border border-gray-800 p-3 rounded text-center">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest">Influence</div>
              <div className="text-xl text-neon-blue font-bold">{faction.influence}%</div>
          </div>
      </div>

      {/* 追隨者名錄 - 重點更新區 */}
      <div className="space-y-4 mb-6">
          <h3 className="text-xs text-neon-blue uppercase tracking-widest border-b border-neon-blue/20 pb-2">Follower Roster / 追隨者名錄</h3>
          {safeFollowers.length === 0 ? (
              <div className="text-[10px] text-gray-600 italic py-4 text-center">目前尚無具名追隨者。</div>
          ) : (
              <div className="space-y-3">
                  {safeFollowers.map((f, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 p-3 rounded group hover:border-neon-blue/40 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-bold text-white group-hover:text-neon-blue">{f.name}</span>
                              <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded">LV.{f.level}</span>
                          </div>
                          <div className="text-[10px] text-neon-green font-bold mb-1 uppercase tracking-tighter">{f.role}</div>
                          <p className="text-[10px] text-gray-400 leading-relaxed mb-2">{f.description}</p>
                          <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse"></span>
                              <span className="text-[8px] text-gray-500 uppercase">Status: {f.status}</span>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* 組織特權 */}
      <div className="space-y-3">
          <h3 className="text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">Active Perks</h3>
          {safePerks.length === 0 ? (
              <div className="text-xs text-gray-700 italic">No perks developed.</div>
          ) : (
              safePerks.map((perk, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                      <span className="text-neon-green">✔</span>
                      {perk}
                  </div>
              ))
          )}
      </div>
      
      <div className="mt-auto pt-8">
          <div className="text-[9px] text-gray-600 text-center uppercase tracking-widest">
              Neural Network Synchronization: 100%
          </div>
      </div>
    </div>
  );
};
