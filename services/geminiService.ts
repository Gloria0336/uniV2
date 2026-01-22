
import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { 
  FactionDetails, 
  PlayerProfile, 
  GameConfig, 
  GameState,
  FactionNews,
  GossipItem,
  ChronicleEvent,
  GameOption,
  ShopData,
  ShopItem
} from '../types';
import { GameEngine } from './GameEngine';
import { ITEMS } from '../data/rules';

// 新的敘事專用 Schema (不包含 status)
const narrativeSchema = {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING },
    image_prompt: { type: Type.STRING },
    options: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT, 
        properties: { 
          id: { type: Type.INTEGER }, 
          text: { type: Type.STRING }, 
          action_type: { type: Type.STRING } 
        } 
      } 
    },
    // 保留世界觀內容生成，因為這屬於敘事範疇
    news: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { faction: { type: Type.STRING }, status: { type: Type.STRING }, headline: { type: Type.STRING } } } },
    gossip: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: { type: Type.STRING }, content: { type: Type.STRING }, reliability: { type: Type.STRING } } } },
    chronicles: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { year: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING } } } },
    shop: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        shopName: { type: Type.STRING },
        shopDescription: { type: Type.STRING },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              price: { type: Type.INTEGER },
              type: { type: Type.STRING }
            }
          }
        }
      }
    }
  },
  required: ["description", "image_prompt", "options"]
};

// 定義回傳介面 (對應 Schema)
export interface NarrativeResponse {
  description: string;
  image_prompt: string;
  options: GameOption[];
  news: FactionNews[];
  gossip: GossipItem[];
  chronicles: ChronicleEvent[];
  shop: ShopData | null;
}

const LORE_DATA = `
【世界觀重點】
年份：3150年。
三大勢力：
1. 地球聯合政府 (EUG): 高科技、秩序、極權。控制地球與木星。
2. 紅教 (Red Cult): 機械飛昇宗教、靈能崇拜。控制土星泰坦。
3. 自由民 (Free People): 海盜、黑客、法外之徒。控制火星與小行星帶。

【你的角色】
你不是遊戲引擎，你是「敘事者」。
你 **不可** 計算數值、**不可** 判定成功失敗。
你的任務是接收 [系統運算日誌] (FACTS)，將其改寫為沈浸式的 Cyberpunk 風格劇情。

【輸入格式】
你將收到：
1. [PLAYER STATE]: 玩家當前數值 (供敘事參考，如 "你感到疲憊" 若 HP 低)。
2. [SYSTEM LOG]: 剛剛發生的事件結果 (如 "移動到火星，扣除 200CR")。這是絕對事實，不可違背。

【輸出規則】
- 若 LOG 顯示失敗：描述失敗的過程與後果。
- 若 LOG 顯示成功：描述成功的細節。
- 若 LOG 顯示戰鬥/受傷：描述傷口與痛楚。
- Shop: 僅在玩家進入商店區域或遇見商人時生成 shop 物件。
`;

export class GameService {
  private chatSession?: Chat;
  private currentConfig?: GameConfig;
  private history: { role: string; content: string }[] = [];
  private readonly TIMEOUT_MS: number = 60000;
  private gameEngine?: GameEngine;

  constructor() {}

  private async withTimeout<T>(promise: Promise<T>): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Neural Link Timeout")), this.TIMEOUT_MS)
    );
    return Promise.race([promise, timeout]);
  }

  async testConnection(config: GameConfig): Promise<string> {
    if (config.provider === 'GEMINI') {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API_KEY_MISSING");
      const ai = new GoogleGenAI({ apiKey });
      await ai.models.generateContent({ 
        model: 'gemini-3-pro-preview', 
        contents: 'Ping',
        config: { maxOutputTokens: 10 }
      });
      return "Gemini 3 Pro Online";
    } else {
      if (!config.openRouterKey) throw new Error("OpenRouter Key Missing");
      // OpenRouter Test Implementation
      return `OpenRouter Online (Mock)`;
    }
  }

  /**
   * 初始化 AI 會話 (僅設定 Persona，不進行運算)
   */
  async startSession(playerName: string, faction: FactionDetails, profile: PlayerProfile, config: GameConfig): Promise<void> {
    this.currentConfig = config;
    const sysInstruction = `
${LORE_DATA}
玩家資料：
名稱: ${playerName}
勢力: ${faction.name}
性格: ${profile.personality}
外貌: ${profile.appearance}
`;

    if (config.provider === 'GEMINI') {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      this.chatSession = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: sysInstruction,
          responseMimeType: "application/json",
          responseSchema: narrativeSchema,
        },
      });
    } else {
      this.history = [
        { role: "system", content: sysInstruction + "\nOutput MUST be valid JSON matching the schema." }
      ];
    }
  }

  /**
   * 啟動遊戲
   */
  async startGame(name: string, faction: FactionDetails, profile: PlayerProfile, avatarUrl: string, config: GameConfig) {
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
        // shop is optional in GameState
    };

    this.gameEngine = new GameEngine(initialState);
    await this.startSession(name, faction, profile, config);

    // Initial narrative generation
    const introLog = `[SYSTEM] New Neural Link Established. Subject: ${name}. Faction: ${faction.name}. Location: ${initialState.location}.`;
    const narrative = await this.generateStory(introLog, this.gameEngine.getState());
    
    return this.mergeState(narrative);
  }

  /**
   * 處理玩家行動
   */
  async sendAction(action: string) {
      if (!this.gameEngine) throw new Error("Game Engine not initialized");
      
      let systemLog = "";
      const lower = action.toLowerCase();

      // Parsing Logic for GameEngine commands
      // Travel
      if (lower.match(/^(travel|move|前往|移動)\s+/)) {
          const dest = action.split(/\s+/).slice(1).join(' ');
          systemLog = this.gameEngine.processAction('TRAVEL', dest);
      } 
      // Rest
      else if (lower.match(/^(rest|休息)/)) {
           systemLog = this.gameEngine.processAction('REST', 1);
      } 
      // Transaction (Handle input from App.tsx handleBuyItem)
      else if (action.includes("[TRANSACTION]")) {
           // Format: [TRANSACTION] 購買物品: ITEM_NAME (價格: PRICE)
           const match = action.match(/購買物品:\s*(.*?)\s*\(/);
           if (match && match[1]) {
               const itemName = match[1].trim();
               // Find item ID by name from ITEMS data
               const entry = Object.entries(ITEMS).find(([_, item]) => item.name === itemName);
               if (entry) {
                   systemLog = this.gameEngine.processAction('TRADE', { itemId: entry[0], action: 'BUY' });
               } else {
                   systemLog = `[SYSTEM] Transaction Error: Item '${itemName}' not recognized via neural link.`;
               }
           } else if (action.includes("離開商店")) {
               systemLog = `[SYSTEM] Player exited the shop interface.`;
           }
      }

      if (!systemLog) {
          systemLog = `[USER ACTION] ${action}`;
      }

      const narrative = await this.generateStory(systemLog, this.gameEngine.getState());
      return this.mergeState(narrative);
  }

  /**
   * 生成劇情
   * @param systemLog 由 GameEngine 產生的事實日誌
   * @param currentState 當前遊戲狀態 (供 AI 參考)
   */
  async generateStory(systemLog: string, currentState: GameState): Promise<NarrativeResponse> {
    const contextPrompt = `
[PLAYER STATE]
Location: ${currentState.location}
Date: ${currentState.date}
HP: ${currentState.health}
Credits: ${currentState.credits}
AP: ${currentState.actionPoints}
Inventory: ${currentState.inventory.join(', ')}

[SYSTEM LOG]
${systemLog}

請根據以上 [SYSTEM LOG] 的結果，生成這一段的劇情描述、圖像提示與下一步選項。
`;

    if (this.currentConfig?.provider === 'GEMINI') {
      if (!this.chatSession) throw new Error("Neural Session Lost");
      const res = await this.withTimeout(this.chatSession.sendMessage({ message: contextPrompt })) as GenerateContentResponse;
      return this.parseResponse(res.text);
    } else {
      this.history.push({ role: "user", content: contextPrompt });
      return await this.callOpenRouter();
    }
  }

  private async callOpenRouter(): Promise<NarrativeResponse> {
    const config = this.currentConfig!;
    try {
      const response = await this.withTimeout(fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.openRouterKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: config.openRouterModel,
          messages: this.history,
          response_format: { type: "json_object" },
          max_tokens: 3000
        })
      }));

      if (!response.ok) throw new Error("OpenRouter Connection Error");
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      this.history.push({ role: "assistant", content });
      return this.parseResponse(content);
    } catch (e: any) {
      throw new Error(`OpenRouter Fault: ${e.message}`);
    }
  }

  private parseResponse(text: string | undefined): NarrativeResponse {
    if (!text) throw new Error("Empty Neural Transmission");
    
    let raw: any = {};
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
      raw = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON Error:", e);
      // Fallback response if JSON fails
      return {
        description: "通訊受到干擾... (JSON Parsing Failed)",
        image_prompt: "static noise, glitch art",
        options: [{ id: 1, text: "重試訊號", action_type: "retry" }],
        news: [], gossip: [], chronicles: [], shop: null
      };
    }

    // 防禦性處理
    return {
      description: String(raw.description || "資料傳輸中..."),
      image_prompt: String(raw.image_prompt || ""),
      options: Array.isArray(raw.options) ? raw.options.map((o: any) => ({
        id: Number(o?.id ?? 0),
        text: String(o?.text || "Continue"),
        action_type: String(o?.action_type || "Neutral")
      })) : [],
      news: Array.isArray(raw.news) ? raw.news : [],
      gossip: Array.isArray(raw.gossip) ? raw.gossip : [],
      chronicles: Array.isArray(raw.chronicles) ? raw.chronicles : [],
      shop: raw.shop ? {
        shopName: String(raw.shop.shopName || "Unknown Shop"),
        shopDescription: String(raw.shop.shopDescription || ""),
        items: Array.isArray(raw.shop.items) ? raw.shop.items : []
      } : null
    };
  }

  private mergeState(narrative: NarrativeResponse) {
      const state = this.gameEngine!.getState();
      return {
          ...narrative,
          status: {
              money: state.credits,
              health: state.health,
              level: state.level,
              experience: state.experience,
              actionPoints: state.actionPoints,
              freeSkillPoints: state.freeSkillPoints,
              date: state.date,
              identity: state.identity,
              inventory: state.inventory,
              factions: state.factions,
              reputation: state.reputation,
              psionics: state.psionics,
              skills: state.skills,
              myFaction: state.myFaction
          },
          current_location: state.location,
          isGameOver: state.isGameOver
      };
  }
}
