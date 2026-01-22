
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
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
  ShopItem,
  Skill,
  MyFaction,
  PsionicStatus,
  GameEvents
} from '../types';

// 新的敘事專用 Schema
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
    game_events: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        xp_gain: { type: Type.INTEGER },
        hp_change: { type: Type.INTEGER },
        reputation_change: { 
          type: Type.OBJECT,
          properties: {
            earth: { type: Type.INTEGER },
            mars: { type: Type.INTEGER },
            belt: { type: Type.INTEGER },
            jupiter: { type: Type.INTEGER },
            saturn: { type: Type.INTEGER }
          }
        },
        new_item: { type: Type.STRING },
        new_skill: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      }
    },
    reputation: { type: Type.STRING },
    factions: {
      type: Type.OBJECT,
      properties: {
        earth: { type: Type.INTEGER },
        mars: { type: Type.INTEGER },
        belt: { type: Type.INTEGER },
        jupiter: { type: Type.INTEGER },
        saturn: { type: Type.INTEGER }
      }
    },
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          level: { type: Type.INTEGER },
          maxLevel: { type: Type.INTEGER },
          description: { type: Type.STRING },
          type: { type: Type.STRING },
          progress: { type: Type.INTEGER }
        }
      }
    },
    myFaction: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        name: { type: Type.STRING },
        level: { type: Type.INTEGER },
        members: { type: Type.INTEGER },
        influence: { type: Type.INTEGER },
        resources: { type: Type.INTEGER },
        description: { type: Type.STRING },
        perks: { type: Type.ARRAY, items: { type: Type.STRING } },
        followers: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              role: { type: Type.STRING },
              level: { type: Type.INTEGER },
              status: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        }
      }
    },
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

// 定義回傳介面
export interface NarrativeResponse {
  description: string;
  image_prompt: string;
  options: GameOption[];
  game_events?: GameEvents;
  reputation?: string;
  factions?: { earth: number; mars: number; belt: number; jupiter: number; saturn: number };
  skills?: Skill[];
  myFaction?: MyFaction;
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
你 **不可** 計算日誌與金錢 (由 Engine 負責)。
你 **必須** 負責生成「敘事性資料」與「遊戲事件」。

【遊戲事件 (Game Events)】
當劇情涉及以下情況時，請使用 'game_events' 物件回傳數值變更，而不要直接修改 status：
1. **經驗值 (xp_gain)**: 戰鬥勝利 (+20~50)、任務完成 (+100)、發現新地點 (+10)。
2. **生命變化 (hp_change)**: 戰鬥受傷 (負數，如 -15)、醫療事件 (正數)。
3. **物品獲得 (new_item)**: 探索發現或 NPC 贈送。
4. **技能習得 (new_skill)**: 劇情觸發學習新能力。
5. **勢力變更 (reputation_change)**: 使用 keys: earth, mars, belt, jupiter, saturn。

【資料生成規則】
1. **技能 (Skills)**: 初始遊戲時，根據玩家職業生成 3-4 個特色技能。
2. **聲望 (Reputation)**: 用一句帥氣的話描述玩家當前的名聲。

【輸入格式】
1. [PLAYER STATE]: 玩家當前硬數值。
2. [SYSTEM LOG]: 剛剛發生的事件結果 (絕對事實)。
`;

export class GameService {
  private currentConfig?: GameConfig;
  private systemInstruction: string = "";
  // 保存對話歷史 (純粹的 User/Model 對話，不含 System)
  private history: { role: string; content: string }[] = [];
  private readonly TIMEOUT_MS: number = 60000;
  // 設定最大保留的對話回合數 (10 則訊息 = 5 回合)
  private readonly MAX_HISTORY_LENGTH: number = 10;
  
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
      return `OpenRouter Online (Mock)`;
    }
  }

  async startSession(playerName: string, faction: FactionDetails, profile: PlayerProfile, config: GameConfig): Promise<void> {
    this.currentConfig = config;
    this.systemInstruction = `
${LORE_DATA}
玩家資料：
名稱: ${playerName}
勢力: ${faction.name}
性格: ${profile.personality}
外貌: ${profile.appearance}
回傳格式必須為符合 Schema 的 JSON。
`;
    // 重置歷史紀錄
    this.history = [];
  }

  /**
   * 取得裁切後的 Context Window
   * 包含最近的 N 則訊息 + 當前最新的 User Prompt
   */
  private getContextWindow(newPrompt: string): { role: string; content: string }[] {
    // 1. 取得最近的歷史紀錄 (Pruning)
    const recentHistory = this.history.slice(-this.MAX_HISTORY_LENGTH);
    
    // 2. 如果有被裁切掉的訊息，這裡可以選擇是否插入摘要 (目前先略過，保持簡潔)
    
    // 3. 加入最新的 User Prompt
    return [...recentHistory, { role: 'user', content: newPrompt }];
  }

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

請根據 [SYSTEM LOG] 生成劇情。
若發生戰鬥、受傷或獲得獎勵，請務必填寫 game_events 欄位。
`;

    // 取得裁切後的上下文
    const contextMessages = this.getContextWindow(contextPrompt);

    let responseText = "";

    if (this.currentConfig?.provider === 'GEMINI') {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      // 轉換格式符合 Gemini Content 結構
      const geminiContents = contextMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const response = await this.withTimeout(ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: this.systemInstruction,
          responseMimeType: "application/json",
          responseSchema: narrativeSchema,
        },
        contents: geminiContents
      })) as GenerateContentResponse;

      responseText = response.text || "{}";

    } else {
      // OpenRouter Logic
      const openRouterMessages = [
        { role: 'system', content: this.systemInstruction + "\nOutput MUST be valid JSON." },
        ...contextMessages
      ];

      responseText = await this.callOpenRouter(openRouterMessages);
    }

    // 成功後，將這次的對話存入歷史紀錄 (Full History)
    // 注意：這裡存的是原始 Prompt 與 Response，下一次呼叫時 getContextWindow 會自動裁切
    this.history.push({ role: 'user', content: contextPrompt });
    
    // 嘗試解析回應，若解析成功則將回應也存入歷史
    const parsed = this.parseResponse(responseText);
    
    // 儲存 AI 的回應到歷史，讓它記得自己說過什麼
    this.history.push({ role: 'model', content: parsed.description });

    return parsed;
  }

  private async callOpenRouter(messages: any[]): Promise<string> {
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
          messages: messages,
          response_format: { type: "json_object" },
          max_tokens: 3000
        })
      }));

      if (!response.ok) throw new Error("OpenRouter Connection Error");
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "{}";
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
      return {
        description: "通訊受到干擾... (JSON Parsing Failed)",
        image_prompt: "static noise, glitch art",
        options: [{ id: 1, text: "重試訊號", action_type: "retry" }],
        news: [], gossip: [], chronicles: [], shop: null,
        skills: [], factions: undefined, reputation: "Unknown", game_events: undefined
      };
    }

    return {
      description: String(raw.description || "資料傳輸中..."),
      image_prompt: String(raw.image_prompt || ""),
      options: Array.isArray(raw.options) ? raw.options.map((o: any) => ({
        id: Number(o?.id ?? 0),
        text: String(o?.text || "Continue"),
        action_type: String(o?.action_type || "Neutral")
      })) : [],
      game_events: raw.game_events,
      // Soft Data Handling
      reputation: raw.reputation,
      factions: raw.factions,
      skills: Array.isArray(raw.skills) ? raw.skills : undefined,
      myFaction: raw.myFaction,
      // World Data
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
}
