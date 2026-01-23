
import { Skill } from '../types';

export interface SkillTemplate {
  id: string;
  name: string;
  type: 'INNATE' | 'PSIONIC' | 'TECH' | 'LEADERSHIP';
  maxLevel: number;
  description: string;
}

export const SKILL_DATABASE: Record<string, SkillTemplate> = {
  // === INNATE (天賦/體能) ===
  'kinetic_weapons': {
    id: 'kinetic_weapons',
    name: '動能武器精通',
    type: 'INNATE',
    maxLevel: 12,
    description: '提升使用實彈槍械的命中率與傷害，並能保養槍枝。'
  },
  'survival_instinct': {
    id: 'survival_instinct',
    name: '生存直覺',
    type: 'INNATE',
    maxLevel: 12,
    description: '在危險環境中減少生命值流失，並能察覺埋伏。'
  },
  'stealth_ops': {
    id: 'stealth_ops',
    name: '隱密行動',
    type: 'INNATE',
    maxLevel: 10,
    description: '降低被敵人或監視系統發現的機率。'
  },
  'close_combat': {
    id: 'close_combat',
    name: '近身格鬥',
    type: 'INNATE',
    maxLevel: 10,
    description: '提升徒手或近戰武器的戰鬥效能。'
  },

  // === TECH (科技/駭客) ===
  'basic_hacking': {
    id: 'basic_hacking',
    name: '基礎駭入',
    type: 'TECH',
    maxLevel: 10,
    description: '能破解民用級電子鎖與基礎終端機。'
  },
  'cyber_warfare': {
    id: 'cyber_warfare',
    name: '網路戰協議',
    type: 'TECH',
    maxLevel: 10,
    description: '針對敵方義體進行干擾，或入侵軍用級系統。'
  },
  'engineering': {
    id: 'engineering',
    name: '工程維修',
    type: 'TECH',
    maxLevel: 9,
    description: '修復損壞的設備、無人機或太空船組件。'
  },
  'drone_control': {
    id: 'drone_control',
    name: '無人機操作',
    type: 'TECH',
    maxLevel: 10,
    description: '能同時控制多台偵查或攻擊型無人機。'
  },

  // === LEADERSHIP (社交/領導) ===
  'persuasion': {
    id: 'persuasion',
    name: '談判技巧',
    type: 'LEADERSHIP',
    maxLevel: 10,
    description: '在對話中開啟更多選項，獲取情報或殺價。'
  },
  'intimidation': {
    id: 'intimidation',
    name: '威嚇',
    type: 'LEADERSHIP',
    maxLevel: 8,
    description: '強迫弱小的敵人投降或交出物資。'
  },
  'command': {
    id: 'command',
    name: '戰術指揮',
    type: 'LEADERSHIP',
    maxLevel: 10,
    description: '提升隊友或追隨者(Followers)的行動效率。'
  },
  'underworld_contacts': {
    id: 'underworld_contacts',
    name: '地下人脈',
    type: 'LEADERSHIP',
    maxLevel: 5,
    description: '在黑市或自由民據點更容易獲得稀有物資。'
  },

  // === PSIONIC (靈能 - 3150年稀有能力) ===
  'telepathy': {
    id: 'telepathy',
    name: '心靈感應',
    type: 'PSIONIC',
    maxLevel: 12,
    description: '能感知附近生物的情緒波動，高等級可讀取淺層思維。'
  },
  'telekinesis': {
    id: 'telekinesis',
    name: '念力移物',
    type: 'PSIONIC',
    maxLevel: 8,
    description: '使用意念移動物體，高等級可作為攻擊手段。'
  },
  'precognition': {
    id: 'precognition',
    name: '預知',
    type: 'PSIONIC',
    maxLevel: 5,
    description: '偶爾能看見短暫的未來片段，提升閃避致命傷的機率。'
  },
  'mind_blast': {
    id: 'mind_blast',
    name: '心靈震爆',
    type: 'PSIONIC',
    maxLevel: 8,
    description: '釋放靈能衝擊波，暈眩或傷害範圍內的敵人。'
  },
  // === EUG (地球聯合政府) 風格 - 秩序與官僚 ===
  'corporate_etiquette': {
    id: 'corporate_etiquette',
    name: '企業禮儀',
    type: 'LEADERSHIP',
    maxLevel: 6,
    description: '熟知 EUG 官僚體系與潛規則，能進入受管制的行政區或獲取官方情報。'
  },
  'surveillance_ops': {
    id: 'surveillance_ops',
    name: '監控分析',
    type: 'TECH',
    maxLevel: 4,
    description: '能駭入治安監視器(CCTV)並分析人流數據，或反向追蹤監視者。'
  },
  'legal_loophole': {
    id: 'legal_loophole',
    name: '法律漏洞',
    type: 'LEADERSHIP',
    maxLevel: 10,
    description: '利用聯合政府繁瑣的法條來規避檢查或罰款。'
  },

  // === RED CULT (紅教) 風格 - 肉體與機械信仰 ===
  'cyber_liturgy': {
    id: 'cyber_liturgy',
    name: '機械聖禮',
    type: 'TECH',
    maxLevel: 3,
    description: '結合維修與儀式的技術，能奇蹟般地修復被認定「已死」的機械或義體。'
  },
  'pain_tolerance': {
    id: 'pain_tolerance',
    name: '痛苦耐受',
    type: 'INNATE',
    maxLevel: 7,
    description: '紅教苦修士的必修課。在生命值極低時不會陷入昏迷或恐慌，反而提升專注。'
  },
  'cult_propaganda': {
    id: 'cult_propaganda',
    name: '教義佈道',
    type: 'LEADERSHIP',
    maxLevel: 8,
    description: '使用宗教語言煽動人群，或在紅教領地(土星)獲得信徒的庇護。'
  },

  // === FREE PEOPLE (自由民) 風格 - 生存與非法 ===
  'jerry_rigging': {
    id: 'jerry_rigging',
    name: '土法改裝',
    type: 'TECH',
    maxLevel: 6,
    description: '使用廢料拼湊出臨時工具或武器，雖然不穩定但能解決燃眉之急。'
  },
  'smugglers_path': {
    id: 'smugglers_path',
    name: '走私路徑',
    type: 'INNATE',
    maxLevel: 10,
    description: '熟知太陽系中的非官方航道，能在移動(Travel)時減少燃料消耗或避開巡邏。'
  },
  'black_market_trading': {
    id: 'black_market_trading',
    name: '黑市交易',
    type: 'LEADERSHIP',
    maxLevel: 8,
    description: '在小行星帶或火星低層區交易時，能辨識贗品並獲得更好價格。'
  },
// === 環境適應 ===
  'zero_g_maneuver': {
    id: 'zero_g_maneuver',
    name: '零重力機動',
    type: 'INNATE',
    maxLevel: 5,
    description: '在失重環境下戰鬥或行動時不受懲罰，甚至能利用反作用力進行突襲。'
  },
  'radiation_resistance': {
    id: 'radiation_resistance',
    name: '輻射適應',
    type: 'INNATE',
    maxLevel: 6,
    description: '經過基因調整，能長時間暴露在反應爐洩漏或宇宙射線強烈的區域。'
  },

  // === 義體相關 ===
  'cyber_compatibility': {
    id: 'cyber_compatibility',
    name: '義體適性',
    type: 'INNATE',
    maxLevel: 10,
    description: '降低安裝高階義體時的排斥反應(賽博精神病風險)，並提升義體效能。'
  },
  'data_mining': {
    id: 'data_mining',
    name: '數據挖掘',
    type: 'TECH',
    maxLevel: 8,
    description: '從損毀的硬碟或加密晶片中還原破碎的歷史資料或座標。'
  },
'technomancy': {
    id: 'technomancy',
    name: '機械通靈 (Technomancy)',
    type: 'PSIONIC',
    maxLevel: 2,
    description: '無需介面，直接透過靈能與機器溝通。能安撫暴走的 AI 或強制關閉砲塔。'
  },
  'entropy_touch': {
    id: 'entropy_touch',
    name: '熵增之觸',
    type: 'PSIONIC',
    maxLevel: 2,
    description: '加速物質的衰變。能讓金屬瞬間鏽蝕、電子鎖短路或肉體老化。'
  },
  'mental_shroud': {
    id: 'mental_shroud',
    name: '心靈帷幕',
    type: 'PSIONIC',
    maxLevel: 5,
    description: '扭曲周圍光線與認知，讓自己在敵人的感知中變得「不重要」，達成偽裝效果。'
  },
  'combat_precognition': {
    id: 'combat_precognition',
    name: '戰鬥預知',
    type: 'PSIONIC',
    maxLevel: 7,
    description: '在對手扣下板機前0.5秒預見彈道。極大幅度提升閃避率。'
  },
'ancient_tech_knowledge': {
    id: 'ancient_tech_knowledge',
    name: '舊時代考古',
    type: 'TECH',
    maxLevel: 6,
    description: '辨識 21 世紀(古地球時代)的遺跡物品，這在收藏家眼中價值連城。'
  },
  'gambling': {
    id: 'gambling',
    name: '賭博直覺',
    type: 'INNATE',
    maxLevel: 3,
    description: '在賭局中計算機率，或看穿對手的微表情。'
  },
  'xenobiology': {
    id: 'xenobiology',
    name: '異星生物學',
    type: 'TECH',
    maxLevel: 4,
    description: '了解泰坦星或木衛二冰層下的原生微生物/異種，能萃取毒素或藥劑。'
  },
// === EUG (地球聯合政府) 擴充技能 ===
  'verbal_persuasion': {
    id: 'verbal_persuasion',
    name: '言語說服',
    type: 'LEADERSHIP',
    maxLevel: 8,
    description: '透過氣場與社交能力說服他人，更容易獲得情報或是獲得通行權。'
  },
  'tactical_support': {
    id: 'tactical_support',
    name: '戰術支援',
    type: 'LEADERSHIP',
    maxLevel: 6,
    description: '利用官方權限，呼叫武裝部隊或無人機進行火力支援。'
  },

  // === RED CULT (紅教) 擴充技能 ===
  'miracle': {
    id: 'miracle',
    name: '神蹟',
    type: 'PSIONIC', // 歸類為靈能/神秘系
    maxLevel: 1,
    description: '【極稀有】信仰的極致具現。做出任何判定行動時，可消耗此技能直接視為「大成功」。'
  },

  // === FREE PEOPLE (自由民) 擴充技能 ===
  'advanced_piloting': {
    id: 'advanced_piloting',
    name: '高級駕駛',
    type: 'TECH',
    maxLevel: 10,
    description: '超越極限的駕駛技巧。大幅縮短星際移動時間，在追擊戰或逃脫時擁有壓倒性優勢。'
  }
};

/**
 * 透過 ID 或名稱建立技能實例。
 * 如果找不到對應的 ID，則會嘗試比對 Name。
 * 若都找不到，則回傳 null (或可選擇回傳一個通用 fallback)。
 */
export function createSkill(identifier: string): Skill | null {
  if (!identifier) return null;

  const normalizedId = identifier.toLowerCase().trim();
  
  // 1. 嘗試直接用 ID 查找
  if (SKILL_DATABASE[normalizedId]) {
    const template = SKILL_DATABASE[normalizedId];
    return {
      ...template,
      level: 1,
      progress: 0
    };
  }

  // 2. 嘗試用 Name 查找 (反向搜尋)
  const entry = Object.values(SKILL_DATABASE).find(s => s.name === identifier || s.name.includes(identifier));
  if (entry) {
    return {
      ...entry,
      level: 1,
      progress: 0
    };
  }

  return null;
}

/**
 * 生成給 AI Prompt 使用的技能列表字串
 */
export function getSkillListForPrompt(): string {
  let output = "";
  const categories = ['INNATE', 'TECH', 'LEADERSHIP', 'PSIONIC'];
  
  categories.forEach(cat => {
    output += `\n[${cat}]:\n`;
    Object.values(SKILL_DATABASE)
      .filter(s => s.type === cat)
      .forEach(s => {
        output += `- ID: ${s.id} | 名稱: ${s.name} | 描述: ${s.description}\n`;
      });
  });
  
  return output;
}
