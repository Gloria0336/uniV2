import React, { useMemo, useState, useEffect } from 'react';

interface StarMapProps {
  location: string;
  className?: string;
}

type BodyType = 'sun' | 'venus' | 'earth' | 'mars' | 'belt' | 'jupiter' | 'saturn' | 'unknown';
type MoonType = 'none' | 'luna' | 'phobos' | 'europa' | 'titan' | 'callisto';
type ViewMode = 'SYSTEM' | 'TRAVEL' | 'ORBIT';

export const StarMap: React.FC<StarMapProps> = ({ location, className }) => {
  const [activeBody, setActiveBody] = useState<BodyType>('earth');
  const [activeMoon, setActiveMoon] = useState<MoonType>('none');
  const [prevBody, setPrevBody] = useState<BodyType>('earth');
  const [viewMode, setViewMode] = useState<ViewMode>('ORBIT');
  const [travelProgress, setTravelProgress] = useState(0);

  // Safe parsing for location string to prevent crash
  const safeLocation = String(location || "");
  const parts = safeLocation.split('-');
  const regionName = parts.length > 1 ? parts[1].trim() : "深空 (DEEP SPACE)";

  const targetLocation = useMemo(() => {
    let body: BodyType = 'unknown';
    let moon: MoonType = 'none';
    const loc = safeLocation.toLowerCase();

    // Enhanced Matching Logic
    if (loc.includes('月球') || loc.includes('luna')) { body = 'earth'; moon = 'luna'; }
    else if (loc.includes('火衛') || loc.includes('phobos')) { body = 'mars'; moon = 'phobos'; }
    else if (loc.includes('木衛二') || loc.includes('europa') || loc.includes('ganymede') || loc.includes('callisto')) { body = 'jupiter'; moon = 'europa'; }
    else if (loc.includes('泰坦') || loc.includes('titan') || loc.includes('土衛六') || loc.includes('enceladus')) { body = 'saturn'; moon = 'titan'; }
    else if (loc.includes('金星') || loc.includes('venus')) { body = 'venus'; }
    else if (loc.includes('地球') || loc.includes('earth') || loc.includes('東京')) { body = 'earth'; }
    else if (loc.includes('火星') || loc.includes('mars') || loc.includes('賽東尼亞')) { body = 'mars'; }
    else if (loc.includes('小行星') || loc.includes('belt') || loc.includes('穀神星') || loc.includes('ceres') || loc.includes('vesta')) { body = 'belt'; }
    else if (loc.includes('木星') || loc.includes('jupiter')) { body = 'jupiter'; }
    else if (loc.includes('土星') || loc.includes('saturn')) { body = 'saturn'; }

    return { body, moon };
  }, [safeLocation]);

  useEffect(() => {
    if (targetLocation.body !== activeBody && targetLocation.body !== 'unknown') {
      setPrevBody(activeBody);
      setActiveBody(targetLocation.body);
      setActiveMoon(targetLocation.moon);
      setViewMode('SYSTEM');
      
      setTimeout(() => {
        setViewMode('TRAVEL');
        setTravelProgress(0);
        const duration = 2000;
        const start = Date.now();
        const timer = setInterval(() => {
          const p = Math.min(1, (Date.now() - start) / duration);
          setTravelProgress(p);
          if (p >= 1) {
            clearInterval(timer);
            setTimeout(() => setViewMode('ORBIT'), 500);
          }
        }, 16);
      }, 800);
    } else if (targetLocation.moon !== activeMoon) {
        setActiveMoon(targetLocation.moon);
    }
  }, [targetLocation, activeBody, activeMoon]);

  // Faction Colors:
  // EUG (Earth, Jupiter): Blue/White/Clean
  // Red Cult (Saturn): Red/Gold
  // Free People (Mars, Belt, Venus): Green/Rust/Neon
  const getSystemConfig = (body: BodyType) => {
    switch(body) {
        case 'venus': return { r: 40, angle: 220, color: 'bg-green-400 shadow-[0_0_10px_#4ade80]', faction: 'FREE PEOPLE' };
        case 'earth': return { r: 70, angle: 0, color: 'bg-cyan-200 shadow-[0_0_15px_white]', faction: 'EUG' };
        case 'mars': return { r: 100, angle: 120, color: 'bg-orange-600 shadow-[0_0_10px_#ea580c]', faction: 'FREE PEOPLE' };
        case 'belt': return { r: 130, angle: 240, color: 'bg-gray-500 shadow-[0_0_5px_gray]', faction: 'FREE PEOPLE' };
        case 'jupiter': return { r: 170, angle: 60, color: 'bg-orange-100 shadow-[0_0_20px_white]', faction: 'EUG' };
        case 'saturn': return { r: 210, angle: 160, color: 'bg-red-600 shadow-[0_0_15px_#dc2626]', faction: 'RED CULT' };
        default: return { r: 0, angle: 0, color: 'bg-gray-500', faction: 'UNKNOWN' };
    }
  };

  const getPos = (body: BodyType) => {
      const cfg = getSystemConfig(body);
      const rad = cfg.angle * (Math.PI / 180);
      return { x: cfg.r * Math.cos(rad), y: cfg.r * Math.sin(rad) };
  };

  const shipPos = useMemo(() => {
      if (viewMode !== 'TRAVEL') return getPos(activeBody);
      const p1 = getPos(prevBody);
      const p2 = getPos(activeBody);
      return { x: p1.x + (p2.x - p1.x) * travelProgress, y: p1.y + (p2.y - p1.y) * travelProgress };
  }, [viewMode, activeBody, prevBody, travelProgress]);

  const currentFaction = getSystemConfig(activeBody).faction;
  const factionColor = currentFaction === 'EUG' ? 'text-cyan-200' : currentFaction === 'RED CULT' ? 'text-red-500' : 'text-green-400';

  return (
    <div className={`flex flex-col h-full bg-black/90 border-l border-neon-blue/20 ${className} font-mono`}>
      <div className="p-3 border-b border-neon-blue/20 bg-neon-blue/5 flex justify-between items-center text-[10px]">
        <span className="text-neon-blue font-bold tracking-[0.2em]">{viewMode === 'TRAVEL' ? '>> WARP DRIVE' : '>> ORBITAL FEED'}</span>
        <span className={`uppercase font-bold ${factionColor}`}>{currentFaction} SPACE</span>
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,20,30,1)_0%,black_100%)]"></div>
         
         {/* SYSTEM VIEW */}
         <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${viewMode === 'ORBIT' ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`}>
            <div className="absolute w-10 h-10 bg-yellow-400 rounded-full shadow-[0_0_40px_rgba(255,200,0,0.5)]"></div>
            {['venus', 'earth', 'mars', 'belt', 'jupiter', 'saturn'].map(b => {
                const pos = getPos(b as BodyType);
                const cfg = getSystemConfig(b as BodyType);
                return <div key={b} className={`absolute w-3 h-3 rounded-full ${cfg.color}`} style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}></div>
            })}
            {(viewMode === 'TRAVEL' || viewMode === 'SYSTEM') && (
                <div className="absolute w-2 h-2 bg-white rotate-45 shadow-[0_0_8px_cyan]" style={{ transform: `translate(${shipPos.x}px, ${shipPos.y}px)` }}></div>
            )}
         </div>

         {/* ORBIT VIEW */}
         <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${viewMode === 'ORBIT' ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
            <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Earth (EUG) - White/Blue Clean */}
                {activeBody === 'earth' && (
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-blue-900 shadow-[0_0_30px_rgba(59,130,246,0.3)] relative overflow-hidden">
                         <div className="absolute inset-0 border border-white/20 rounded-full"></div>
                         <div className="absolute top-10 left-10 w-20 h-10 bg-white/10 blur-xl"></div>
                    </div>
                )}
                
                {/* Mars (Free People) - Rusty/Neon Cyberpunk */}
                {activeBody === 'mars' && (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-700 to-red-900 shadow-[0_0_30px_rgba(234,88,12,0.3)] relative">
                        <div className="absolute inset-0 border-2 border-green-500/20 rounded-full animate-pulse"></div>
                        <div className="absolute top-1/2 left-1/2 w-full h-[1px] bg-green-500/30 -translate-x-1/2 rotate-45"></div>
                    </div>
                )}

                {/* Venus (Free People) - Toxic Yellow */}
                {activeBody === 'venus' && <div className="w-36 h-36 rounded-full bg-yellow-600 shadow-lg border-2 border-yellow-500/30"></div>}

                {/* Jupiter (EUG) - Massive/Clean */}
                {activeBody === 'jupiter' && (
                    <div className="w-48 h-48 rounded-full bg-gradient-to-b from-orange-200 via-orange-300 to-orange-400 shadow-[0_0_40px_white] relative overflow-hidden">
                        <div className="absolute w-full h-4 bg-white/40 top-1/3 blur-sm"></div>
                    </div>
                )}

                {/* Saturn (Red Cult) - Red/Dark */}
                {activeBody === 'saturn' && (
                    <div className="relative w-40 h-40 rounded-full bg-red-900 shadow-[0_0_40px_#991b1b] flex items-center justify-center">
                        <div className="absolute w-[180%] h-1 bg-red-500/50 rounded-full rotate-[15deg]"></div>
                        <div className="absolute w-[180%] h-20 border-2 border-red-500/30 rounded-full rotate-[15deg]"></div>
                        <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-red-500 rounded-full animate-pulse shadow-[0_0_20px_red]"></div>
                    </div>
                )}
                
                {/* Belt (Free People) - Scrappy */}
                {activeBody === 'belt' && (
                    <div className="w-24 h-24 flex items-center justify-center relative animate-spin-slow">
                        <div className="absolute w-2 h-2 bg-gray-400 top-0"></div>
                        <div className="absolute w-3 h-3 bg-gray-500 bottom-0"></div>
                        <div className="absolute w-2 h-2 bg-gray-600 left-0"></div>
                        <div className="w-16 h-16 border-2 border-dashed border-green-500/40 rounded-full"></div>
                    </div>
                )}

                <div className={`absolute bottom-0 right-0 transform translate-x-4 translate-y-4 bg-black/80 border ${currentFaction === 'RED CULT' ? 'border-red-500' : 'border-neon-blue'} p-2 text-[9px] text-white`}>
                    LOC: {activeBody.toUpperCase()}<br/>
                    FAC: {currentFaction}<br/>
                    SUB: {regionName}
                </div>
            </div>
         </div>
      </div>

      <div className="p-4 border-t border-neon-blue/20 bg-black">
          <div className="text-[9px] text-gray-500 uppercase">Sector Control</div>
          <div className={`font-bold text-sm ${factionColor}`}>{currentFaction}</div>
          <div className="text-gray-400 text-xs mt-1 truncate">{regionName}</div>
      </div>
    </div>
  );
};