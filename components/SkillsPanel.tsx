
import React from 'react';
import { Skill, PsionicStatus } from '../types';

interface SkillsPanelProps {
  skills: Skill[];
  psionics?: PsionicStatus;
  experience: number;
  freeSkillPoints: number;
  onUpgradeSkill: (skillName: string) => void;
}

export const SkillsPanel: React.FC<SkillsPanelProps> = ({ skills = [], psionics, experience, freeSkillPoints, onUpgradeSkill }) => {
  const getSkillColor = (type: string) => {
    const safeType = String(type || "INNATE").toUpperCase();
    switch (safeType) {
      case 'PSIONIC': return 'text-purple-400 border-purple-500/30 bg-purple-900/10';
      case 'TECH': return 'text-orange-400 border-orange-500/30 bg-orange-900/10';
      case 'LEADERSHIP': return 'text-yellow-400 border-yellow-500/30 bg-yellow-900/10';
      default: return 'text-neon-green border-neon-green/30 bg-neon-green/10';
    }
  };

  const safeSkills = Array.isArray(skills) ? skills : [];
  const safeExp = Number(experience || 0);
  const safePoints = Number(freeSkillPoints || 0);

  return (
    <div className="flex-1 flex flex-col bg-black/80 font-mono overflow-y-auto custom-scrollbar border-l border-neon-blue/10 p-4">
      
      <div className="mb-6 border border-neon-blue/20 bg-neon-blue/5 p-3 rounded">
        <div className="flex justify-between items-end mb-1">
            <span className="text-xs text-neon-blue tracking-widest font-bold">EXPERIENCE</span>
            <span className="text-xl text-white font-bold">{safeExp} <span className="text-xs text-gray-500">/ 100 XP</span></span>
        </div>
        <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-gradient-to-r from-neon-blue to-white transition-all duration-500" style={{ width: `${Math.min(100, safeExp)}%` }}></div>
        </div>
        
        <div className="flex justify-between items-center mt-3 bg-black/40 p-2 rounded border border-neon-blue/30">
            <span className="text-[10px] text-gray-400 uppercase">Neural Credits</span>
            <span className={`font-bold ${safePoints > 0 ? 'text-neon-green animate-pulse' : 'text-gray-600'}`}>
                {safePoints} PTS
            </span>
        </div>
      </div>

      <div className="space-y-4">
         <h3 className="text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">Active Neural Links</h3>
         
         {safeSkills.length === 0 ? (
             <div className="text-center py-8 text-gray-600 text-xs italic">SCANNING FOR SIGNATURES...</div>
         ) : (
             safeSkills.map((skill, idx) => {
                 if (!skill) return null;
                 
                 const level = Number(skill.level || 0);
                 const maxLevel = Number(skill.maxLevel || 5);
                 const progress = Number(skill.progress || 0);
                 const canUpgrade = safePoints > 0 && level > 0 && level < maxLevel;

                 return (
                    <div key={skill.id || idx} className={`p-3 border rounded relative overflow-hidden group animate-fade-in ${getSkillColor(skill.type)}`}>
                        <div className="flex justify-between items-start mb-1 relative z-10">
                            <div className="flex items-center gap-2">
                               <span className="font-bold text-sm tracking-wide">{String(skill.name || "Unknown") }</span>
                               <button 
                                   onClick={() => canUpgrade && onUpgradeSkill(skill.name)}
                                   disabled={!canUpgrade}
                                   className={`ml-2 w-5 h-5 flex items-center justify-center border rounded transition-colors text-xs ${
                                       canUpgrade 
                                       ? 'bg-neon-green/20 border-neon-green text-neon-green hover:bg-neon-green hover:text-black' 
                                       : 'bg-transparent border-gray-700 text-gray-700 opacity-30 cursor-not-allowed'
                                   }`}
                               >
                                   +
                               </button>
                            </div>
                            <span className="text-[10px] border border-current px-1 rounded">LV.{level}</span>
                        </div>
                        <div className="text-[10px] opacity-80 mb-2 relative z-10">{String(skill.description || "No link data available.")}</div>
                        <div className="w-full bg-black/40 h-1 rounded-full overflow-hidden relative z-10">
                            <div className="h-full bg-current opacity-70" style={{ width: `${Math.min(100, progress)}%` }}></div>
                        </div>
                    </div>
                 );
             })
         )}
      </div>

      {psionics && (Number(psionics.level || 0) > 0) && (
          <div className="mt-6 pt-4 border-t border-purple-900/30">
              <h3 className="text-xs text-purple-500 uppercase tracking-widest mb-3">Void Resonance</h3>
              <div className="p-3 bg-purple-900/10 border border-purple-500/30 rounded text-center">
                  <div className="text-2xl text-white font-bold mb-1">
                    {Number(psionics.energy || 0)} 
                    <span className="text-xs text-gray-400"> / {Number(psionics.max_energy || 1)}</span>
                  </div>
                  <div className="text-[10px] text-purple-400 uppercase">Psionic Saturation</div>
              </div>
          </div>
      )}
    </div>
  );
};
