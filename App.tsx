
import React, { useState, useEffect, useRef } from 'react';
import { GameService } from './services/geminiService';
import { GameEngine } from './services/GameEngine';
import { GameState, ChatMessage, FactionDetails, PlayerProfile, GameConfig, ShopItem, FactionNews, GameOption } from './types';
import { ITEMS } from './data/rules';
import { Terminal } from './components/Terminal';
import { HUD } from './components/HUD';
import { Intro } from './components/Intro';
import { StarMap } from './components/StarMap';
import { NewsPanel } from './components/NewsPanel';
import { SkillsPanel } from './components/SkillsPanel';
import { TeamPanel } from './components/TeamPanel';
import { ShopModal } from './components/ShopModal';

const MAX_HISTORY_LEN = 50;
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
    location: '未知',
    credits: 0,
    health: 100,
    level: 1, 
    experience: 0,
    nextLevelXp: 100, 
    actionPoints: 5,
    freeSkillPoints: 0,
    identity: '未知',
    factionId: '',
    history: [],
    isGameOver: false,
    gameStarted: false,
    inventory: [],
    factions: { earth: 0, mars: 0, belt: 0, jupiter: 0, saturn: 0 },
    reputation: '未知',
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
    worldStage: 1,
    interaction: { targetName: null, status: 'NONE' }
  });

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
      } catch (e) {}
    }
  }, [gameState]);

  // 共用的敘事處理函式
  const processGameResponse = async (systemLog: string, silent: boolean = false) => {
    if (!engineRef.current) return;

    let currentEngineState = engineRef.current.getState();
    const prevDate = new Date(gameState.lastNewsDate || gameState.date).getTime();
    const currDate = new Date(currentEngineState.date).getTime();
    const dayDiff = (currDate - prevDate) / (1000 * 3600 * 24);
    const newStep = (gameState.actionStepCount || 0) + 1;
    let specialRequest = "";
    let newLastNewsDate = gameState.lastNewsDate;

    if (dayDiff >= 3) {
      specialRequest += " [系統請求] 需要更新勢力新聞。";
      newLastNewsDate = currentEngineState.date;
    }
    if (newStep % 3 === 0) {
      specialRequest += " [系統請求] 需要更新暗網流言。";
    }

    setGameState(prev => ({ ...prev, ...currentEngineState }));

    const narrative = await gameService.generateStory(systemLog, currentEngineState, specialRequest);
    
    let eventLogs: string[] = [];
    if (narrative.game_events) {
       eventLogs = engineRef.current.applyGameEvents(narrative.game_events);
       currentEngineState = engineRef.current.getState();
    }
    
    // Explicitly casting role to avoid string assignment error
    setGameState(prev => {
      const newHistory: ChatMessage[] = [...prev.history, { 
          role: 'model' as const, 
          content: narrative.description, 
          timestamp: Date.now(), 
          imagePrompt: narrative.image_prompt 
      }];
      if (eventLogs.length > 0) {
          eventLogs.forEach(log => newHistory.push({ role: 'system' as const, content: log, timestamp: Date.now() }));
      }
      
      return {
          ...prev,
          ...currentEngineState,
          history: newHistory.slice(-MAX_HISTORY_LEN),
          currentOptions: narrative.options || [],
          news: [...(prev.news || []), ...(narrative.news || [])].slice(-10),
          gossip: [...(prev.gossip || []), ...(narrative.gossip || [])].slice(-10),
          lastNewsDate: newLastNewsDate,
          actionStepCount: newStep,
          shop: narrative.shop,
          reputation: narrative.reputation || prev.reputation,
          myFaction: narrative.myFaction || prev.myFaction,
          factions: narrative.factions || prev.factions
      };
    });
    setIsProcessing(false);
  };

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
        identity: `${faction.name} 特工`,
        factionId: faction.id,
        history: [],
        isGameOver: false,
        gameStarted: true,
        inventory: [],
        factions: { earth: 0, mars: 0, belt: 0, jupiter: 0, saturn: 0 },
        reputation: '中立',
        currentOptions: [],
        skills: [],
        psionics: { level: 0, energy: 0, max_energy: 0, abilities: [] },
        lastNewsDate: '3150-01-01',
        actionStepCount: 0,
        turn: 1,
        worldStage: 1,
        interaction: { targetName: null, status: 'NONE' }
      };
      engineRef.current = new GameEngine(initialState);
      await gameService.startSession(name, faction, profile, config);
      setGameState(engineRef.current.getState());

      const introLog = `[SYSTEM] Neural Link Established. Subject: ${name}. Faction: ${faction.name}. Location: ${initialState.location}. 正在初始化勢力資料庫。`;
      const narrative = await gameService.generateStory(introLog, initialState, "正在初始化世界狀態。");
      if (narrative.game_events?.initial_skills && engineRef.current) {
          engineRef.current.setSkills(narrative.game_events.initial_skills);
      }
      
      // Fix line 224: Avoid spreading narrative directly to avoid extra properties and map fields correctly.
      setGameState(prev => ({ 
        ...prev, 
        currentOptions: narrative.options || [],
        latestImagePrompt: narrative.image_prompt,
        news: narrative.news,
        gossip: narrative.gossip,
        chronicles: narrative.chronicles,
        shop: narrative.shop,
        reputation: narrative.reputation || prev.reputation,
        myFaction: narrative.myFaction || prev.myFaction,
        factions: narrative.factions || prev.factions,
        skills: engineRef.current!.getState().skills,
        history: [{ 
          role: 'model' as const, 
          content: narrative.description, 
          timestamp: Date.now(), 
          imagePrompt: narrative.image_prompt 
        }]
      }));
    } catch (error: any) { 
      alert("啟動失敗: " + error.message); 
      setGameState(prev => ({ ...prev, gameStarted: false }));
    } finally { setIsProcessing(false); }
  };

  const handleAction = async (text: string, option?: GameOption) => {
    if (!text.trim() || isProcessing || gameState.isGameOver || !engineRef.current) return;
    
    const userAction = text.trim();
    setInput('');
    setIsProcessing(true);
    
    // Explicitly casting role to 'user'
    setGameState(prev => ({ 
      ...prev, 
      currentOptions: [], 
      history: [...prev.history, { role: 'user' as const, content: userAction, timestamp: Date.now() }].slice(-MAX_HISTORY_LEN) 
    }));
    
    try {
      const ap_cost = option?.ap_cost ?? 0;
      const action_type = option?.action_type ?? 'TALK';
      const systemLog = engineRef.current.processAction(action_type, userAction, ap_cost);
      await processGameResponse(systemLog);
    } catch (error: any) {
      setGameState(prev => ({ 
          ...prev, 
          history: [...prev.history, { role: 'system' as const, content: `[錯誤]: ${error.message}`, timestamp: Date.now() }].slice(-MAX_HISTORY_LEN) 
      }));
      setIsProcessing(false);
    }
  };

  const handleBuyItem = async (item: ShopItem) => {
    if (!engineRef.current || gameState.isGameOver || isProcessing) return;
    
    const displayMsg = `[TRANSACTION] 購買物品: ${item.name} (價格: ${item.price} CR)`;
    // Explicitly casting role to 'user'
    setGameState(prev => ({
        ...prev,
        history: [...prev.history, { role: 'user' as const, content: displayMsg, timestamp: Date.now() }].slice(-MAX_HISTORY_LEN)
    }));
    
    setIsProcessing(true);

    try {
        const systemLog = engineRef.current.processAction('TRADE', { item, action: 'BUY' }, 0);
        await processGameResponse(systemLog);
    } catch (e: any) {
        setGameState(prev => ({ 
            ...prev, 
            history: [...prev.history, { role: 'system' as const, content: `[交易錯誤]: ${e.message}`, timestamp: Date.now() }].slice(-MAX_HISTORY_LEN) 
        }));
        setIsProcessing(false);
    }
  };

  const handleSkillUpgrade = (skillName: string) => {
    if (!engineRef.current) return;
    const msg = engineRef.current.upgradeSkill(skillName);
    const updated = engineRef.current.getState();
    setGameState(prev => ({ ...prev, skills: updated.skills, freeSkillPoints: updated.freeSkillPoints }));
    if (msg) setGameState(prev => ({ ...prev, history: [...prev.history, { role: 'system' as const, content: msg, timestamp: Date.now() }].slice(-MAX_HISTORY_LEN) }));
  };

  if (!gameState.gameStarted) return <Intro onStart={startGame} isLoading={isProcessing} />;

  return (
    <div className="flex flex-col h-screen bg-void-black text-white font-sans overflow-hidden">
      <HUD state={gameState} />
      
      <button onClick={() => setShowNewsModal(true)} title="開啟新聞面板" className="fixed top-4 right-4 z-[60] w-12 h-12 bg-black border-2 border-neon-blue text-neon-blue flex items-center justify-center rounded shadow-[0_0_15px_rgba(0,243,255,0.4)] hover:bg-neon-blue hover:text-black transition-all">
        <span className="text-xl">📰</span>
      </button>

      {gameState.shop && <ShopModal shop={gameState.shop} credits={gameState.credits} onBuy={handleBuyItem} onClose={() => setGameState(prev => ({ ...prev, shop: null }))} />}
      {showNewsModal && <NewsPanel news={gameState.news || []} gossip={gameState.gossip} chronicles={gameState.chronicles} onClose={() => setShowNewsModal(false)} />}

      <div className="flex-1 flex overflow-hidden max-w-[1920px] mx-auto w-full">
        <div className="flex-1 flex flex-col border-r border-neon-blue/10 min-w-0 relative">
          <Terminal messages={gameState.history} isProcessing={isProcessing} />
          <div className="p-4 bg-black/60 border-t border-neon-blue/20 backdrop-blur-md">
            {gameState.currentOptions && gameState.currentOptions.length > 0 && !isProcessing && (
              <div className="flex flex-wrap gap-2 mb-3">
                {gameState.currentOptions.map((opt) => (
                  <button 
                    key={opt.id} 
                    onClick={() => handleAction(opt.text, opt)} 
                    className="px-3 py-1.5 border border-neon-blue/40 text-neon-blue text-xs hover:bg-neon-blue/20 transition-all font-mono uppercase tracking-tighter"
                  >
                    [{opt.id}] {opt.text} 
                    <span className={`ml-2 font-bold ${opt.ap_cost > 0 ? 'text-neon-red' : 'text-neon-green'}`}>
                        {opt.ap_cost > 0 ? `(AP -${opt.ap_cost})` : `(免費)`}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={e => { e.preventDefault(); handleAction(input); }} className="relative">
              <input value={input} onChange={e => setInput(e.target.value)} disabled={isProcessing} className="w-full bg-black/60 border border-neon-blue/30 p-3 pl-8 text-sm outline-none font-mono focus:border-neon-blue" placeholder={isProcessing ? "正在處理中..." : "輸入指令..."} />
              <span className="absolute left-3 top-3.5 text-neon-blue font-bold opacity-50">{'>'}</span>
            </form>
          </div>
        </div>
        
        <div className="hidden lg:flex flex-col w-96 bg-black/40 border-l border-neon-blue/10">
          <div className="flex border-b border-neon-blue/20">
            {([['MAP', '星圖'], ['SKILLS', '技能'], ['TEAM', '團隊']] as const).map(([tab, label]) => (
              <button key={tab} onClick={() => setSidebarTab(tab as any)} className={`flex-1 py-3 text-[10px] tracking-widest font-bold font-mono transition-colors ${sidebarTab === tab ? 'text-neon-blue border-b-2 border-neon-blue bg-neon-blue/5' : 'text-gray-500 hover:text-gray-300'}`}>
                {label}
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
