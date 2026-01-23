
import React, { useMemo, useState, useEffect } from 'react';
import { LOCATIONS } from '../data/rules';

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

  const safeLocation = String(location || "");
  const parts = safeLocation.split('-');
  const regionName = parts.length > 1 ? parts[1].trim() : "深空區域 (DEEP SPACE)";

  // 嘗試解析當前地點的 ImageURL
  const currentImageUrl = useMemo(() => {
    const locKey = Object.keys(LOCATIONS).find(k => 
        safeLocation.toLowerCase().includes(LOCATIONS[k].name.toLowerCase()) || 
        safeLocation.toLowerCase().includes(k.toLowerCase())
    );
    return locKey ? LOCATIONS[locKey].imageUrl : undefined;
  }, [safeLocation]);

  const targetLocation = useMemo(() => {
    let body: BodyType = 'unknown';
    let moon: MoonType = 'none';
    const loc = safeLocation.toLowerCase();

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

  // 定義星體渲染參數 (顏色改為 Gradient Stops)
  const getSystemConfig = (body: BodyType) => {
    switch(body) {
        case 'venus': return { r: 40, angle: 220, baseColor: '#eab308', darkColor: '#854d0e', faction: '自由民' };
        case 'earth': return { r: 70, angle: 0, baseColor: '#3b82f6', darkColor: '#1e3a8a', faction: '地球聯合政府' };
        case 'mars': return { r: 100, angle: 120, baseColor: '#ef4444', darkColor: '#7f1d1d', faction: '自由民' };
        case 'belt': return { r: 130, angle: 240, baseColor: '#9ca3af', darkColor: '#4b5563', faction: '自由民' };
        case 'jupiter': return { r: 170, angle: 60, baseColor: '#fdba74', darkColor: '#9a3412', faction: '地球聯合政府' };
        case 'saturn': return { r: 210, angle: 160, baseColor: '#fcd34d', darkColor: '#78350f', faction: '紅教' };
        default: return { r: 0, angle: 0, baseColor: '#6b7280', darkColor: '#1f2937', faction: '未知' };
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
  const factionColor = currentFaction === '地球聯合政府' ? 'text-cyan-200' : currentFaction === '紅教' ? 'text-red-500' : 'text-green-400';
  const borderColor = currentFaction === '地球聯合政府' ? 'border-cyan-500' : currentFaction === '紅教' ? 'border-red-500' : 'border-green-500';

  const bodyNameMap: Record<BodyType, string> = {
    earth: '地球 (Earth)',
    mars: '火星 (Mars)',
    venus: '金星 (Venus)',
    jupiter: '木星 (Jupiter)',
    saturn: '土星 (Saturn)',
    belt: '小行星帶 (Belt)',
    sun: '太陽',
    unknown: '未知'
  };

  // Helper to render 3D sphere gradient
  const SphereStyle = (base: string, dark: string) => ({
    background: `radial-gradient(circle at 30% 30%, ${base}, ${dark} 80%)`,
    boxShadow: `0 0 10px ${base}40, inset -2px -2px 6px #000`
  });

  return (
    <div className={`flex flex-col h-full bg-black border-l border-neon-blue/20 ${className} font-mono relative overflow-hidden group`}>
      
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Holographic Grid */}
        <div className="absolute inset-0 opacity-20" 
             style={{ 
               backgroundImage: `linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px)`,
               backgroundSize: '40px 40px',
               transform: 'perspective(500px) rotateX(20deg)',
               transformOrigin: 'center 80%'
             }}>
        </div>
        {/* Stars / Noise */}
        <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-3 border-b border-neon-blue/20 bg-neon-blue/5 flex justify-between items-center text-[10px] backdrop-blur-sm">
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${viewMode === 'TRAVEL' ? 'bg-yellow-400 animate-pulse' : 'bg-neon-blue'}`}></div>
            <span className="text-neon-blue font-bold tracking-[0.2em]">{viewMode === 'TRAVEL' ? '>> WARP DRIVE ACTIVE' : '>> ORBITAL MONITOR'}</span>
        </div>
        <span className={`uppercase font-bold ${factionColor} bg-black/50 px-2 py-0.5 rounded border border-white/10`}>{currentFaction} 領空</span>
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center z-0">
         
         {/* SYSTEM VIEW (Solar System) */}
         <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${viewMode === 'ORBIT' ? 'scale-150 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}>
            {/* Sun */}
            <div className="absolute w-12 h-12 rounded-full bg-yellow-100 shadow-[0_0_60px_#f59e0b] z-10">
                <div className="absolute inset-0 bg-yellow-500 rounded-full blur-sm opacity-50 animate-pulse"></div>
            </div>
            
            {/* Orbits & Planets */}
            {['venus', 'earth', 'mars', 'belt', 'jupiter', 'saturn'].map(b => {
                const pos = getPos(b as BodyType);
                const cfg = getSystemConfig(b as BodyType);
                const isBelt = b === 'belt';

                return (
                    <React.Fragment key={b}>
                        {/* Orbit Line */}
                        <div className="absolute rounded-full border border-dashed border-white/10"
                             style={{ width: cfg.r * 2, height: cfg.r * 2 }}>
                        </div>
                        
                        {/* Planet Body */}
                        <div className={`absolute rounded-full z-20 ${isBelt ? 'w-1 h-1' : 'w-3 h-3'}`} 
                             style={{ 
                                 transform: `translate(${pos.x}px, ${pos.y}px)`,
                                 ...(!isBelt ? SphereStyle(cfg.baseColor, cfg.darkColor) : { background: '#6b7280' })
                             }}>
                             {/* Label on Hover */}
                             {!isBelt && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[8px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {b.toUpperCase()}
                                </div>
                             )}
                        </div>
                    </React.Fragment>
                );
            })}

            {/* Ship Icon */}
            {(viewMode === 'TRAVEL' || viewMode === 'SYSTEM') && (
                <div className="absolute z-30 transition-transform" style={{ transform: `translate(${shipPos.x}px, ${shipPos.y}px)` }}>
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-white transform -rotate-45 drop-shadow-[0_0_5px_cyan]"></div>
                    {viewMode === 'TRAVEL' && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-white/30 rounded-full animate-ping"></div>}
                </div>
            )}
         </div>

         {/* ORBIT VIEW (Close up) */}
         <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${viewMode === 'ORBIT' ? 'scale-100 opacity-100' : 'scale-50 opacity-0 pointer-events-none'}`}>
            <div className="relative w-72 h-72 flex items-center justify-center">
                
                {/* 1. Texture Based Rendering (If imageUrl exists) */}
                {currentImageUrl ? (
                    <div className="relative w-48 h-48 rounded-full shadow-[0_0_50px_rgba(0,0,0,0.8)] group-hover:shadow-[0_0_80px_rgba(59,130,246,0.2)] transition-all duration-1000">
                        {/* Rotating Planet Texture */}
                        <div className="w-full h-full rounded-full overflow-hidden relative">
                             <img 
                                src={currentImageUrl} 
                                alt={activeBody} 
                                className="w-full h-full object-cover scale-110"
                                style={{
                                    animation: 'spin-slow 120s linear infinite'
                                }}
                             />
                             {/* Atmosphere / Shadow Overlay */}
                             <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),rgba(0,0,0,0.8)_80%)] rounded-full pointer-events-none"></div>
                             <div className="absolute inset-0 rounded-full shadow-[inset_-10px_-10px_30px_rgba(0,0,0,0.9)] pointer-events-none"></div>
                        </div>
                        
                        {/* Rings for Saturn (CSS overlay on top of image) */}
                        {activeBody === 'saturn' && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[30%] border-[10px] border-gray-600/40 rounded-[50%] rotate-12 shadow-[0_0_20px_rgba(0,0,0,0.5)] pointer-events-none"></div>
                        )}
                    </div>
                ) : (
                    /* 2. CSS Procedural Rendering (Fallback) */
                    <>
                        {activeBody === 'earth' && (
                            <div className="w-40 h-40 rounded-full relative" style={SphereStyle('#3b82f6', '#172554')}>
                                 <div className="absolute top-10 left-10 w-20 h-10 bg-white/10 blur-xl rounded-full mix-blend-overlay"></div>
                                 {/* Clouds Mockup */}
                                 <div className="absolute inset-0 rounded-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-spin-slow" style={{ animationDuration: '60s' }}></div>
                            </div>
                        )}
                        
                        {activeBody === 'mars' && (
                            <div className="w-32 h-32 rounded-full relative" style={SphereStyle('#ea580c', '#7c2d12')}>
                                <div className="absolute inset-0 border border-red-500/20 rounded-full animate-pulse"></div>
                            </div>
                        )}

                        {activeBody === 'venus' && <div className="w-36 h-36 rounded-full" style={SphereStyle('#eab308', '#854d0e')}></div>}

                        {activeBody === 'jupiter' && (
                            <div className="w-48 h-48 rounded-full relative overflow-hidden" style={SphereStyle('#fdba74', '#9a3412')}>
                                {/* Bands */}
                                <div className="absolute top-[30%] w-full h-4 bg-black/10 blur-sm"></div>
                                <div className="absolute top-[50%] w-full h-6 bg-orange-900/20 blur-sm"></div>
                                <div className="absolute top-[65%] left-[20%] w-8 h-6 bg-red-800/40 rounded-full blur-[2px]"></div>
                            </div>
                        )}

                        {activeBody === 'saturn' && (
                            <div className="relative w-40 h-40 flex items-center justify-center">
                                <div className="absolute w-[180%] h-1 bg-gray-500/30 rounded-full rotate-[15deg] blur-[1px]"></div>
                                <div className="absolute w-[170%] h-24 border-[8px] border-yellow-800/30 rounded-[50%] rotate-[15deg]"></div>
                                <div className="relative w-32 h-32 rounded-full z-10" style={SphereStyle('#fcd34d', '#78350f')}></div>
                            </div>
                        )}
                        
                        {activeBody === 'belt' && (
                            <div className="w-24 h-24 flex items-center justify-center relative animate-spin-slow">
                                <div className="absolute w-2 h-2 bg-gray-400 top-0 shadow-[0_0_5px_white]"></div>
                                <div className="absolute w-3 h-3 bg-gray-500 bottom-0 shadow-[0_0_5px_white]"></div>
                                <div className="absolute w-2 h-2 bg-gray-600 left-0 shadow-[0_0_5px_white]"></div>
                                <div className="w-16 h-16 border-2 border-dashed border-gray-500/40 rounded-full"></div>
                                <div className="text-[9px] text-gray-400 font-mono">ASTEROID FIELD</div>
                            </div>
                        )}
                    </>
                )}

                {/* HUD Overlay for Planet */}
                <div className={`absolute bottom-0 right-0 transform translate-x-4 translate-y-4 bg-black/80 border-l-2 ${borderColor} p-2 pl-3 backdrop-blur-md shadow-lg z-20`}>
                    <div className="text-[10px] text-gray-400 font-mono mb-1 flex items-center gap-1">
                        <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                        TARGET LOCKED
                    </div>
                    <div className="text-xl font-bold text-white tracking-widest mb-1">{bodyNameMap[activeBody].split(' ')[0]}</div>
                    <div className={`text-[9px] ${factionColor} font-bold uppercase border-t border-white/10 pt-1 mt-1`}>
                        {currentFaction} 管轄
                    </div>
                    <div className="text-[8px] text-gray-500 mt-1 uppercase tracking-wider">{regionName}</div>
                </div>
            </div>
         </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-neon-blue/20 bg-black/80 backdrop-blur z-10 flex justify-between items-end">
          <div>
              <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">Sector Analysis</div>
              <div className={`font-bold text-sm ${factionColor}`}>{currentFaction}</div>
          </div>
          <div className="text-right">
              <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">System Time</div>
              <div className="text-xs text-neon-blue font-mono">{new Date().toLocaleTimeString()}</div>
          </div>
      </div>
      
      {/* Custom Styles for Slow Spin */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
