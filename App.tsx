
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

  // 自動存檔機制
  useEffect(() => {
    if (gameState.gameStarted && engineRef.current) {
      const savePayload = {
        reactState: gameState,
        engineState: engineRef.current.getState()
      };
      localStorage.setItem('sol_civ_save_v1', JSON.stringify(savePayload));
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
          role: 'model', 
          content: narrative.description, 
          timestamp: Date.now(), 
          imagePrompt: narrative.image_prompt 
        }]
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
    
    // 1. 立即顯示玩家輸入
    if (!silent) {
      setGameState(prev => ({ 
        ...prev, 
        currentOptions: [], 
        history: [...prev.history, { role: 'user', content: userAction, timestamp: Date.now() }] 
      }));
    }
    
    try {
      // 2. Engine 運算
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

      // 3. Engine 狀態同步 (硬數值)
      const currentEngineState = engineRef.current.getState();
      if (engineUpdated) {
          setGameState(prev => ({
              ...prev,
              ...currentEngineState, // 更新 Credits, HP, Date, Location
              history: silent ? prev.history : [...prev.history] 
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
      
      // 5. 混合更新策略
      setGameState(prev => ({ 
        ...prev, 
        // 優先使用 Engine 的硬數值 (因為已經在上一步 sync 了，這裡只是防禦性確保)
        credits: currentEngineState.credits,
        health: currentEngineState.health,
        actionPoints: currentEngineState.actionPoints,
        date: currentEngineState.date,
        location: currentEngineState.location,
        inventory: currentEngineState.inventory,

        // 使用 AI 的軟數值 (如果有的話)
        history: silent ? prev.history : [...prev.history, modelMsg],
        currentOptions: narrative.options || [],
        latestImagePrompt: narrative.image_prompt,
        news: narrative.news || prev.news,
        gossip: narrative.gossip || prev.gossip,
        chronicles: narrative.chronicles || prev.chronicles,
        shop: narrative.shop,

        // 關鍵修正：技能與勢力資料合併
        skills: (narrative.skills && narrative.skills.length > 0) ? narrative.skills : prev.skills,
        factions: narrative.factions || prev.factions,
        myFaction: narrative.myFaction || prev.myFaction,
        reputation: narrative.reputation || prev.reputation
      }));

    } catch (error: any) {
      if (!silent) {
        setGameState(prev => ({ ...prev, history: [...prev.history, { role: 'system', content: `[ERROR]: ${error.message}`, timestamp: Date.now() }] }));
      }
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleSkillUpgrade = (skillName: string) => {
    if (!engineRef.current) return;
    const state = engineRef.current.getState();
    // 注意：Engine 中其實沒有 skills 的詳細資料，只有空殼。
    // 但我們可以在前端做簡單的扣點邏輯，然後讓 AI 更新 skill level
    
    // 這裡我們只處理「扣除技能點」的硬邏輯
    if (state.freeSkillPoints > 0) {
        state.freeSkillPoints -= 1;
        // Engine 不負責維護 skill level，這由 AI 維護。
        // 我們手動通知 AI 這個動作
        
        // 立即更新 UI 的剩餘點數
        setGameState(prev => ({ ...prev, freeSkillPoints: state.freeSkillPoints }));
        
        // 通知 AI
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
