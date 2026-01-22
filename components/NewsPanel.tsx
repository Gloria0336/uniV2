
import React, { useState } from 'react';
import { FactionNews, GossipItem, ChronicleEvent } from '../types';

interface NewsPanelProps {
  news: FactionNews[];
  gossip?: GossipItem[];
  chronicles?: ChronicleEvent[];
  onClose: () => void;
}

export const NewsPanel: React.FC<NewsPanelProps> = ({ news = [], gossip = [], chronicles = [], onClose }) => {
  const [activeTab, setActiveTab] = useState<'OFFICIAL' | 'GOSSIP' | 'HISTORY'>('OFFICIAL');

  const safeNews = Array.isArray(news) ? news : [];
  const safeGossip = Array.isArray(gossip) ? gossip : [];
  const safeChronicles = Array.isArray(chronicles) ? chronicles : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4 md:p-10">
      
      {/* Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-scanline bg-[length:100%_4px] opacity-10 animate-scanline"></div>
      
      <div className="relative w-full max-w-6xl h-full flex flex-col bg-void-black border border-neon-blue/40 shadow-[0_0_60px_rgba(0,243,255,0.1)] overflow-hidden">
        
        {/* Top Header / Nav */}
        <div className="flex border-b border-neon-blue/30 bg-black/80">
          <div className="px-6 py-4 border-r border-neon-blue/20 flex items-center">
            <h2 className="text-xl font-bold text-neon-blue tracking-tighter uppercase italic">Solar Times</h2>
          </div>
          <div className="flex-1 flex overflow-x-auto">
            <button 
              onClick={() => setActiveTab('OFFICIAL')}
              className={`px-8 py-4 text-xs tracking-[0.3em] font-bold transition-all whitespace-nowrap ${activeTab === 'OFFICIAL' ? 'bg-white text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              [ OFFICIAL_FEED ]
            </button>
            <button 
              onClick={() => setActiveTab('GOSSIP')}
              className={`px-8 py-4 text-xs tracking-[0.3em] font-bold transition-all whitespace-nowrap ${activeTab === 'GOSSIP' ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(219,39,119,0.5)]' : 'text-gray-500 hover:text-pink-400'}`}
            >
              [ DARK_NET_RELAY ]
            </button>
            <button 
              onClick={() => setActiveTab('HISTORY')}
              className={`px-8 py-4 text-xs tracking-[0.3em] font-bold transition-all whitespace-nowrap ${activeTab === 'HISTORY' ? 'bg-yellow-600 text-black' : 'text-gray-500 hover:text-yellow-500'}`}
            >
              [ ARCHIVES ]
            </button>
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-4 text-neon-red font-bold hover:bg-neon-red hover:text-black transition-all border-l border-neon-blue/20"
          >
            ESC
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/40">
          
          {activeTab === 'OFFICIAL' && (
            <div className="p-6 md:p-10 max-w-5xl mx-auto font-serif">
                {/* Newspaper Header */}
                <div className="text-center border-b-4 border-white pb-6 mb-8">
                    <div className="text-[10px] tracking-[0.5em] text-gray-500 uppercase mb-2 font-mono">Earth United Government Authorized Network</div>
                    <h3 className="text-5xl md:text-7xl font-bold text-white uppercase tracking-tighter leading-none">太陽系日報</h3>
                    <div className="flex justify-between items-center mt-4 text-[10px] font-mono text-gray-400 px-2 uppercase italic tracking-widest">
                        <span>Edition: 3150-Q1</span>
                        <span>Price: 5.00 CR</span>
                        <span>Verified: EUG-77-DELTA</span>
                    </div>
                </div>

                {/* News Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {safeNews.length === 0 ? (
                        <div className="col-span-2 text-center py-20 opacity-20 text-4xl italic font-mono uppercase">Wait for transmission...</div>
                    ) : (
                        safeNews.map((item, idx) => (
                            <div key={idx} className={`space-y-3 pb-8 ${idx < safeNews.length - 1 ? 'border-b border-white/20' : ''}`}>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] bg-black border border-white px-2 py-0.5 font-mono text-white font-bold uppercase">
                                        {item.faction}
                                    </span>
                                    <span className="text-[9px] text-gray-500 font-mono italic">[ VERIFIED ]</span>
                                </div>
                                <h4 className="text-2xl font-bold text-white leading-tight hover:text-neon-blue transition-colors cursor-default">
                                    {item.headline}
                                </h4>
                                <p className="text-sm text-gray-400 leading-relaxed indent-4">
                                    {item.status}. 根據最近的星際情報顯示，該地區的局勢正在發生深刻變化。EUG 官員表示將持續關注動態並確保航道安全。
                                </p>
                            </div>
                        ))
                    )}
                </div>
                
                <div className="mt-12 text-center text-[10px] font-mono text-gray-700 tracking-widest">
                    --- END OF OFFICIAL BROADCAST ---
                </div>
            </div>
          )}
          
          {activeTab === 'GOSSIP' && (
            <div className="p-6 md:p-10 font-mono">
                <div className="flex items-center gap-3 mb-8 bg-pink-900/10 border border-pink-500/30 p-4 rounded animate-pulse">
                    <span className="text-pink-500 text-2xl">☠</span>
                    <div>
                        <div className="text-pink-400 font-bold uppercase tracking-widest">Connection: Untraceable</div>
                        <div className="text-[10px] text-pink-600">WARNING: Neural spikes detected. Information reliability not guaranteed.</div>
                    </div>
                </div>

                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    {safeGossip.length === 0 ? (
                        <div className="text-pink-900 text-center py-20 text-4xl uppercase animate-pulse">Silence is death...</div>
                    ) : (
                        safeGossip.map((item, idx) => (
                            <div key={idx} className="break-inside-avoid bg-black border-l-4 border-pink-600 p-4 shadow-[5px_5px_0_rgba(219,39,119,0.2)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] text-pink-400 font-bold bg-pink-900/20 px-1">{item.source}</span>
                                    <span className="text-[8px] text-white/40 uppercase tracking-tighter">ID: #{Math.floor(Math.random()*90000)}</span>
                                </div>
                                <p className="text-xs text-pink-100 leading-relaxed mb-4">
                                    {item.content}
                                </p>
                                <div className="flex justify-between items-center text-[9px]">
                                    <div className="flex gap-2">
                                        <span className="text-pink-600 font-bold">#LEAK</span>
                                        <span className="text-pink-600 font-bold">#RUMOR</span>
                                    </div>
                                    <span className={`font-bold ${item.reliability.includes('高') ? 'text-green-500' : 'text-neon-red'}`}>
                                        CRED: {item.reliability}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div className="p-6 md:p-10 font-mono max-w-4xl mx-auto">
                <div className="mb-10 text-center">
                    <h3 className="text-2xl font-bold text-yellow-500 tracking-widest uppercase mb-2">Solar Archives</h3>
                    <div className="text-[10px] text-gray-500">Read-only Database // Last Updated: Turn {safeNews.length > 0 ? safeNews[0].turn : '??'}</div>
                </div>

                <div className="relative border-l-2 border-yellow-500/20 ml-4 space-y-12 pb-10">
                    {safeChronicles.length === 0 ? (
                        <div className="text-yellow-900 text-center py-20 text-2xl uppercase">History is yet to be written...</div>
                    ) : (
                        safeChronicles.map((item, idx) => (
                            <div key={idx} className="pl-10 relative group">
                                <div className="absolute -left-[11px] top-1 w-5 h-5 bg-black border-2 border-yellow-500 rounded-full group-hover:bg-yellow-500 transition-colors"></div>
                                <div className="text-lg font-bold text-yellow-500 mb-2">{item.year} - {item.title}</div>
                                <div className="p-4 bg-yellow-900/5 border border-yellow-500/20 rounded">
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
          )}

        </div>
        
        {/* Modal Footer Decorations */}
        <div className="p-2 border-t border-neon-blue/20 bg-black flex justify-between items-center px-6">
            <div className="text-[8px] text-gray-700 font-mono uppercase tracking-[1em]">Scanning for signal... 100% Signal Strength</div>
            <div className="flex gap-4">
                <div className="w-2 h-2 bg-neon-blue animate-pulse"></div>
                <div className="w-2 h-2 bg-pink-600 animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-yellow-500 animate-pulse delay-150"></div>
            </div>
        </div>
      </div>
    </div>
  );
};
