
import React, { useState, useEffect, useRef } from 'react';
import { GameService } from './services/geminiService';
import { GameEngine } from './services/GameEngine';
import { GameState, ChatMessage, FactionDetails, PlayerProfile, GameConfig, ShopItem } from './types';
import { ITEMS } from './data/rules';
import { Terminal } from './components/Terminal';
import { HUD } from './components/HUD';
import { Intro } from './components/Intro';
import { StarMap } from './components/StarMap';
import { NewsPanel } from './components/NewsPanel';
import { SkillsPanel } from './components/SkillsPanel';
import { TeamPanel } from './components/TeamPanel';
import { ShopModal } from './components/ShopModal';

// 設定顯示歷史紀錄的最大長度，優化效能
const MAX_HISTORY_LEN = 50;

const App: React.FC = () => {
  const [gameService] = useState(() => new GameService());
  const engineRef = useRef<GameEngine | null>(null);
  
  const [input, setInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<'MAP' | 'NEWS' | 'SKILLS' | 'TEAM'>('MAP');

  const [gameState, setGameState] = useState<GameState>({
    playerName: '',
    date: '3150-01-01',
    location: 'Unknown',
    credits: 0,
    health: 100,
    level: 1, 
    experience: 0,
    nextLevelXp: 100, 
    actionPoints: 5,
    freeSkillPoints: 0,
    identity: 'Unknown',
    factionId: '',
    history: [],
    isGameOver: false,
    gameStarted: false,
    inventory: [],
    factions: { earth: 0, mars: 0, belt: 0, jupiter: 0, saturn: 0 },
    reputation: 'Unknown',
    currentOptions: [],
    news: [],
    gossip: [],
    chronicles: [],
    psionics: { level: 0, energy: 0, max_energy: 0, abilities: [] },
    skills: [],
    shop: null
  });

  // 自動存檔機制 (已優化：存檔瘦身)
  useEffect(() => {
    if (gameState.gameStarted && engineRef.current) {
      try {
        // 建立存檔專用的輕量化 State
        const minifiedReactState = {
          ...gameState,
          // 歷史訊息只保留最後 5 則 (作為回顧用，避免存檔無限膨脹)
          history: gameState.history.slice(-5),
          // 世界觀動態資料也僅保留最新紀錄
          news: (gameState.news || []).slice(-10),
          gossip: (gameState.gossip || []).slice(-10),
          chronicles: (gameState.chronicles || []).slice(-20),
          // 注意：credits, location, skills, inventory 等核心數值因 ...gameState 而完整保留
        };

        const savePayload = {
          reactState: minifiedReactState,
          engineState: engineRef.current.getState()
        };
        
        localStorage.setItem('sol_civ_save_v1', JSON.stringify(savePayload));
      } catch (e) {
        console.warn("Auto-save failed (Storage Full?):", e);
      }
    }
  }, [gameState]);

  const startGame = async (name: string, faction: FactionDetails, profile: PlayerProfile, avatarUrl: string, config: GameConfig) => {
    setIsProcessing(true);
    try {
      // 1. 初始化遊戲狀態
      const initialState: GameState = {
        playerName: name,
        playerProfile: profile,
        avatarUrl: avatarUrl,
        date: '3150-01-01',
        location: faction.id === 'EUG' ? 'Earth' : faction.id === 'RED_CULT' ? 'Saturn' : 'Mars',
        credits: 1000,
        health: 100,
        level: 1,
        experience: 0,
        nextLevelXp: 100,
        actionPoints: 5,
        freeSkillPoints: 0,
        identity: `${faction.name} Operative`,
        factionId: faction.id,
        history: [],
        isGameOver: false,
        gameStarted: true,
        inventory: [],
        factions: { earth: 0, mars: 0, belt: 0, jupiter: 0, saturn: 0 },
        reputation: 'Neutral',
        currentOptions: [],
        skills: [],
        psionics: { level: 0, energy: 0, max_energy: 0, abilities: [] },
      };

      // 2. 啟動本地引擎
      engineRef.current = new GameEngine(initialState);
      
      // 3. 啟動 AI 會話 (僅設定 Persona)
      await gameService.startSession(name, faction, profile, config);

      // 4. 更新 React 狀態 (立即顯示 HUD 數值)
      setGameState(initialState);

      // 5. 生成開場劇情 (Prompt 會要求生成初始 Skills 與 Faction Data)
      const introLog = `[SYSTEM] Neural Link Established. Subject: ${name}. Faction: ${faction.name}. Location: ${initialState.location}. Initializing skills and faction database.`;
      const narrative = await gameService.generateStory(introLog, initialState);
      
      // 6. 混合更新
      setGameState(prev => ({ 
        ...prev, 
        ...narrative,
        // 混合策略：若 AI 有回傳技能/勢力/聲望則更新，否則保留初始值
        skills: narrative.skills && narrative.skills.length > 0 ? narrative.skills : prev.skills,
        factions: narrative.factions || prev.factions,
        myFaction: narrative.myFaction || prev.myFaction,
        reputation: narrative.reputation || prev.reputation,
        
        history: [{ 
          role: 'model' as const, 
          content: narrative.description, 
          timestamp: Date.now(), 
          imagePrompt: narrative.image_prompt 
        } as ChatMessage]
      }));

    } catch (error: any) { 
      alert("啟動失敗: " + error.message); 
      setGameState(prev => ({ ...prev, gameStarted: false }));
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleAction = async (text: string, silent: boolean = false) => {
    if (!text.trim() || isProcessing || gameState.isGameOver || !engineRef.current) return;
    
    const userAction = text.trim();
    setInput('');
    setIsProcessing(true);
    
    // 1. 立即顯示玩家輸入 (State 裁切優化)
    if (!silent) {
      setGameState(prev => ({ 
        ...prev, 
        currentOptions: [], 
        history: [...prev.history, { role: 'user' as const, content: userAction, timestamp: Date.now() }].slice(-MAX_HISTORY_LEN) 
      }));
    }
    
    try {
      // 2. Engine 運算 (移動、休息、交易等 Cost 計算)
      let systemLog = `[USER ACTION] ${userAction}`;
      const lower = userAction.toLowerCase();
      let engineUpdated = false;

      // 指令解析
      if (lower.match(/^(travel|move|前往|移動)\s+/)) {
          const dest = userAction.split(/\s+/).slice(1).join(' ');
          systemLog = engineRef.current.processAction('TRAVEL', dest);
          engineUpdated = true;
      } 
      else if (lower.match(/^(rest|休息|休整)/)) {
           systemLog = engineRef.current.processAction('REST', 1);
           engineUpdated = true;
      } 
      else if (userAction.includes("[TRANSACTION]")) {
           const match = userAction.match(/購買物品:\s*(.*?)\s*\(/);
           if (match && match[1]) {
               const itemName = match[1].trim();
               const entry = Object.entries(ITEMS).find(([_, item]) => item.name === itemName);
               if (entry) {
                   systemLog = engineRef.current.processAction('TRADE', { itemId: entry[0], action: 'BUY' });
                   engineUpdated = true;
               }
           } else if (userAction.includes("離開")) {
               systemLog = `[SYSTEM] 玩家離開了商店。`;
               setGameState(prev => ({ ...prev, shop: null })); 
           }
      }

      // 3. Engine 狀態同步 (預先更新 Cost, Date)
      let currentEngineState = engineRef.current.getState();
      if (engineUpdated) {
          setGameState(prev => ({
              ...prev,
              ...currentEngineState, 
              history: silent ? prev.history : [...prev.history].slice(-MAX_HISTORY_LEN)
          }));
      }

      // 4. AI 敘事生成
      const narrative = await gameService.generateStory(systemLog, currentEngineState);
      
      const modelMsg: ChatMessage = { 
        role: 'model', 
        content: narrative.description, 
        timestamp: Date.now(), 
        imagePrompt: narrative.image_prompt, 
        silent 
      };

      // 5. 處理 AI 回傳的遊戲事件 (XP, HP, LevelUp)
      let eventLogs: string[] = [];
      if (narrative.game_events) {
         eventLogs = engineRef.current.applyGameEvents(narrative.game_events);
         // 重新取得應用事件後的 Engine 狀態
         currentEngineState = engineRef.current.getState();
      }
      
      // 6. 最終狀態更新 (混合 Engine 數值與 AI 敘事)
      setGameState(prev => {
        const newHistory = silent ? prev.history : [...prev.history, modelMsg];
        // 將 Engine 產生的事件訊息 (升級、受傷) 加到對話紀錄
        if (eventLogs.length > 0 && !silent) {
            eventLogs.forEach(log => {
                newHistory.push({ role: 'system' as const, content: log, timestamp: Date.now() });
            });
        }
        
        // State 裁切優化：只保留最後 MAX_HISTORY_LEN 筆
        const trimmedHistory = newHistory.slice(-MAX_HISTORY_LEN);

        return {
            ...prev,
            // 優先使用 Engine 的硬數值 (包含 applyGameEvents 更新後的 XP, HP, Level)
            credits: currentEngineState.credits,
            health: currentEngineState.health,
            level: currentEngineState.level,
            experience: currentEngineState.experience,
            nextLevelXp: currentEngineState.nextLevelXp,
            freeSkillPoints: currentEngineState.freeSkillPoints,
            actionPoints: currentEngineState.actionPoints,
            date: currentEngineState.date,
            location: currentEngineState.location,
            inventory: currentEngineState.inventory,

            // 使用 AI 的軟數值
            history: trimmedHistory,
            currentOptions: narrative.options || [],
            latestImagePrompt: narrative.image_prompt,
            news: narrative.news || prev.news,
            gossip: narrative.gossip || prev.gossip,
            chronicles: narrative.chronicles || prev.chronicles,
            shop: narrative.shop,

            // 技能與勢力：AI 優先，但如果 Engine (透過事件) 新增了技能，需要保留
            // 這裡採取簡單策略：若 AI 有回傳技能清單則使用，否則保留目前狀態
            skills: (narrative.skills && narrative.skills.length > 0) ? narrative.skills : prev.skills,
            
            factions: narrative.factions || prev.factions,
            myFaction: narrative.myFaction || prev.myFaction,
            reputation: narrative.reputation || prev.reputation
        };
      });

    } catch (error: any) {
      if (!silent) {
        setGameState(prev => ({ 
            ...prev, 
            history: [...prev.history, { role: 'system' as const, content: `[ERROR]: ${error.message}`, timestamp: Date.now() }].slice(-MAX_HISTORY_LEN) 
        }));
      }
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleSkillUpgrade = (skillName: string) => {
    if (!engineRef.current) return;
    const state = engineRef.current.getState();
    
    // 處理前端扣點
    if (state.freeSkillPoints > 0) {
        state.freeSkillPoints -= 1;
        // 立即更新 UI
        setGameState(prev => ({ ...prev, freeSkillPoints: state.freeSkillPoints }));
        
        // 通知 AI 進行技能等級與描述更新
        handleAction(`[SYSTEM] 玩家消耗 1 點技能點，升級技能 "${skillName}"。請更新該技能等級與描述。`, true);
    }
  };

  const handleBuyItem = (item: ShopItem) => {
    handleAction(`[TRANSACTION] 購買物品: ${item.name} (價格: ${item.price})`, true);
  };

  const handleCloseShop = () => {
    handleAction(`[TRANSACTION] 離開商店`, true);
  };

  if (!gameState.gameStarted) return <Intro onStart={startGame} isLoading={isProcessing} />;

  return (
    <div className="flex flex-col h-screen bg-void-black text-white font-sans overflow-hidden">
      <HUD state={gameState} />
      
      {gameState.shop && (
          <ShopModal 
              shop={gameState.shop} 
              credits={gameState.credits} 
              onBuy={handleBuyItem} 
              onClose={handleCloseShop} 
          />
      )}

      <div className="flex-1 flex overflow-hidden max-w-[1920px] mx-auto w-full">
        <div className="flex-1 flex flex-col border-r border-neon-blue/10 min-w-0 relative">
          <Terminal messages={gameState.history} isProcessing={isProcessing} />
          <div className="p-4 bg-black/60 border-t border-neon-blue/20 backdrop-blur-md">
            {gameState.currentOptions && gameState.currentOptions.length > 0 && !isProcessing && (
              <div className="flex flex-wrap gap-2 mb-3">
                {gameState.currentOptions.map((opt, i) => (
                  <button key={opt.id || i} onClick={() => handleAction(opt.text)} className="px-3 py-1.5 border border-neon-blue/40 text-neon-blue text-xs hover:bg-neon-blue/20 transition-all font-mono uppercase tracking-tighter">[{opt.id || i}] {opt.text}</button>
                ))}
              </div>
            )}
            <form onSubmit={e => { e.preventDefault(); handleAction(input); }} className="relative">
              <input value={input} onChange={e => setInput(e.target.value)} disabled={isProcessing} className="w-full bg-black/60 border border-neon-blue/30 p-3 pl-8 text-sm outline-none font-mono focus:border-neon-blue transition-all" placeholder={isProcessing ? "PROCESSING..." : "ENTER COMMAND..."} />
              <span className="absolute left-3 top-3.5 text-neon-blue font-bold opacity-50">{'>'}</span>
            </form>
          </div>
        </div>
        <div className="hidden lg:flex flex-col w-96 bg-black/40 border-l border-neon-blue/10">
          <div className="flex border-b border-neon-blue/20">
            {(['MAP', 'SKILLS', 'TEAM', 'NEWS'] as const).map(tab => (
              <button key={tab} onClick={() => setSidebarTab(tab)} className={`flex-1 py-3 text-[10px] tracking-widest font-bold font-mono transition-colors ${sidebarTab === tab ? 'text-neon-blue border-b-2 border-neon-blue bg-neon-blue/5' : 'text-gray-500 hover:text-gray-300'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'MAP' && <StarMap location={gameState.location} />}
            {sidebarTab === 'NEWS' && <NewsPanel news={gameState.news || []} gossip={gameState.gossip} chronicles={gameState.chronicles} />}
            {sidebarTab === 'SKILLS' && <SkillsPanel skills={gameState.skills || []} psionics={gameState.psionics} experience={gameState.experience || 0} freeSkillPoints={gameState.freeSkillPoints || 0} onUpgradeSkill={handleSkillUpgrade} />}
            {sidebarTab === 'TEAM' && <TeamPanel faction={gameState.myFaction} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
