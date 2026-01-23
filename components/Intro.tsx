
import React, { useState, useEffect } from 'react';
import { FactionDetails, FACTIONS, FactionType, PlayerProfile, GameConfig, ModelProvider } from '../types';
import { GameService } from '../services/geminiService';

interface IntroProps {
  onStart: (name: string, faction: FactionDetails, profile: PlayerProfile, avatarUrl: string, config: GameConfig) => void;
  isLoading: boolean;
}

const RANDOM_PERSONALITIES = [
// === 專業與硬派 ===
  "冷酷無情的利己主義者，只在乎任務報酬。",
  "尋求真理的紅教叛徒，對神秘學有獨到見解。",
  "崇尚混亂的自由無政府主義者，喜歡破壞舊秩序。",
  "絕對理性的數據分析師，缺乏同理心但判斷精準。",
  "富有同情心的前戰地醫護，無法見死不救。",
  "偏執的科技崇拜者，認為肉體是軟弱的根源。",
  "沉默寡言的賞金獵人，信奉以牙還牙。",
  "專精於古董硬體修復的考古駭客，對現代科技嗤之以鼻。",
  "只接高難度手術的黑市牙醫，擁有令人不安的收藏癖。",
  "專門處理靈能污染現場的清潔專家，精神狀態極度不穩定。",

  // === 平凡與市井小民 ===
  "疲憊的企業基層員工，只想安穩活到退休。",
  "樂觀的街頭小販，對各路八卦瞭若指掌。",
  "負債累累的賭徒，為了還債願意冒任何風險。",
  "單純的重機械維修工，比起人類更喜歡跟機器相處。",
  "憤世嫉俗的失業記者，渴望挖掘被掩蓋的真相。",
  "謹慎的地下快遞員，信奉「不問、不看、不說」的生存哲學。",
  "剛來到大城市的鄉巴佬，對一切高科技都感到驚奇與恐懼。",
  "被裁員的前警備隊員，對體制感到徹底失望。",
  "充滿母性光輝的孤兒院院長，為了孩子們可以變得無比強悍。",

  // === 特殊與怪異 ===
  "聲稱自己被外星人綁架過的陰謀論者，隨身攜帶鋁箔紙帽。",
  "擁有多重人格的情報販子，每個人格都有不同專長。",
  "因為實驗失敗而能夠看見無線電波的科學家，總是對著空氣說話。",
  "來自火星殖民地，不適應地球重力的流亡貴族。",
  "堅信自己是個 NPC 的覺醒者，總是在尋找「玩家」。",
  "患有資訊成癮症，一分鐘不連上網路就會恐慌發作。",

  // === 搞笑與荒謬 ===
  "堅信地球是平的，即使他現在就住在太空站裡。",
  "把所有積蓄都拿去買彩券的無可救藥樂觀主義者。",
  "因為太怕痛所以把防禦點滿的膽小保鑣。",
  "只喝特定年份機油的美食家，對人類食物感到噁心。",
  "為了逃避寫稿而跑來當傭兵的網路小說家。",
  "隨身帶著一盆寵物仙人掌，並堅持它會說話。",
  "自稱是時空旅人，但預言的都是雞毛蒜皮的小事（例如明天的早餐）。"
];

const RANDOM_APPEARANCES = [
// === 賽博龐克與戰鬥風格 ===
  "左眼替換為軍用級紅色義眼，臉頰有明显的散熱排氣孔。穿著舊式飛行夾克。",
  "右臂完全機械化，手指是各種精密工具。身上沾滿了機油與鐵鏽的味道。",
  "皮膚蒼白如紙，頸部後方有顯眼的數據接口插槽。穿著漆黑的高領風衣。",
  "全身覆蓋著廉價的鉻金屬塗層，穿著霓虹色的透明塑膠雨衣。",
  "半邊臉被嚴重燒傷，用粗糙的金屬補丁遮蓋，眼神兇狠且充滿戒備。",
  "穿著全套深黑色戰術裝備，臉上戴著無法取下的軍用級夜視鏡。",
  "背部植入了巨大的機械脊椎，連接到四肢的外骨骼支架上。",

  // === 平凡生活風格 ===
  "穿著褪色的聯合礦業工作服，口袋裡塞滿了各種維修單據和油膩的抹布。",
  "外表平庸的中年人，穿著廉價的合成纖維西裝，手裡總是提著一個公事包。",
  "戴著一副厚重的光學眼鏡，穿著舒適的居家毛衣，看起來毫無威脅性。",
  "穿著印有俗氣廣告標語的便利商店制服，眼神中透露著長期的睡眠不足。",
  "脖子上掛著褪色的宗教護身符，穿著層層疊疊的舊衣物，像個流浪漢。",
  "穿著充滿口袋的戰術背心，但裡面裝的都是糖果和急救藥品，而非彈藥。",
  "一身運動裝扮，脖子上掛著高品質的耳機，隨著聽不到的音樂輕輕晃動。",
  "穿著老式的皮圍裙，雙手布滿了細小的傷痕和厚繭。",

  // === 特殊變異與科技 ===
  "看似完美的仿生人外表，但在情緒激動時，皮膚下會透出不穩定的藍光。",
  "皮膚呈現半透明狀，可以隱約看見底下的血管與發光的植入物。",
  "頭部被替換成了一台老式映像管電視，顯示著當前的心情表情符號。",
  "左半邊身體完全是植物纖維與電路交織而成的生化義肢。",
  "沒有頭髮，頭皮上佈滿了整齊的條碼刺青和二維碼。",
  "聲音是合成的電子音，喉嚨處安裝了一個發光的揚聲器。",

  // === 搞笑與搞怪 ===
  "穿著粉紅色的蓬蓬裙，但背著一把與服裝極不搭調的重型雷射加農砲。",
  "頭上戴著一個挖了洞的紙袋，上面用奇異筆寫著「帥哥」兩個字。",
  "全身掛滿了會發出怪聲的橡膠雞，聲稱這是某種聲波防禦系統。",
  "把交通錐當成帽子戴在頭上，並堅稱這是最新的防護力場產生器。",
  "穿著布偶裝（看起來像是一隻巨大的太空倉鼠）不想脫下來。",
  "為了省錢，把自己改造成了一台會走路的自動販賣機。",
  "穿著一件寫著「我愛火星」的觀光客T恤，手裡拿著地圖一臉茫然。"
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
    
    // 構建與遊戲風格一致的 Prompt
    const prompt = `cyberpunk character portrait, ${gender}, ${appearance}, ${personality}, sci-fi concept art, cinematic lighting, high detailed, 8k, seed-${Math.floor(Math.random() * 10000)}`;
    
    const newAvatar = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&model=turbo`;
    
    // 稍微延長 Loading 時間以配合圖片生成感受
    setTimeout(() => {
      setAvatarPreview(newAvatar);
      setIsGeneratingAvatar(false);
    }, 1500);
  };

  const handleRandomizeProfile = () => {
    const genders = ['Male', 'Female', 'Non-binary', 'Android'];
    const newGender = genders[Math.floor(Math.random() * genders.length)];
    const newPersonality = RANDOM_PERSONALITIES[Math.floor(Math.random() * RANDOM_PERSONALITIES.length)];
    const newAppearance = RANDOM_APPEARANCES[Math.floor(Math.random() * RANDOM_APPEARANCES.length)];

    setGender(newGender);
    setPersonality(newPersonality);
    setAppearance(newAppearance);

    setIsGeneratingAvatar(true);
    
    // 同樣使用 Pollinations 生成
    const prompt = `cyberpunk character portrait, ${newGender}, ${newAppearance}, ${newPersonality}, sci-fi concept art, cinematic lighting, high detailed, 8k, seed-${Math.floor(Math.random() * 10000)}`;
    
    const newAvatar = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&model=turbo`;
    
    setTimeout(() => {
      setAvatarPreview(newAvatar);
      setIsGeneratingAvatar(false);
    }, 1500);
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
                                {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar" /> : <div className="w-full h-full flex items-center justify-center text-gray-700 text-[10px] font-mono">等待輸入...</div>}
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
