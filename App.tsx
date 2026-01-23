
import React, { useState, useEffect, useRef } from 'react';
import { GameService } from './services/geminiService';
import { GameEngine } from './services/GameEngine';
import { GameState, ChatMessage, FactionDetails, PlayerProfile, GameConfig, ShopItem, FactionNews, GameOption } from './types';
import { Terminal } from './components/Terminal';
import { HUD } from './components/HUD';
import { Intro } from './components/Intro';
import { StarMap } from './components/StarMap';
import { NewsPanel } from './components/NewsPanel';
import { SkillsPanel } from './components/SkillsPanel';
import { TeamPanel } from './components/TeamPanel';
import { ShopModal } from './components/ShopModal';
import { InventoryModal } from './components/InventoryModal';

const MAX_HISTORY_LEN = 50;

const App: React.FC = () => {
  const [gameService] = useState(() => new GameService());
  const engineRef = useRef<GameEngine | null>(null);
  
  const [input, setInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<'MAP' | 'SKILLS' | 'TEAM'>('MAP');
  const [showNewsModal, setShowNewsModal] = useState<boolean>(false);
  const [showInventory, setShowInventory] = useState<boolean>(false);

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
    worldFactions: {
        EUG: { members: 2000000000, influence: 90 },
        RED_CULT: { members: 20000000, influence: 70 },
        FREE_PEOPLE: { members: 18000000, influence: 5 }
    },
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

  const startGame = async (name: string, faction: FactionDetails, profile: PlayerProfile, avatarUrl: string, config: GameConfig) => {
    setIsProcessing(true);
    
    try {
      await gameService.startSession(name, faction, profile, config);

      const placeholderState: GameState = {
        playerName: name,
        playerProfile: profile,
        avatarUrl: avatarUrl,
        date: '3150-01-01',
        location: '深空', 
        credits: 1000,
        health: 100,
        level: 1,
        experience: 0,
        nextLevelXp: 100,
        actionPoints: 5,
        freeSkillPoints: 0,
        identity: '正在建立連結...',
        factionId: faction.id,
        history: [],
        isGameOver: false,
        gameStarted: true, // 重要修正：在傳給引擎前就設為 true，防止回彈
        inventory: [],
        factions: { earth: 0, mars: 0, belt: 0, jupiter: 0, saturn: 0 },
        worldFactions: {
            EUG: { members: 2000000000, influence: 90 },
            RED_CULT: { members: 20000000, influence: 70 },
            FREE_PEOPLE: { members: 18000000, influence: 5 }
        },
        reputation: '中立',
        currentOptions: [],
        skills: [],
        psionics: { level: 0, energy: 0, max_energy: 0, abilities: [] },
        turn: 1,
        worldStage: 1,
        interaction: { targetName: null, status: 'NONE' }
      };

      const initialNarrative = await gameService.generateStory(
        `[SYSTEM] Neural Link Initializing for ${name}. Analyzing biological profile and faction alignment...`,
        placeholderState,
        "這是開場回應。請提供: description, generated_identity, starting_location, initial_skills。"
      );

      const finalInitialState: GameState = {
        ...placeholderState,
        identity: initialNarrative.generated_identity,
        location: initialNarrative.starting_location,
        history: [{ 
          role: 'model' as const, 
          content: initialNarrative.description, 
          timestamp: Date.now(), 
          imagePrompt: initialNarrative.image_prompt 
        }],
        currentOptions: initialNarrative.options,
        news: initialNarrative.news,
        gossip: initialNarrative.gossip,
        chronicles: initialNarrative.chronicles
      };

      engineRef.current = new GameEngine(finalInitialState);
      if (initialNarrative.game_events?.initial_skills) {
          engineRef.current.setSkills(initialNarrative.game_events.initial_skills);
      }

      setGameState({
          ...engineRef.current.getState(),
          gameStarted: true
      });

    } catch (error: any) { 
      alert("神經連結失敗: " + error.message); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const processGameResponse = async (systemLog: string, silent: boolean = false) => {
    if (!engineRef.current) return;
    let currentEngineState = engineRef.current.getState();
    const { history: _h, ...engineStateSafe } = currentEngineState;

    setGameState(prev => ({
      ...prev,
      ...engineStateSafe,
      history: silent ? prev.history : [...prev.history].slice(-MAX_HISTORY_LEN)
    }));

    try {
      const narrative = await gameService.generateStory(systemLog, currentEngineState, "");
      let eventLogs: string[] = [];
      if (narrative.game_events) {
         eventLogs = engineRef.current.applyGameEvents(narrative.game_events);
         currentEngineState = engineRef.current.getState();
      }
      
      const { history: _h2, ...finalEngineStateSafe } = currentEngineState;

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
            ...finalEngineStateSafe,
            history: newHistory.slice(-MAX_HISTORY_LEN),
            currentOptions: narrative.options || [],
            news: [...(prev.news || []), ...(narrative.news || [])].slice(-10),
            gossip: [...(prev.gossip || []), ...(narrative.gossip || [])].slice(-10),
            shop: narrative.shop || null,
            reputation: narrative.reputation || prev.reputation,
            myFaction: narrative.myFaction || prev.myFaction,
            factions: narrative.factions || prev.factions,
            worldFactions: narrative.world_factions || prev.worldFactions
        };
      });
    } catch (err: any) {
        setGameState(prev => ({ 
            ...prev, 
            history: [...prev.history, { role: 'system' as const, content: `[傳輸錯誤]: ${err.message}`, timestamp: Date.now() }].slice(-MAX_HISTORY_LEN) 
        }));
    } finally {
        setIsProcessing(false);
    }
  };

  const handleAction = async (text: string, option?: GameOption) => {
    if (!text.trim() || isProcessing || gameState.isGameOver || !engineRef.current) return;

    const userAction = text.trim();
    
    // 1. 建立預設的行動參數 (針對手動輸入)
    let finalOption: Partial<GameOption> = option || {
        id: -1,
        text: userAction,
        action_type: 'ACTION',
        ap_cost: 1,            // 手動輸入預設消耗 1 AP
        difficulty: 'NORMAL'
    };

    // 2. 關鍵字攔截：如果是休息指令，成本改為 0
    if (/(休息|rest|修整|休整|睡覺|sleep)/i.test(userAction)) {
          finalOption = {
            id: -1,
            text: userAction,
            action_type: 'REST',
            ap_cost: 0
          };
    }

    // 3. Client-side Check: AP 耗盡阻擋
    if (finalOption.action_type !== 'REST' && gameState.actionPoints <= 0) {
        setGameState(prev => ({ 
            ...prev, 
            history: [...prev.history, { 
                role: 'system' as const, 
                content: `[體力透支] 你的 AP 已耗盡 (0/5)。你已經筋疲力盡，無法執行 "${userAction}"。\n請輸入「休息」或點擊相關選項來恢復體力。`, 
                timestamp: Date.now() 
            }].slice(-MAX_HISTORY_LEN) 
        }));
        return;
    }

    setInput('');
    setIsProcessing(true);
    
    setGameState(prev => ({ 
      ...prev, 
      currentOptions: [], 
      history: [...prev.history, { role: 'user' as const, content: userAction, timestamp: Date.now() }].slice(-MAX_HISTORY_LEN) 
    }));
    
    try {
      // 傳入處理後的 finalOption
      const systemLog = engineRef.current.processAction(userAction, finalOption);
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
    if (!engineRef.current || gameState.isGameOver) return;
    try {
        // 使用更新後的 processAction 簽章：傳入物件 payload，並附帶基礎 option 結構以符合類型
        const systemLog = engineRef.current.processAction(
            { type: 'TRADE', payload: { item, action: 'BUY' } }, 
            { action_type: 'TRADE', ap_cost: 0, id: 0, text: 'Buy' }
        );
        
        const updatedEngineState = engineRef.current.getState();
        const { history: _h, ...engineStateSafe } = updatedEngineState;
        setGameState(prev => ({
            ...prev,
            ...engineStateSafe,
            history: [...prev.history, { 
                role: 'system' as const, 
                content: `[交易成功] 購買了 ${item.name}。`, 
                timestamp: Date.now(),
                silent: true 
            }].slice(-MAX_HISTORY_LEN)
        }));
    } catch (e: any) {
        setGameState(prev => ({ 
            ...prev, 
            history: [...prev.history, { role: 'system' as const, content: `[交易失敗]: ${e.message}`, timestamp: Date.now() }].slice(-MAX_HISTORY_LEN) 
        }));
    }
  };

  const handleSkillUpgrade = (skillName: string) => {
    if (!engineRef.current) return;
    const msg = engineRef.current.upgradeSkill(skillName);
    const updated = engineRef.current.getState();
    const { history: _h, ...engineStateSafe } = updated;
    setGameState(prev => ({ 
        ...prev, 
        ...engineStateSafe,
        history: [...prev.history, { role: 'system' as const, content: msg, timestamp: Date.now() }].slice(-MAX_HISTORY_LEN) 
    }));
  };

  if (!gameState.gameStarted) return <Intro onStart={startGame} isLoading={isProcessing} />;

  return (
    <div className="flex flex-col h-screen bg-void-black text-white font-sans overflow-hidden">
      <HUD state={gameState} onOpenInventory={() => setShowInventory(true)} />
      
      <button onClick={() => setShowNewsModal(true)} title="新聞" className="fixed top-4 right-4 z-[60] w-12 h-12 bg-black border-2 border-neon-blue text-neon-blue flex items-center justify-center rounded shadow-[0_0_15px_rgba(0,243,255,0.4)] hover:bg-neon-blue hover:text-black transition-all">
        <span className="text-xl">📰</span>
      </button>

      {gameState.shop && <ShopModal shop={gameState.shop} credits={gameState.credits} onBuy={handleBuyItem} onClose={() => setGameState(prev => ({ ...prev, shop: null }))} />}
      {showInventory && <InventoryModal inventory={gameState.inventory} onClose={() => setShowInventory(false)} />}
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
                    {opt.requiredSkill && (
                        <span className="ml-2 text-[10px] text-purple-400 border border-purple-500/50 px-1 rounded">
                           🎲 {opt.difficulty || 'NORMAL'}
                        </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={e => { e.preventDefault(); handleAction(input); }} className="relative">
              <input value={input} onChange={e => setInput(e.target.value)} disabled={isProcessing} className="w-full bg-black/60 border border-neon-blue/30 p-3 pl-8 text-sm outline-none font-mono focus:border-neon-blue" placeholder={isProcessing ? "正在傳輸神經信號..." : "輸入指令..."} />
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
