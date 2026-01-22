
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
  ShopItem,
  Skill,
  MyFaction,
  PsionicStatus
} from '../types';
import { GameEngine } from './GameEngine';
import { ITEMS } from '../data/rules';

// 新的敘事專用 Schema (混合模式：包含敘事性狀態)
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
    // AI 負責生成的軟數值/敘事資料
    reputation: { type: Type.STRING, description: "Text description of player's reputation" },
    factions: {
      type: Type.OBJECT,
      description: "Numeric standing with factions (-100 to 100)",
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
    // 世界觀內容
    news: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { faction: { type: Type.STRING }, status: { type: Type.STRING }, headline: { type: Type.STRING } } } },
    gossip: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: { type: Type.STRING }, content: { type: Type.STRING }, reliability: { type: Type.STRING } } } },
    chronicles: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { year: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING } } } },
    // 商店
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
  // Soft Data (AI Managed)
  reputation?: string;
  factions?: { earth: number; mars: number; belt: number; jupiter: number; saturn: number };
  skills?: Skill[];
  myFaction?: MyFaction;
  // World Data
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
你 **不可** 計算數值 (HP, Money, Date, Location 由引擎負責)。
你 **必須** 負責生成與維護「敘事性資料」：技能名稱與描述、勢力關係變化、玩家組織詳情、聲望描述。

【資料生成規則】
1. **技能 (Skills)**: 初始遊戲時，根據玩家職業生成 3-4 個特色技能 (如 "Neural Hacking", "Diplomacy", "Plasma Pistol")。之後僅在劇情需要時更新。
2. **勢力 (Factions)**: 若玩家行為取悅或冒犯某勢力，調整對應數值 (-100 ~ 100)。
3. **玩家組織 (MyFaction)**: 若玩家招募追隨者或建立組織，生成詳細的 NPC 資料與組織特權。
4. **聲望 (Reputation)**: 用一句帥氣的話描述玩家當前的名聲 (如 "Shadow of Mars", "EUG Wanted Level 5")。

【輸入格式】
1. [PLAYER STATE]: 玩家當前硬數值。
2. [SYSTEM LOG]: 剛剛發生的事件結果 (絕對事實)。

【輸出規則】
- 若 LOG 顯示失敗：描述失敗的過程與後果。
- 若 LOG 顯示成功：描述成功的細節。
- 若 LOG 顯示戰鬥/受傷：描述傷口與痛楚。
`;

export class GameService {
  private chatSession?: Chat;
  private currentConfig?: GameConfig;
  private history: { role: string; content: string }[] = [];
  private readonly TIMEOUT_MS: number = 60000;
  
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
重要：若這是遊戲開始，請務必生成初始的 'skills' (3-4個)、'factions' 數值與 'myFaction' (若適用) 初始狀態。
若有重要 NPC 互動，請更新 'myFaction' 中的 followers。
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
      return {
        description: "通訊受到干擾... (JSON Parsing Failed)",
        image_prompt: "static noise, glitch art",
        options: [{ id: 1, text: "重試訊號", action_type: "retry" }],
        news: [], gossip: [], chronicles: [], shop: null,
        skills: [], factions: undefined, reputation: "Unknown"
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
