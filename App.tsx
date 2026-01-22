
import React, { useState, useEffect, useRef } from 'react';
import { GameService } from './services/geminiService';
import { GameEngine } from './services/GameEngine';
import { GameState, ChatMessage, FactionDetails, PlayerProfile, GameConfig, ShopItem, FactionNews } from './types';
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
// 設定新聞最大保留數量 (依照指令下修至 10)
const MAX_NEWS_LEN = 10;

const App: React.FC = () => {
  const [gameService] = useState(() => new GameService());
  const engineRef = useRef<GameEngine | null>(null);
  
  const [input, setInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<'MAP' | 'SKILLS' | 'TEAM'>('MAP');
  const [showNewsModal, setShowNewsModal] = useState<boolean>(false);

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
    shop: null,
    lastNewsDate: '3150-01-01',
    actionStepCount: 0,
    turn: 1,
    worldStage: 1
  });

  // 自動存檔機制
  useEffect(() => {
    if (gameState.gameStarted && engineRef.current) {
      try {
        const minifiedReactState = {
          ...gameState,
          history: gameState.history.slice(-5),
          news: (gameState.news || []).slice(-MAX_NEWS_LEN),
          gossip: (gameState.gossip || []).slice(-MAX_NEWS_LEN),
          chronicles: (gameState.chronicles || []).slice(-20),
        };

        const savePayload = {
          reactState: minifiedReactState,
          engineState: engineRef.current.getState()
        };
        
        localStorage.setItem('sol_civ_save_v1', JSON.stringify(savePayload));
      } catch (e) {
        console.warn("Auto-save failed:", e);
      }
    }
  }, [gameState]);

  const startGame = async (name: string, faction: FactionDetails, profile: PlayerProfile, avatarUrl: string, config: GameConfig) => {
    setIsProcessing(true);
    try {
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
        lastNewsDate: '3150-01-01',
        actionStepCount: 0,
        turn: 1,
        worldStage: 1
      };

      engineRef.current = new GameEngine(initialState);
      await gameService.startSession(name, faction, profile, config);
      setGameState(engineRef.current.getState());

      const introLog = `[SYSTEM] Neural Link Established. Subject: ${name}. Faction: ${faction.name}. Location: ${initialState.location}. Initializing faction database and randomizing initial skill set.`;
      const narrative = await gameService.generateStory(introLog, initialState, "Initialize world state: Generate initial Faction News, Gossip, and RANDOM INITIAL SKILLS based on faction.");
      
      if (narrative.game_events?.initial_skills && engineRef.current) {
          engineRef.current.setSkills(narrative.game_events.initial_skills);
      }

      setGameState(prev => {
        const latestEngineState = engineRef.current!.getState();
        return { 
          ...prev, 
          ...narrative,
          skills: latestEngineState.skills,
          factions: narrative.factions || prev.factions,
          myFaction: narrative.myFaction || prev.myFaction,
          reputation: narrative.reputation || prev.reputation,
          history: [{ 
            role: 'model' as const, 
            content: narrative.description, 
            timestamp: Date.now(), 
            imagePrompt: narrative.image_prompt 
          } as ChatMessage]
        };
      });

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
    
    if (!silent) {
      setGameState(prev => ({ 
        ...prev, 
        currentOptions: [], 
        history: [...prev.history, { role: 'user' as const, content: userAction, timestamp: Date.now() }].slice(-MAX_HISTORY_LEN) 
      }));
    }
    
    try {
      let systemLog = `[USER ACTION] ${userAction}`;
      const lower = userAction.toLowerCase();
      let engineUpdated = false;

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
      } else {
           systemLog = engineRef.current.processAction('TALK', null);
           engineUpdated = true;
      }

      let currentEngineState = engineRef.current.getState();
      const prevDate = new Date(gameState.lastNewsDate || gameState.date).getTime();
      const currDate = new Date(currentEngineState.date).getTime();
      const dayDiff = (currDate - prevDate) / (1000 * 3600 * 24);
      const prevStep = gameState.actionStepCount || 0;
      const newStep = prevStep + 1;
      let specialRequest = "";
      let newLastNewsDate = gameState.lastNewsDate;

      if (dayDiff >= 3) {
        specialRequest += " [EVENT TRIGGER] It has been 3+ days. Please generate NEW Faction News updates.";
        newLastNewsDate = currentEngineState.date;
      }

      if (newStep % 3 === 0) {
        specialRequest += " [EVENT TRIGGER] 3 Actions passed. Please generate fresh Gossip/Rumors.";
      }

      if (engineUpdated) {
          setGameState(prev => ({
              ...prev,
              ...currentEngineState, 
              history: silent ? prev.history : [...prev.history].slice(-MAX_HISTORY_LEN)
          }));
      }

      const narrative = await gameService.generateStory(systemLog, currentEngineState, specialRequest);
      const modelMsg: ChatMessage = { 
        role: 'model', 
        content: narrative.description, 
        timestamp: Date.now(), 
        imagePrompt: narrative.image_prompt, 
        silent 
      };

      let eventLogs: string[] = [];
      if (narrative.game_events) {
         eventLogs = engineRef.current.applyGameEvents(narrative.game_events);
         currentEngineState = engineRef.current.getState();
      }
      
      setGameState(prev => {
        const newHistory = silent ? prev.history : [...prev.history, modelMsg];
        if (eventLogs.length > 0 && !silent) {
            eventLogs.forEach(log => {
                newHistory.push({ role: 'system' as const, content: log, timestamp: Date.now() });
            });
        }
        
        const trimmedHistory = newHistory.slice(-MAX_HISTORY_LEN);
        const incomingNews: FactionNews[] = (narrative.news || []).map(n => ({
             ...n, 
             turn: currentEngineState.turn,
             isMajorEvent: false
        }));
        
        // 依照指令：新聞與流言堆疊上限改為 10
        const combinedNews = [...(prev.news || []), ...incomingNews].slice(-10);
        const combinedGossip = [...(prev.gossip || []), ...(narrative.gossip || [])].slice(-10);

        return {
            ...prev,
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
            turn: currentEngineState.turn,
            worldStage: currentEngineState.worldStage,
            skills: currentEngineState.skills,
            lastNewsDate: newLastNewsDate,
            actionStepCount: newStep,
            history: trimmedHistory,
            currentOptions: narrative.options || [],
            latestImagePrompt: narrative.image_prompt,
            news: combinedNews,
            gossip: combinedGossip,
            chronicles: narrative.chronicles || prev.chronicles,
            shop: narrative.shop,
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
    const resultMsg = engineRef.current.upgradeSkill(skillName);
    const updatedState = engineRef.current.getState();
    setGameState(prev => ({ 
        ...prev, 
        skills: updatedState.skills, 
        freeSkillPoints: updatedState.freeSkillPoints
    }));
    if (resultMsg) {
         setGameState(prev => ({ 
             ...prev, 
             history: [...prev.history, { role: 'system' as const, content: resultMsg, timestamp: Date.now() }].slice(-MAX_HISTORY_LEN) 
         }));
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
      
      {/* 獨立懸浮新聞按鈕 */}
      <button 
        onClick={() => setShowNewsModal(true)}
        className="fixed top-4 right-4 z-[60] w-12 h-12 bg-black border-2 border-neon-blue text-neon-blue flex items-center justify-center rounded shadow-[0_0_15px_rgba(0,243,255,0.4)] hover:bg-neon-blue hover:text-black transition-all group"
      >
        <span className="text-xl group-hover:scale-110 transition-transform">📰</span>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-neon-red rounded-full animate-pulse border border-black"></div>
      </button>

      {gameState.shop && (
          <ShopModal 
              shop={gameState.shop} 
              credits={gameState.credits} 
              onBuy={handleBuyItem} 
              onClose={handleCloseShop} 
          />
      )}

      {/* 新版 NewsPanel Modal */}
      {showNewsModal && (
        <NewsPanel 
          news={gameState.news || []} 
          gossip={gameState.gossip} 
          chronicles={gameState.chronicles} 
          onClose={() => setShowNewsModal(false)}
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
        
        {/* 側邊欄：僅保留 MAP, SKILLS, TEAM */}
        <div className="hidden lg:flex flex-col w-96 bg-black/40 border-l border-neon-blue/10">
          <div className="flex border-b border-neon-blue/20">
            {(['MAP', 'SKILLS', 'TEAM'] as const).map(tab => (
              <button key={tab} onClick={() => setSidebarTab(tab)} className={`flex-1 py-3 text-[10px] tracking-widest font-bold font-mono transition-colors ${sidebarTab === tab ? 'text-neon-blue border-b-2 border-neon-blue bg-neon-blue/5' : 'text-gray-500 hover:text-gray-300'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'MAP' && <StarMap location={gameState.location} />}
            {sidebarTab === 'SKILLS' && <SkillsPanel skills={gameState.skills || []} psionics={gameState.psionics} experience={gameState.experience || 0} freeSkillPoints={gameState.freeSkillPoints || 0} onUpgradeSkill={handleSkillUpgrade} />}
            {sidebarTab === 'TEAM' && <TeamPanel faction={gameState.myFaction} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
