
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
  ActionCategory,
  FactionWorldStatus
} from '../types';

// 更新後的敘事專用 Schema，新增身份、初始地點與全球勢力數據
const narrativeSchema = {
  type: Type.OBJECT,
  properties: {
    generated_identity: { 
      type: Type.STRING, 
      description: "AI 為玩家決定的一個帥氣職業名稱（例如：企業特工、非法駭客、紅教苦修士等）。"
    },
    starting_location: {
      type: Type.STRING,
      description: "根據玩家職業決定的合適出發星球或地點名稱（必須存在於遊戲星圖中，如 Earth, Mars, Saturn, Jupiter, Belt, Luna）。"
    },
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
            type: Type.INTEGER
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
    world_factions: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        EUG: { type: Type.OBJECT, properties: { members: { type: Type.NUMBER }, influence: { type: Type.NUMBER } } },
        RED_CULT: { type: Type.OBJECT, properties: { members: { type: Type.NUMBER }, influence: { type: Type.NUMBER } } },
        FREE_PEOPLE: { type: Type.OBJECT, properties: { members: { type: Type.NUMBER }, influence: { type: Type.NUMBER } } }
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
  required: ["description", "image_prompt", "options", "generated_identity", "starting_location"]
};

export interface NarrativeResponse {
  generated_identity: string;
  starting_location: string;
  description: string;
  image_prompt: string;
  options: GameOption[];
  game_events?: GameEvents;
  world_factions?: {
    EUG: FactionWorldStatus;
    RED_CULT: FactionWorldStatus;
    FREE_PEOPLE: FactionWorldStatus;
  };
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

【你的角色：TRPG 地下城主】
你是一個硬派賽博龐克冒險的 GM。當玩家第一次提供個人背景後，你必須：
1. **塑造身分**: 賦予玩家一個具體的「職業/身分」(generated_identity)。
2. **決定起點**: 根據身分，將其安置在合理的「起始地點」(starting_location)。
3. **分發天賦**: 在第一次回應的 \`game_events.initial_skills\` 中，提供 3 個與該職業高度相關的初始技能。

【開場指南】
不要只是說「歡迎來到 3150 年」。請描述一個具體的、感官強烈的場景，讓玩家直接以該職業身分融入。
**請務必使用「繁體中文」進行所有文字生成。**

【連貫性協議】
1. **選項引導**: 每個選項 (GameOption) 必須包含 'action_type' 與 'ap_cost'。
2. **語系限制**: 嚴禁使用英文回傳描述，除非是專業術語。
3. **勢力動態**: 你可以根據劇情進展更新各大勢力的成員數量與全球影響力 (world_factions)。
`;

export class GameService {
  private currentConfig?: GameConfig;
  private systemInstruction: string = "";
  private history: { role: string; content: string }[] = [];
  private readonly TIMEOUT_MS: number = 45000; // 初始載入可能較久
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
          await new Promise(r => setTimeout(r, 1500)); 
          return attempt(remaining - 1);
        }
        throw error;
      }
    };
    return attempt(retries);
  }

  async testConnection(config: GameConfig): Promise<string> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY_MISSING");
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: 'Ping',
      config: { maxOutputTokens: 5 }
    });
    return `Gemini 3 Flash 在線`;
  }

  async startSession(playerName: string, faction: FactionDetails, profile: PlayerProfile, config: GameConfig): Promise<void> {
    this.currentConfig = config;
    this.systemInstruction = `
${LORE_DATA}
玩家資料：
名稱: ${playerName}
所屬大勢力: ${faction.name}
性格特質: ${profile.personality}
外貌描述: ${profile.appearance}
`;
    this.history = [];
  }

  async generateStory(systemLog: string, currentState: GameState, specialRequests: string = ""): Promise<NarrativeResponse> {
    const contextPrompt = `
[STATE]
LOC: ${currentState.location}
HP: ${healthText(currentState.health)}
CREDITS: ${currentState.credits}
INV: ${currentState.inventory.join(', ')}

[ACTION]
${systemLog}

[REQ]
${specialRequests}
`;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const geminiContents = this.history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    geminiContents.push({ role: 'user', parts: [{ text: contextPrompt }] });

    const response = await this.withTimeout(ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: this.systemInstruction,
        responseMimeType: "application/json",
        responseSchema: narrativeSchema,
      },
      contents: geminiContents
    })) as GenerateContentResponse;

    const responseText = response.text || "{}";
    const parsed = this.parseResponse(responseText);
    
    this.history.push({ role: 'user', content: contextPrompt });
    this.history.push({ role: 'model', content: parsed.description });

    return parsed;
  }

  private parseResponse(text: string): NarrativeResponse {
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
      const raw = JSON.parse(cleaned);
      return {
        generated_identity: raw.generated_identity || "獨立操作員",
        starting_location: raw.starting_location || "Earth",
        description: raw.description || "傳輸失敗...",
        image_prompt: raw.image_prompt || "cyberpunk space station",
        options: Array.isArray(raw.options) ? raw.options : [],
        game_events: raw.game_events,
        world_factions: raw.world_factions,
        reputation: raw.reputation,
        factions: raw.factions,
        myFaction: raw.myFaction,
        news: raw.news || [],
        gossip: raw.gossip || [],
        chronicles: raw.chronicles || [],
        shop: raw.shop || null
      };
    } catch (e) {
      throw new Error("神經訊號解析失敗。");
    }
  }
}

function healthText(hp: number) {
    if (hp > 80) return "良好";
    if (hp > 40) return "受損";
    return "危急";
}
