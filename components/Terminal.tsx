
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface TerminalProps {
  messages: ChatMessage[];
  isProcessing: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ messages, isProcessing }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // 過濾掉靜默消息
  const visibleMessages = messages.filter(m => !m.silent);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages, isProcessing]);

  return (
    <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 font-mono text-sm md:text-base relative z-10 custom-scrollbar">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-gradient-to-b from-transparent to-black/20 z-0"></div>
      
      {visibleMessages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex flex-col ${
            msg.role === 'user' ? 'items-end' : 'items-start'
          } animate-fade-in`}
        >
          {msg.role === 'model' && msg.imagePrompt && (
            <div className="max-w-[85%] md:max-w-[70%] mb-2 rounded-lg overflow-hidden border border-neon-blue/30 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
              <img 
                src={`https://image.pollinations.ai/prompt/${encodeURIComponent(msg.imagePrompt + " sci-fi concept art 8k")}?width=800&height=450&nologo=true`} 
                alt="Scene Visualization"
                className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity"
                loading="lazy"
              />
            </div>
          )}

          <div
            className={`max-w-[85%] md:max-w-[70%] p-4 rounded-lg border backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.3)] ${
              msg.role === 'user'
                ? 'bg-neon-blue/10 border-neon-blue/30 text-cyan-50 rounded-br-none'
                : 'bg-glass border-white/10 text-gray-200 rounded-bl-none'
            }`}
          >
            {msg.role === 'model' && (
              <div className="flex items-center gap-2 mb-2 text-xs text-neon-blue uppercase tracking-widest font-bold">
                <span className="w-2 h-2 bg-neon-blue rounded-full animate-pulse"></span>
                系統核心 (SYSTEM AI)
              </div>
            )}
            {msg.role === 'user' && (
              <div className="flex items-center justify-end gap-2 mb-2 text-xs text-neon-green uppercase tracking-widest font-bold">
                玩家指令
                <span className="w-2 h-2 bg-neon-green rounded-full"></span>
              </div>
            )}
            
            <div className="whitespace-pre-wrap leading-relaxed">
              {msg.content}
            </div>
          </div>
        </div>
      ))}

      {isProcessing && (
        <div className="flex items-start">
           <div className="max-w-[70%] p-4 rounded-lg rounded-bl-none border border-white/10 bg-glass text-neon-blue font-mono text-xs animate-pulse">
             > 正在運算模擬邏輯...
           </div>
        </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
};
