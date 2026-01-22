
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
  GameEvents,
  ActionCategory
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
          action_type: { 
            type: Type.STRING,
            description: "Must be one of: TALK, MOVE_SHORT, MOVE_LONG, COMBAT, ACTION, REST"
          },
          ap_cost: {
            type: Type.INTEGER,
            description: "The amount of Action Points consumed by this choice."
          }
        },
        required: ["id", "text", "action_type", "ap_cost"]
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
        },
        initial_skills: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              type: { type: Type.STRING },
              description: { type: Type.STRING },
              level: { type: Type.INTEGER },
              maxLevel: { type: Type.INTEGER }
            }
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
  myFaction?: MyFaction;
  news: FactionNews[];
  gossip: GossipItem[];
  chronicles: ChronicleEvent[];
  shop: ShopData | null;
}

const LORE_DATA = `
【世界觀重點】
年份：3150年。
三大勢力：EUG (地球木星/秩序)、紅教 (土星/靈能)、自由民 (火星帶/法外)。

【你的角色】
你不是遊戲引擎，你是「敘事者」。
你必須根據 [SYSTEM LOG] 生成劇情，並為玩家提供下一步的選項 (options)。
**請務必使用「繁體中文」進行所有文字生成。**

【連貫性協議 (Continuity Protocol)】
1. **互動鎖定**: 若 System Log 中標註了 \`[CONSTRAINT] 鎖定對象\`，你的敘事範圍必須僅侷限於該對象。
2. **禁止漂移**: 禁止在鎖定狀態下讓新角色突然插話、禁止切換場景、禁止忽視當前對象的對話內容。
3. **選項引導**: 當玩家鎖定對象時，生成的 \`options\` 應以該對象的深度互動為主（如：追問細節、反駁論點、進行交易等），除非玩家指令明確表示要「離開」。

【行動與 AP 定價規則】
每個選項 (GameOption) 必須包含 'action_type' 與 'ap_cost'。請遵循以下定價邏輯：
1. **免費行動 (ap_cost: 0)**: TALK (詢問、閒聊)、MOVE_SHORT (同區域移動)。
2. **消耗性行動 (ap_cost: 1~2)**: MOVE_LONG (跨星球)、COMBAT (戰鬥)、ACTION (高難度技術工作)。
3. **恢復行動 (ap_cost: 0)**: REST (休息)。

【資料生成規則】
1. **語言**: 文字必須為 **繁體中文**。
2. **選項 (Options)**: 必須回傳 id, text, action_type, ap_cost。數量 3-5 個。
`;

export class GameService {
  private currentConfig?: GameConfig;
  private systemInstruction: string = "";
  private history: { role: string; content: string }[] = [];
  private readonly TIMEOUT_MS: number = 30000; 
  private readonly MAX_HISTORY_LENGTH: number = 10;
  
  constructor() {}

  private async withTimeout<T>(promise: Promise<T>, retries = 1): Promise<T> {
    const attempt = async (remaining: number): Promise<T> => {
      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("連線延遲過高")), this.TIMEOUT_MS)
        );
        return await Promise.race([promise, timeout]);
      } catch (error) {
        if (remaining > 0) {
          console.warn(`連線不穩定，正在重試... (剩餘 ${remaining} 次)`);
          await new Promise(r => setTimeout(r, 1000)); 
          return attempt(remaining - 1);
        }
        throw error;
      }
    };
    return attempt(retries);
  }

  async testConnection(config: GameConfig): Promise<string> {
    if (config.provider === 'GEMINI') {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API_KEY_MISSING");
      const ai = new GoogleGenAI({ apiKey });
      const t0 = performance.now();
      await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: 'Ping',
        config: { maxOutputTokens: 5 }
      });
      const latency = Math.round(performance.now() - t0);
      return `Gemini 3 Flash 在線 (${latency}ms)`;
    } else {
      if (!config.openRouterKey) throw new Error("OpenRouter 金鑰缺失");
      return `OpenRouter 在線 (Mock)`;
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
回傳格式必須為符合 Schema 的 JSON。請務必使用繁體中文。
`;
    this.history = [];
  }

  private getContextWindow(newPrompt: string): { role: string; content: string }[] {
    const recentHistory = this.history.slice(-this.MAX_HISTORY_LENGTH);
    return [...recentHistory, { role: 'user', content: newPrompt }];
  }

  async generateStory(systemLog: string, currentState: GameState, specialRequests: string = ""): Promise<NarrativeResponse> {
    const contextPrompt = `
[PLAYER STATE]
當前位置: ${currentState.location}
日期: ${currentState.date}
生命值: ${currentState.health}
信用點: ${currentState.credits}
行動點 (AP): ${currentState.actionPoints}
庫存: ${currentState.inventory.join(', ')}

[SYSTEM LOG]
${systemLog}

[SYSTEM REQUEST]
${specialRequests || "無。請保持敘事集中。"}

請根據 [SYSTEM LOG] 以繁體中文生成劇情。
`;

    const contextMessages = this.getContextWindow(contextPrompt);
    let responseText = "";

    if (this.currentConfig?.provider === 'GEMINI') {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const geminiContents = contextMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const response = await this.withTimeout(ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: this.systemInstruction,
          responseMimeType: "application/json",
          responseSchema: narrativeSchema,
        },
        contents: geminiContents
      })) as GenerateContentResponse;

      responseText = response.text || "{}";
    } else {
      const openRouterMessages = [
        { role: 'system', content: this.systemInstruction + "\n回傳格式必須為符合 Schema 的 JSON，且使用繁體中文。" },
        ...contextMessages
      ];
      responseText = await this.callOpenRouter(openRouterMessages);
    }

    this.history.push({ role: 'user', content: contextPrompt });
    const parsed = this.parseResponse(responseText);
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

      if (!response.ok) throw new Error("OpenRouter 連線錯誤");
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "{}";
    } catch (e: any) {
      throw new Error(`OpenRouter 故障: ${e.message}`);
    }
  }

  private parseResponse(text: string | undefined): NarrativeResponse {
    if (!text) throw new Error("神經傳輸為空");
    let raw: any = {};
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
      raw = JSON.parse(cleaned);
    } catch (e) {
      return {
        description: "通訊受到干擾...",
        image_prompt: "noise",
        options: [{ id: 1, text: "重試訊號", action_type: "TALK", ap_cost: 0 }],
        news: [], gossip: [], chronicles: [], shop: null
      };
    }

    return {
      description: String(raw.description || "資料傳輸中..."),
      image_prompt: String(raw.image_prompt || ""),
      options: Array.isArray(raw.options) ? raw.options.map((o: any) => ({
        id: Number(o?.id ?? 0),
        text: String(o?.text || "繼續"),
        action_type: (o?.action_type || "TALK") as ActionCategory,
        ap_cost: Number(o?.ap_cost ?? 0)
      })) : [],
      game_events: raw.game_events,
      reputation: raw.reputation,
      factions: raw.factions,
      myFaction: raw.myFaction,
      news: Array.isArray(raw.news) ? raw.news : [],
      gossip: Array.isArray(raw.gossip) ? raw.gossip : [],
      chronicles: Array.isArray(raw.chronicles) ? raw.chronicles : [],
      shop: raw.shop ? {
        shopName: String(raw.shop.shopName || "未知商店"),
        shopDescription: String(raw.shop.shopDescription || ""),
        items: Array.isArray(raw.shop.items) ? raw.shop.items : []
      } : null
    };
  }
}
