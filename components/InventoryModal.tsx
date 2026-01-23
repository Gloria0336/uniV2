
import React from 'react';
import { InventorySlot } from '../types';
import { getItemDef } from '../data/items';

interface InventoryModalProps {
  inventory: InventorySlot[];
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ inventory, onClose }) => {
  const safeInventory = Array.isArray(inventory) ? inventory : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-lg animate-fade-in p-4">
      {/* Background scanlines */}
      <div className="absolute inset-0 pointer-events-none bg-scanline bg-[length:100%_4px] opacity-5"></div>
      
      <div className="relative w-full max-w-4xl h-[80vh] flex flex-col bg-void-black border border-neon-blue/40 shadow-[0_0_50px_rgba(0,243,255,0.2)] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-neon-blue/30 bg-neon-blue/10 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-neon-blue flex items-center justify-center text-black font-bold rounded">INV</div>
                <div>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-widest">個人裝備與物資 (Inventory)</h2>
                    <p className="text-[10px] text-neon-blue/60 font-mono tracking-widest">NEURAL_LINK_STORAGE_V4.2 // 已加密</p>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center border border-neon-red text-neon-red hover:bg-neon-red hover:text-black transition-all"
            >
                ✕
            </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar: Equipment Slots (Mockup) */}
            <div className="w-1/3 border-r border-white/5 p-6 bg-black/40 hidden md:flex flex-col gap-6">
                <h3 className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold border-b border-gray-800 pb-2">生命維持與植入 (EQUIP)</h3>
                <div className="space-y-4">
                    {['HEAD_SLOT (視覺)', 'BODY_SLOT (裝甲)', 'LEFT_HAND (武器)', 'RIGHT_HAND (工具)', 'IMPLANT (靈能)'].map(slot => (
                        <div key={slot} className="h-12 border border-dashed border-gray-800 flex items-center px-4 bg-black/20 rounded group hover:border-neon-blue/40 transition-all">
                            <span className="text-[9px] text-gray-600 font-mono group-hover:text-neon-blue">{slot}</span>
                            <div className="ml-auto w-2 h-2 rounded-full bg-gray-900 group-hover:bg-neon-blue/40"></div>
                        </div>
                    ))}
                </div>
                <div className="mt-auto p-4 bg-neon-blue/5 border border-neon-blue/20 rounded">
                    <div className="text-[9px] text-neon-blue font-bold mb-1">系統診斷</div>
                    <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden">
                        <div className="w-[85%] h-full bg-neon-blue"></div>
                    </div>
                    <div className="text-[8px] text-gray-500 mt-1 uppercase">核心穩定性: 正常</div>
                </div>
            </div>

            {/* Main Content: Inventory Grid */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs text-gray-400 uppercase tracking-widest">存儲清單 ({safeInventory.length} / 20)</h3>
                    <div className="text-[10px] text-neon-blue font-mono">TYPE: RAW_MATERIALS</div>
                </div>

                {safeInventory.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-700 border border-dashed border-gray-800 rounded">
                        <span className="text-4xl mb-4">∅</span>
                        <p className="text-xs uppercase tracking-widest font-mono">背包目前空無一物</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {safeInventory.map((slot, idx) => {
                            const itemDef = getItemDef(slot.itemId);
                            const name = itemDef ? itemDef.name : slot.itemId;
                            return (
                                <div key={idx} className="aspect-square border border-gray-800 bg-white/5 hover:border-neon-blue hover:bg-neon-blue/5 transition-all p-3 flex flex-col items-center justify-center text-center group cursor-default">
                                    <div className="w-10 h-10 mb-2 border border-gray-700 flex items-center justify-center text-gray-400 group-hover:text-neon-blue group-hover:border-neon-blue transition-all">
                                        {name.includes('靈能') ? '✦' : name.includes('急救') ? '✚' : '📦'}
                                    </div>
                                    <div className="text-[10px] font-bold text-gray-300 leading-tight group-hover:text-white">
                                        {name} {slot.quantity > 1 ? `x${slot.quantity}` : ''}
                                    </div>
                                    <div className="mt-auto text-[8px] text-gray-600 font-mono">#ID_{idx.toString().padStart(3, '0')}</div>
                                </div>
                            );
                        })}
                        
                        {/* Placeholder slots */}
                        {[...Array(Math.max(0, 12 - safeInventory.length))].map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square border border-white/5 bg-white/[0.02] rounded-sm"></div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neon-blue/30 bg-black flex justify-between items-center">
            <div className="text-[9px] text-gray-600 font-mono uppercase tracking-[0.5em] animate-pulse">Neural transmission active...</div>
            <button 
                onClick={onClose}
                className="px-8 py-2 bg-neon-blue text-black font-bold uppercase text-xs tracking-widest hover:bg-white transition-all"
            >
                關閉界面 (Close)
            </button>
        </div>
      </div>
    </div>
  );
};
