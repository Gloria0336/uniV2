
import React, { useState } from 'react';
import { FactionNews, GossipItem, ChronicleEvent } from '../types';

interface NewsPanelProps {
  news: FactionNews[];
  gossip?: GossipItem[];
  chronicles?: ChronicleEvent[];
}

export const NewsPanel: React.FC<NewsPanelProps> = ({ news = [], gossip = [], chronicles = [] }) => {
  const [activeTab, setActiveTab] = useState<'OFFICIAL' | 'GOSSIP' | 'HISTORY'>('OFFICIAL');

  const safeNews = Array.isArray(news) ? news : [];
  const safeGossip = Array.isArray(gossip) ? gossip : [];
  const safeChronicles = Array.isArray(chronicles) ? chronicles : [];

  return (
    <div className="flex-1 flex flex-col bg-black/80 font-mono overflow-y-auto custom-scrollbar border-l border-neon-blue/10">
      
      <div className="flex border-b border-neon-blue/20">
        <button 
          onClick={() => setActiveTab('OFFICIAL')}
          className={`flex-1 py-3 text-[10px] tracking-widest font-bold transition-all ${activeTab === 'OFFICIAL' ? 'bg-neon-blue/10 text-neon-blue border-b-2 border-neon-blue' : 'text-gray-500 hover:text-gray-300'}`}
        >
          OFFICIAL
        </button>
        <button 
          onClick={() => setActiveTab('GOSSIP')}
          className={`flex-1 py-3 text-[10px] tracking-widest font-bold transition-all ${activeTab === 'GOSSIP' ? 'bg-purple-900/20 text-purple-400 border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          RELAY
        </button>
        <button 
          onClick={() => setActiveTab('HISTORY')}
          className={`flex-1 py-3 text-[10px] tracking-widest font-bold transition-all ${activeTab === 'HISTORY' ? 'bg-yellow-900/20 text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          LOGS
        </button>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {activeTab === 'OFFICIAL' && (
            <>
                <div className="mb-2 text-[9px] text-gray-500 uppercase tracking-widest text-center italic">CONNECTED TO EUG NETWORK</div>
                {safeNews.length === 0 ? (
                    <div className="text-gray-600 text-[10px] text-center mt-10 animate-pulse">NO BROADCASTS...</div>
                ) : (
                    safeNews.map((item, idx) => (
                        <div key={idx} className="border-l-2 border-neon-blue/40 pl-4 py-1 animate-fade-in hover:bg-white/5 p-2 rounded-r">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] text-neon-blue bg-neon-blue/10 px-1 font-bold rounded">
                                    {String(item?.faction || 'SYSTEM').toUpperCase()}
                                </span>
                                <span className="text-[8px] text-gray-500">{String(item?.status || 'UPDATE')}</span>
                            </div>
                            <p className="text-xs text-white leading-relaxed">{String(item?.headline || "DATA SEGMENT LOST")}</p>
                        </div>
                    ))
                )}
            </>
        )}
        
        {activeTab === 'GOSSIP' && (
            <>
                <div className="mb-2 text-[9px] text-purple-600 uppercase tracking-widest text-center animate-pulse">ENCRYPTED RELAY ACTIVE</div>
                {safeGossip.length === 0 ? (
                    <div className="text-gray-700 text-[10px] text-center mt-10">NO INTERCEPTIONS...</div>
                ) : (
                    safeGossip.map((item, idx) => (
                        <div key={idx} className="bg-black border border-purple-900/40 p-3 rounded mb-3 animate-fade-in group hover:border-purple-500/60 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">{String(item?.source || 'ANON')}</span>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded ${String(item?.reliability || '').includes('高') ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'}`}>
                                    {String(item?.reliability || '???')}
                                </span>
                            </div>
                            <p className="text-xs text-gray-300 font-mono leading-relaxed">
                                {String(item?.content || "TRANSMISSION GARBLED")}
                            </p>
                        </div>
                    ))
                )}
            </>
        )}

        {activeTab === 'HISTORY' && (
            <>
                <div className="mb-2 text-[9px] text-yellow-600 uppercase tracking-widest text-center">SOLAR ARCHIVES</div>
                {safeChronicles.length === 0 ? (
                    <div className="text-gray-700 text-[10px] text-center mt-10">LOCAL BUFFER EMPTY</div>
                ) : (
                    <div className="relative border-l border-yellow-500/30 ml-2 space-y-6">
                        {safeChronicles.map((item, idx) => (
                            <div key={idx} className="pl-6 relative animate-fade-in">
                                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 bg-black border border-yellow-500 rotate-45"></div>
                                <div className="text-[10px] text-yellow-500 font-bold mb-1 tracking-wider">{String(item?.year || '????')}</div>
                                <div className="text-sm text-yellow-100 font-bold mb-1">{String(item?.title || "EVENT_UNDEFINED")}</div>
                                <p className="text-xs text-gray-400 leading-relaxed font-mono">
                                    {String(item?.description || "Historical data corrupted.")}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};
