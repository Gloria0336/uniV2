
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { getSystemLore } from '../data/lore';
import { getSkillListForPrompt } from '../data/skills';
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
          },
          requiredSkill: { 
            type: Type.STRING, 
            description: "Optional. The ID of the skill required (e.g., 'basic_hacking', 'persuasion'). Empty if no skill needed." 
          },
          difficulty: {
            type: Type.STRING,
            description: "Optional. Level: VERY_EASY, EASY, NORMAL, HARD, EXTREME"
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
          description: "Grant a new skill. MUST choose ID from the provided Skill Database.",
          properties: {
            id: { type: Type.STRING, description: "The ID of the skill from the database (e.g., 'basic_hacking')." },
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

export class GameService {
  private currentConfig?: GameConfig;
  private systemInstruction: string = "";
  private history: { role: string; content: string }[] = [];
  private readonly TIMEOUT_MS: number = 45000;
  
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

  private getGeminiApiKey(): string {
    return process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  }

  // --- OpenRouter Logic ---

  private async callOpenRouter(messages: { role: string; content: string }[], config: GameConfig, jsonSchema?: string): Promise<string> {
    if (!config.openRouterKey) throw new Error("OpenRouter API Key Missing");
    
    // Append strict JSON instruction if schema is provided (since not all OR models support response_format: json_object well)
    const finalMessages = [...messages];
    if (jsonSchema) {
        finalMessages[0].content += `\n\n[IMPORTANT] You MUST respond with valid JSON matching this schema:\n${jsonSchema}`;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.openRouterKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.openRouterModel || "anthropic/claude-3.5-sonnet",
        messages: finalMessages,
        response_format: { type: "json_object" } // Hint for models that support it
      })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter Error: ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "{}";
  }

  // --- Main Methods ---

  async testConnection(config: GameConfig): Promise<string> {
    if (config.provider === 'OPENROUTER') {
        const msg = await this.callOpenRouter(
            [{ role: 'user', content: 'Ping. Reply with "OpenRouter Online".' }],
            config
        );
        return msg;
    } else {
        const apiKey = this.getGeminiApiKey();
        if (!apiKey) throw new Error("Gemini API Key Missing");
        
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({ 
          model: 'gemini-3-flash-preview', 
          contents: 'Ping',
          config: { maxOutputTokens: 5 }
        });
        return `Gemini 3 Flash 在線`;
    }
  }

  async startSession(playerName: string, faction: FactionDetails, profile: PlayerProfile, config: GameConfig): Promise<void> {
    this.currentConfig = config;
    
    const loreData = getSystemLore(1);
    const skillList = getSkillListForPrompt();

    this.systemInstruction = `
${loreData}

【你的角色：TRPG 地下城主】
你是一個硬派賽博龐克冒險的 GM。當玩家第一次提供個人背景後，你必須：
1. **塑造身分**: 賦予玩家一個具體的「職業/身分」(generated_identity)。
2. **決定起點**: 根據身分，將其安置在合理的「起始地點」(starting_location)。
3. **分發天賦**: 在第一次回應的 \`game_events.initial_skills\` 中，提供 3 個與該職業高度相關的初始技能。

【標準技能庫】
在發放 \`initial_skills\` 或 \`new_skill\` 時，**必須**從以下列表中選擇，並填入正確的 \`id\`。
若玩家行為符合某技能特徵，請優先使用此列表中的技能。

${skillList}

【開場指南】
不要只是說「歡迎來到 3150 年」。請描述一個具體的、感官強烈的場景，讓玩家直接以該職業身分融入。
**請務必使用「繁體中文」進行所有文字生成。**

【連貫性協議】
1. **選項引導**: 每個選項 (GameOption) 必須包含 'action_type' 與 'ap_cost'。
2. **語系限制**: 嚴禁使用英文回傳描述，除非是專業術語。
3. **勢力動態**: 你可以根據劇情進展更新各大勢力的成員數量與全球影響力 (world_factions)。

【技能檢定規則】
當玩家想要執行有風險的行動（如駭入、談判、偷竊、戰鬥特技）時，必須在 options 中指定 requiredSkill 與 difficulty。
不要自己判定成功或失敗，請等待下一回合系統回傳的 [SYSTEM] 技能檢定結果，再根據結果描述劇情。
若系統回傳「失敗」，請描述負面後果（受傷、關係惡化、被發現）；若「成功」，則描述順利完成。

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
AP: ${currentState.actionPoints} / 5
CREDITS: ${currentState.credits}
INV: ${currentState.inventory.join(', ')}

[ACTION]
${systemLog}

[REQ]
${specialRequests}
`;
    let responseText = "{}";

    if (this.currentConfig?.provider === 'OPENROUTER') {
        // Prepare messages for OpenRouter (System + History + User)
        const messages = [
            { role: "system", content: this.systemInstruction },
            ...this.history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.content })),
            { role: "user", content: contextPrompt }
        ];

        // Manually stringify the schema for OpenRouter prompt injection
        const schemaString = JSON.stringify(narrativeSchema, null, 2);
        
        responseText = await this.withTimeout(
            this.callOpenRouter(messages, this.currentConfig, schemaString)
        );

    } else {
        // Standard Gemini Flow
        const apiKey = this.getGeminiApiKey();
        const ai = new GoogleGenAI({ apiKey });
        
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

        responseText = response.text || "{}";
    }

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
      console.error("JSON Parse Error:", e, "Raw Text:", text);
      throw new Error("神經訊號解析失敗 (JSON Error)");
    }
  }
}

function healthText(hp: number) {
    if (hp > 80) return "良好";
    if (hp > 40) return "受損";
    return "危急";
}
