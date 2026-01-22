
import React from 'react';
import { GameState, FACTIONS } from '../types';

interface HUDProps {
  state: GameState;
}

export const HUD: React.FC<HUDProps> = ({ state }) => {
  const psionics = state?.psionics;
  const isAwakened = (psionics?.level || 0) > 0;
  const psiEnergy = Number(psionics?.energy || 0);
  const psiMax = Number(psionics?.max_energy || 1);
  const psiPercent = isAwakened ? (psiEnergy / psiMax) * 100 : 0;

  const safeLocation = String(state?.location || "未知區域");
  const displayLocation = safeLocation.includes('-') 
    ? safeLocation.split('-')[0].trim() 
    : safeLocation;
  
  const maxAP = 5;
  const currentAP = Math.min(maxAP, Math.max(0, Number(state?.actionPoints ?? 5)));
  const health = Number(state?.health ?? 100);
  const experience = Number(state?.experience ?? 0);
  const credits = Number(state?.credits ?? 0);
  const level = Number(state?.level ?? 1);

  const currentFaction = FACTIONS.find(f => f.id === state.factionId);
  const factionName = currentFaction ? currentFaction.name : (state.factionId || "自由傭兵");

  return (
    <div className="w-full bg-void-black border-b border-neon-blue/30 p-2 md:p-3 shadow-[0_0_20px_rgba(0,243,255,0.1)] z-20 sticky top-0">
      <div className="max-w-7xl mx-auto flex gap-4 items-center">
        
        {/* Avatar Display */}
        <div className="relative w-12 h-12 md:w-16 md:h-16 flex-shrink-0 border border-neon-blue/50 rounded-lg overflow-hidden bg-black group shadow-[0_0_10px_rgba(0,243,255,0.2)]">
             {state?.avatarUrl ? (
                 <img src={state.avatarUrl} alt="Player" className="w-full h-full object-cover" />
             ) : (
                 <div className="w-full h-full bg-gray-900 flex items-center justify-center text-xs text-gray-600">無 ID</div>
             )}
             <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
             
             {isAwakened && (
                <div className="absolute top-0 right-0 w-3 h-3 bg-purple-500 rounded-bl shadow-[0_0_10px_#d8b4fe] animate-pulse"></div>
             )}
             
             <div className="absolute bottom-0 right-0 bg-neon-blue text-black text-[10px] font-bold px-1.5 rounded-tl">
                等級 {level}
             </div>
        </div>

        {/* Info Blocks */}
        <div className="flex-1 flex flex-col justify-center gap-1">
            
            {/* Top Row: Identity Info */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-1">
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                        <span className="text-white font-bold text-lg leading-none tracking-wide">
                            {state.playerName || "未知特工"}
                        </span>
                        <span className="text-[10px] text-neon-blue bg-neon-blue/10 px-1 rounded uppercase font-bold tracking-wider">
                            {state.identity || "操作員"}
                        </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                         隸屬勢力: <span className={currentFaction?.colorTheme.split(' ')[2] || 'text-gray-300'}>{factionName}</span>
                    </span>
                </div>

                <div className="flex items-center gap-4 mt-1 md:mt-0 font-mono text-xs">
                     <span className="text-neon-blue font-bold">
                        座標: {(displayLocation || "深空區域").toUpperCase()}
                     </span>
                     <span className="text-gray-400 hidden md:inline">|</span>
                     <span className="text-gray-300">
                        日期: {String(state?.date || "3150-01-01")}
                     </span>
                </div>
            </div>

            {/* Middle Row: Stats Bars */}
            <div className="flex gap-3 items-center w-full mt-0.5">
                {/* Health */}
                <div className="flex-1 max-w-[140px] relative h-2.5 bg-gray-800 rounded-sm overflow-hidden group border border-gray-700">
                    <div className={`h-full transition-all duration-500 ${health > 50 ? 'bg-neon-green' : 'bg-neon-red'}`} style={{ width: `${Math.min(100, health)}%` }}></div>
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white mix-blend-difference font-bold opacity-80">生命值 {health}%</span>
                </div>

                {/* AP */}
                <div className="hidden md:flex gap-0.5 items-center px-2 border-l border-r border-gray-700">
                    <span className="text-[8px] text-gray-500 mr-1 font-bold">AP</span>
                    {[...Array(maxAP)].map((_, i) => (
                        <div key={i} className={`w-1.5 h-3 rounded-sm transition-all ${i < currentAP ? 'bg-yellow-400 shadow-[0_0_5px_yellow]' : 'bg-gray-800 border border-gray-700'}`}></div>
                    ))}
                </div>

                {/* XP */}
                <div className="flex-1 max-w-[140px] relative h-2.5 bg-gray-800 rounded-sm overflow-hidden group border border-gray-700">
                    <div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${Math.min(100, experience)}%` }}></div>
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] text-black font-bold opacity-60">經驗值 {experience}/100</span>
                </div>

                {isAwakened && (
                    <div className="flex-1 max-w-[100px] relative h-2.5 bg-gray-800 rounded-sm overflow-hidden group border border-purple-500/50">
                        <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${Math.min(100, psiPercent)}%` }}></div>
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold opacity-80">靈能</span>
                    </div>
                )}

                <div className="ml-auto flex items-baseline gap-1">
                    <span className="text-shadow-glow text-sm font-bold font-mono text-yellow-400">
                        {credits.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-bold text-yellow-600">CR</span>
                </div>
            </div>

            {/* Bottom Row: Inventory / Backpack Slots */}
            <div className="flex gap-1 mt-2 overflow-x-auto pb-1 items-center custom-scrollbar no-scrollbar">
                <span className="text-[9px] text-gray-500 font-mono uppercase mr-1 tracking-widest shrink-0 border-r border-gray-800 pr-2">INV_MODULE</span>
                
                {(!state.inventory || state.inventory.length === 0) ? (
                    <div className="text-[9px] text-gray-700 italic font-mono px-2">EMPTY</div>
                ) : (
                    state.inventory.map((item, i) => (
                        <div key={i} className="group relative shrink-0">
                            <div className="px-2 py-1 bg-black/40 border border-gray-700 text-[9px] text-gray-300 font-mono hover:border-neon-blue hover:text-neon-blue hover:bg-neon-blue/10 transition-all cursor-help rounded-sm">
                                {item}
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black border border-gray-600 text-[8px] text-white px-2 py-1 whitespace-nowrap z-50 rounded shadow-xl">
                                ITEM_ID: {i}
                            </div>
                        </div>
                    ))
                )}
                
                {/* Empty slot placeholders */}
                {[...Array(Math.max(0, 5 - (state.inventory?.length || 0)))].map((_, i) => (
                    <div key={`empty-${i}`} className="w-8 h-5 border border-gray-800/50 bg-black/20 rounded-sm shrink-0 border-dashed"></div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
