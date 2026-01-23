
import React, { useState, useEffect } from 'react';
import { FactionDetails, FACTIONS, FactionType, PlayerProfile, GameConfig, ModelProvider } from '../types';
import { GameService } from '../services/geminiService';

interface IntroProps {
  onStart: (name: string, faction: FactionDetails, profile: PlayerProfile, avatarUrl: string, config: GameConfig) => void;
  isLoading: boolean;
}

const RANDOM_PERSONALITIES = [
  "冷酷無情的利己主義者，只在乎任務報酬。",
  "尋求真理的紅教叛徒，對神秘學有獨到見解。",
  "崇尚混亂的自由無政府主義者，喜歡破壞舊秩序。",
  "絕對理性的數據分析師，缺乏同理心但判斷精準。",
  "富有同情心的前戰地醫護，無法見死不救。",
  "偏執的科技崇拜者，認為肉體是軟弱的根源。",
  "追求刺激的虛空行者，哪裡有危險就往哪去。",
  "沉默寡言的賞金獵人，信奉以牙還牙。"
];

const RANDOM_APPEARANCES = [
  "左眼替換為軍用級紅色義眼，臉頰有明显的散熱排氣孔。穿著舊式飛行夾克。",
  "右臂完全機械化，手指是各種精密工具。身上沾滿了機油與鐵鏽的味道。",
  "皮膚蒼白如紙，頸部後方有顯眼的數據接口插槽。穿著漆黑的高領風衣。",
  "全身覆蓋著廉價的鉻金屬塗層，穿著霓虹色的透明塑膠雨衣。",
  "留著雜亂的粉色龐克短髮，身上掛滿了各種舊時代的幸運符和硬幣。",
  "穿著筆挺的聯合政府制服，但總是戴著一個破碎的防毒面具遮住下半臉。",
  "看似完美的仿生人外表，但在情緒激動時，皮膚下會透出不穩定的藍光。",
  "半邊臉被嚴重燒傷，用粗糙的金屬補丁遮蓋，眼神兇狠且充滿戒備。"
];

export const Intro: React.FC<IntroProps> = ({ onStart, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'AUTH' | 'IDENTITY' | 'PROFILE'>('AUTH');
  const [testService] = useState(() => new GameService());
  const [testStatus, setTestStatus] = useState<{ msg: string; type: 'idle' | 'loading' | 'success' | 'error' }>({ msg: '', type: 'idle' });

  // API Config State
  const [provider, setProvider] = useState<ModelProvider>('GEMINI');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [openRouterModel, setOpenRouterModel] = useState('anthropic/claude-3.5-sonnet');
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  // Identity State
  const [name, setName] = useState('');
  const [selectedFaction, setSelectedFaction] = useState<FactionType | null>(null);

  // Profile State
  const [gender, setGender] = useState('Non-binary');
  const [personality, setPersonality] = useState('');
  const [appearance, setAppearance] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  useEffect(() => {
    // Automatic Environment Detection for Gemini
    const envKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    
    if (envKey) {
      console.log("System identity check: Environment Key Detected.");
      setHasGeminiKey(true);
      // Only auto-skip if default provider is Gemini
      if (provider === 'GEMINI') {
          setActiveTab('IDENTITY');
      }
    } else if (window.aistudio) {
      window.aistudio.hasSelectedApiKey().then((hasKey) => {
        if (hasKey) {
            setHasGeminiKey(true);
            if (provider === 'GEMINI') {
                setActiveTab('IDENTITY');
            }
        }
      });
    }
  }, [provider]);

  const handleSelectGeminiKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasGeminiKey(true);
      setActiveTab('IDENTITY');
    }
  };

  const handleTestConnection = async () => {
    setTestStatus({ msg: '正在嘗試建立神經連結...', type: 'loading' });
    try {
      const config: GameConfig = { provider, openRouterKey, openRouterModel };
      const msg = await testService.testConnection(config);
      setTestStatus({ msg: `連線成功: ${msg}`, type: 'success' });
    } catch (err: any) {
      setTestStatus({ msg: `連線失敗: ${err.message}`, type: 'error' });
    }
  };

  const handleGenerateAvatar = () => {
    setIsGeneratingAvatar(true);
    const seed = `${name || 'explorer'}-${gender}-${appearance}-${personality}-${Math.floor(Math.random() * 1000)}`;
    const newAvatar = `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(seed)}&baseColor=00f3ff,3b82f6,ef4444&backgroundColor=050505`;
    setTimeout(() => {
      setAvatarPreview(newAvatar);
      setIsGeneratingAvatar(false);
    }, 1200);
  };

  const handleRandomizeProfile = () => {
    const genders = ['Male', 'Female', 'Non-binary', 'Android'];
    const newGender = genders[Math.floor(Math.random() * genders.length)];
    const newPersonality = RANDOM_PERSONALITIES[Math.floor(Math.random() * RANDOM_PERSONALITIES.length)];
    const newAppearance = RANDOM_APPEARANCES[Math.floor(Math.random() * RANDOM_APPEARANCES.length)];

    setGender(newGender);
    setPersonality(newPersonality);
    setAppearance(newAppearance);

    // Auto generate avatar for the random profile
    setIsGeneratingAvatar(true);
    const seed = `${name || 'explorer'}-${newGender}-${newAppearance}-${newPersonality}-${Math.floor(Math.random() * 1000)}`;
    const newAvatar = `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(seed)}&baseColor=00f3ff,3b82f6,ef4444&backgroundColor=050505`;
    setTimeout(() => {
      setAvatarPreview(newAvatar);
      setIsGeneratingAvatar(false);
    }, 800);
  };

  const handleStartClick = () => {
    if (!name.trim() || !selectedFaction) {
      alert("請填寫玩家代號並選擇勢力");
      return;
    }
    const faction = FACTIONS.find(f => f.id === selectedFaction);
    if (faction) {
      const profile: PlayerProfile = { gender, personality: personality || '未知', appearance: appearance || '賽博龐克探索者' };
      const config: GameConfig = { provider, openRouterKey, openRouterModel };
      onStart(name, faction, profile, avatarPreview, config);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-void-black text-white font-sans overflow-y-auto relative">
      {/* Loading Overlay */}
      {isLoading && (
          <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center text-center p-10 backdrop-blur-md">
              <div className="w-32 h-32 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(0,243,255,0.3)]"></div>
              <h2 className="text-3xl font-bold text-neon-blue uppercase tracking-[0.3em] mb-4 animate-pulse">正在建構神經網絡 (Initializing...)</h2>
              <div className="max-w-md space-y-2">
                  <p className="text-xs text-gray-500 font-mono">>> 正在掃描 {name} 的生物特徵...</p>
                  <p className="text-xs text-gray-500 font-mono">>> 正在與 {selectedFaction} 伺服器建立握手協定...</p>
                  <p className="text-xs text-gray-500 font-mono">>> AI 敘事者正在生成世界初始參數...</p>
                  <p className="text-xs text-neon-green font-mono mt-4 animate-pulse">請勿切換分頁，模擬啟動中。</p>
              </div>
          </div>
      )}

      <div className="relative z-10 w-full max-w-5xl bg-black border border-neon-blue/40 shadow-[0_0_40px_rgba(0,243,255,0.15)] rounded-xl overflow-hidden flex flex-col md:flex-row h-[85vh]">
        
        {/* Sidebar Nav */}
        <div className="md:w-20 bg-black/80 border-r border-neon-blue/20 flex md:flex-col items-center py-6 gap-6">
             <button onClick={() => !isLoading && setActiveTab('AUTH')} className={`w-12 h-12 rounded border transition-all flex items-center justify-center font-bold ${activeTab === 'AUTH' ? 'bg-neon-blue border-neon-blue text-black' : 'border-gray-700 text-gray-500 hover:text-white'}`}>金鑰</button>
             <button onClick={() => !isLoading && setActiveTab('IDENTITY')} className={`w-12 h-12 rounded border transition-all flex items-center justify-center font-bold ${activeTab === 'IDENTITY' ? 'bg-neon-blue border-neon-blue text-black' : 'border-gray-700 text-gray-500 hover:text-white'}`}>身份</button>
             <button onClick={() => !isLoading && setActiveTab('PROFILE')} className={`w-12 h-12 rounded border transition-all flex items-center justify-center font-bold ${activeTab === 'PROFILE' ? 'bg-neon-blue border-neon-blue text-black' : 'border-gray-700 text-gray-500 hover:text-white'}`}>檔案</button>
        </div>

        <div className="flex-1 flex flex-col min-w-0 p-8">
            <h1 className="text-4xl font-bold text-neon-blue tracking-tighter mb-6 uppercase">
              {activeTab === 'AUTH' ? '系統授權核准' : activeTab === 'IDENTITY' ? '神經鏈接初始化' : '生物特徵檔案'}
            </h1>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                {activeTab === 'AUTH' && (
                    <div className="space-y-6 animate-fade-in">
                        
                        {/* Provider Toggle */}
                        <div className="flex gap-4 p-1 bg-white/5 rounded border border-white/10">
                            <button 
                                onClick={() => setProvider('GEMINI')} 
                                className={`flex-1 py-2 text-sm font-bold tracking-widest transition-all ${provider === 'GEMINI' ? 'bg-neon-blue text-black shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'text-gray-500 hover:text-white'}`}
                            >
                                GOOGLE GEMINI
                            </button>
                            <button 
                                onClick={() => setProvider('OPENROUTER')} 
                                className={`flex-1 py-2 text-sm font-bold tracking-widest transition-all ${provider === 'OPENROUTER' ? 'bg-neon-green text-black shadow-[0_0_10px_rgba(10,255,10,0.3)]' : 'text-gray-500 hover:text-white'}`}
                            >
                                OPENROUTER
                            </button>
                        </div>

                        {provider === 'GEMINI' ? (
                            <div className="bg-white/5 border border-neon-blue/20 p-6 rounded text-center space-y-4">
                                <p className="text-xs text-gray-400">系統核心已鎖定使用 Gemini 3 Flash Preview。</p>
                                
                                {hasGeminiKey ? (
                                    <div className="p-3 bg-neon-green/10 border border-neon-green/50 text-neon-green text-sm font-mono tracking-widest rounded">
                                        [ 環境變數已偵測 - 金鑰就緒 ]
                                    </div>
                                ) : (
                                    <button onClick={handleSelectGeminiKey} className="px-6 py-3 border border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black rounded font-mono text-sm tracking-widest transition-all">
                                        [ 選擇 / 重新輸入 API 金鑰 ]
                                    </button>
                                )}
                                <div className="text-[9px] text-gray-600">
                                    註：金鑰由 Google AI Studio 環境變數自動注入。
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/5 border border-neon-green/20 p-6 rounded space-y-4">
                                <div>
                                    <label className="block text-xs text-neon-green font-mono mb-2">OPENROUTER API KEY</label>
                                    <input 
                                        type="password"
                                        value={openRouterKey} 
                                        onChange={e => setOpenRouterKey(e.target.value)} 
                                        className="w-full bg-black border border-neon-green/30 p-3 text-sm outline-none focus:border-neon-green font-mono text-white" 
                                        placeholder="sk-or-v1-..." 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neon-green font-mono mb-2">MODEL ID</label>
                                    <input 
                                        type="text"
                                        value={openRouterModel} 
                                        onChange={e => setOpenRouterModel(e.target.value)} 
                                        className="w-full bg-black border border-neon-green/30 p-3 text-sm outline-none focus:border-neon-green font-mono text-white" 
                                        placeholder="e.g. anthropic/claude-3.5-sonnet" 
                                    />
                                    <div className="text-[9px] text-gray-500 mt-1">推薦使用具備長文本與 JSON 輸出能力的模型 (如 Claude 3.5, GPT-4o)。</div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button onClick={handleTestConnection} className="w-full py-3 border border-white/20 text-xs font-mono uppercase tracking-widest hover:bg-white/5">
                                [ 執行連線診斷 (TEST CONNECTION) ]
                            </button>
                            {testStatus.msg && (
                                <div className={`text-[10px] p-2 font-mono text-center ${testStatus.type === 'error' ? 'text-neon-red' : testStatus.type === 'success' ? 'text-neon-green' : 'text-neon-blue animate-pulse'}`}>
                                    {testStatus.msg}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'IDENTITY' && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <label className="block text-xs text-neon-blue font-mono mb-2">IDENTIFIER / 玩家代號</label>
                            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-black border border-neon-blue/30 p-4 text-xl outline-none focus:border-neon-blue" placeholder="輸入代號..." />
                        </div>
                        <div>
                            <label className="block text-xs text-neon-blue font-mono mb-2">SELECT FACTION / 勢力傾向</label>
                            <div className="space-y-3">
                                {FACTIONS.map(faction => (
                                    <button key={faction.id} onClick={() => setSelectedFaction(faction.id)} className={`w-full text-left p-6 border-2 transition-all relative ${selectedFaction === faction.id ? faction.colorTheme : 'border-white/10 bg-white/5 opacity-60 hover:opacity-100'}`}>
                                        <div className="font-bold text-lg">{faction.name}</div>
                                        <div className="text-xs opacity-70 mt-1">{faction.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'PROFILE' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                        <div className="space-y-4">
                            <button 
                                onClick={handleRandomizeProfile}
                                className="w-full py-2 bg-white/5 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue hover:text-black transition-all text-xs font-mono font-bold uppercase mb-2"
                            >
                                🎲 隨機生成檔案 (Randomize)
                            </button>
                            <div>
                                <label className="block text-xs text-neon-blue font-mono mb-2">GENDER / 性別</label>
                                <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-black border border-gray-700 p-3 outline-none">
                                    <option value="Male">男性 (Male)</option>
                                    <option value="Female">女性 (Female)</option>
                                    <option value="Non-binary">非二元 (Non-binary)</option>
                                    <option value="Android">仿生人 (Android)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-neon-blue font-mono mb-2">PERSONALITY / 性格關鍵字</label>
                                <input value={personality} onChange={e => setPersonality(e.target.value)} className="w-full bg-black border border-gray-700 p-3 outline-none" placeholder="冷酷、狂熱、理想主義..." />
                            </div>
                            <div>
                                <label className="block text-xs text-neon-blue font-mono mb-2">APPEARANCE / 外貌特徵</label>
                                <textarea value={appearance} onChange={e => setAppearance(e.target.value)} className="w-full bg-black border border-gray-700 p-3 h-24 outline-none resize-none" placeholder="描述你的生化植入物或著裝..."></textarea>
                            </div>
                            <button onClick={handleGenerateAvatar} disabled={isGeneratingAvatar} className="w-full py-3 border border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black transition-all text-xs font-mono uppercase">
                                {isGeneratingAvatar ? '正在合成生物特徵...' : '[ 手動生成特徵頭像 ]'}
                            </button>
                        </div>
                        <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-lg p-4">
                            <div className="w-48 h-48 border-2 border-neon-blue/30 overflow-hidden bg-black relative shadow-[0_0_20px_rgba(0,243,255,0.1)]">
                                {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-contain" alt="Avatar" /> : <div className="w-full h-full flex items-center justify-center text-gray-700 text-[10px] font-mono">等待輸入...</div>}
                                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8">
                <button 
                  onClick={handleStartClick} 
                  disabled={isLoading} 
                  className={`w-full py-5 font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,243,255,0.2)] ${isLoading ? 'bg-gray-800 text-gray-500 cursor-wait' : 'bg-neon-blue text-black hover:bg-white active:scale-95'}`}
                >
                    {isLoading ? '[ 神經傳輸中... ]' : '[ 啟動模擬 ] LAUNCH SIMULATION'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
