
import React, { useState } from 'react';
import { ShopData, ShopItem } from '../types';

interface ShopModalProps {
  shop: ShopData;
  credits: number;
  onBuy: (item: ShopItem) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ shop, credits, onBuy, onClose }) => {
  const [lastBought, setLastBought] = useState<string | null>(null);

  const handleLocalBuy = (item: ShopItem) => {
    onBuy(item);
    setLastBought(item.name);
    setTimeout(() => setLastBought(null), 1500);
  };

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

        {/* Feedback Bar */}
        <div className={`h-8 flex items-center justify-center transition-all ${lastBought ? 'bg-neon-green/20' : 'bg-transparent'}`}>
            {lastBought && (
                <span className="text-[10px] text-neon-green font-bold animate-pulse">
                   ✔ 成功購買: {lastBought} // 物品已存入背包
                </span>
            )}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shop.items.map((item) => {
                    const canAfford = credits >= item.price;
                    return (
                        <div key={item.id} className={`p-4 border rounded relative group transition-all flex gap-3 ${canAfford ? 'border-gray-700 hover:border-neon-blue bg-white/5' : 'border-red-900/50 opacity-60 bg-red-900/10'}`}>
                            {/* Image / Icon */}
                            <div className="w-16 h-16 shrink-0 bg-black/50 border border-gray-800 flex items-center justify-center rounded overflow-hidden">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl text-gray-500">{item.type === 'INFO' ? '💾' : '📦'}</span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-sm font-bold truncate ${item.type === 'INFO' ? 'text-purple-400' : 'text-white'}`}>{item.name}</span>
                                </div>
                                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded inline-block mb-2 ${canAfford ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-500'}`}>
                                    {item.price} CR
                                </span>
                                <p className="text-xs text-gray-400 mb-2 h-8 overflow-hidden text-ellipsis leading-tight">{item.description}</p>
                                
                                <div className="flex justify-between items-center mt-auto">
                                    <span className="text-[9px] text-gray-600 uppercase border border-gray-800 px-1 rounded">{item.type}</span>
                                    <button 
                                        onClick={() => canAfford && handleLocalBuy(item)}
                                        disabled={!canAfford}
                                        className={`text-[10px] px-3 py-1 border uppercase tracking-widest font-bold transition-all ${
                                            canAfford 
                                            ? 'border-neon-green text-neon-green hover:bg-neon-green hover:text-black' 
                                            : 'border-gray-800 text-gray-600 cursor-not-allowed'
                                        }`}
                                    >
                                        {canAfford ? '購買' : '不足'}
                                    </button>
                                </div>
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
