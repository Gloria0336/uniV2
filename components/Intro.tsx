
import React, { useState, useEffect } from 'react';
import { FactionDetails, FACTIONS, FactionType, PlayerProfile, GameConfig, ModelProvider } from '../types';
import { GameService } from '../services/geminiService';

interface IntroProps {
  onStart: (name: string, faction: FactionDetails, profile: PlayerProfile, avatarUrl: string, config: GameConfig) => void;
  isLoading: boolean;
}

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
    if (window.aistudio) {
      window.aistudio.hasSelectedApiKey().then(setHasGeminiKey);
    }
  }, []);

  const handleSelectGeminiKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasGeminiKey(true);
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
      {/* Loading Overlay within Intro during initial setup */}
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
                        <div className="bg-white/5 border border-neon-blue/20 p-6 rounded text-center space-y-4">
                            <p className="text-xs text-gray-400">系統核心將使用 Gemini 3 Flash Preview 進行決策與敘事生成。</p>
                            <button onClick={handleSelectGeminiKey} className={`px-6 py-3 border rounded font-mono text-sm tracking-widest transition-all ${hasGeminiKey ? 'border-neon-green text-neon-green bg-neon-green/10' : 'border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black'}`}>
                                {hasGeminiKey ? '[ 金鑰已就緒 ]' : '[ 選擇 API 金鑰 ]'}
                            </button>
                            <div className="text-[9px] text-gray-600">
                                註：此過程完全安全，金鑰僅儲存於本地會話中。
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button onClick={handleTestConnection} className="w-full py-3 border border-white/20 text-xs font-mono uppercase tracking-widest hover:bg-white/5">
                                [ 驗證神經鏈接 ]
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
                                {isGeneratingAvatar ? '正在合成生物特徵...' : '[ 生成特徵頭像 ]'}
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
