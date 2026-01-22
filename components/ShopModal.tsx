
import React from 'react';
import { ShopData, ShopItem } from '../types';

interface ShopModalProps {
  shop: ShopData;
  credits: number;
  onBuy: (item: ShopItem) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ shop, credits, onBuy, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-black border border-neon-blue shadow-[0_0_50px_rgba(0,243,255,0.2)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-neon-blue/30 bg-neon-blue/10 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-neon-blue uppercase tracking-widest">{shop.shopName}</h2>
                <p className="text-xs text-gray-400">{shop.shopDescription}</p>
            </div>
            <div className="text-right">
                <div className="text-[10px] text-gray-500 uppercase">持有信用點 (Credits)</div>
                <div className="text-xl font-bold text-yellow-400">{credits.toLocaleString()} CR</div>
            </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shop.items.map((item) => {
                    const canAfford = credits >= item.price;
                    return (
                        <div key={item.id} className={`p-4 border rounded relative group transition-all ${canAfford ? 'border-gray-700 hover:border-neon-blue bg-white/5' : 'border-red-900/50 opacity-60 bg-red-900/10'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-sm font-bold ${item.type === 'INFO' ? 'text-purple-400' : 'text-white'}`}>{item.name}</span>
                                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${canAfford ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-500'}`}>
                                    {item.price} CR
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3 h-10 overflow-hidden text-ellipsis">{item.description}</p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[9px] text-gray-600 uppercase border border-gray-800 px-1 rounded">{item.type}</span>
                                <button 
                                    onClick={() => canAfford && onBuy(item)}
                                    disabled={!canAfford}
                                    className={`text-xs px-4 py-2 border uppercase tracking-widest font-bold transition-all ${
                                        canAfford 
                                        ? 'border-neon-green text-neon-green hover:bg-neon-green hover:text-black' 
                                        : 'border-gray-800 text-gray-600 cursor-not-allowed'
                                    }`}
                                >
                                    {canAfford ? '購買 (Purchase)' : '信用點不足'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neon-blue/30 bg-black flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2 border border-neon-red text-neon-red hover:bg-neon-red hover:text-black transition-all font-mono uppercase text-xs tracking-widest"
            >
                [ 關閉連結 ]
            </button>
        </div>
      </div>
    </div>
  );
};
