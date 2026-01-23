
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
    maxLevel: 5,
    description: '提升使用實彈槍械的命中率與傷害，並能保養槍枝。'
  },
  'survival_instinct': {
    id: 'survival_instinct',
    name: '生存直覺',
    type: 'INNATE',
    maxLevel: 3,
    description: '在危險環境中減少生命值流失，並能察覺埋伏。'
  },
  'stealth_ops': {
    id: 'stealth_ops',
    name: '隱密行動',
    type: 'INNATE',
    maxLevel: 5,
    description: '降低被敵人或監視系統發現的機率。'
  },
  'close_combat': {
    id: 'close_combat',
    name: '近身格鬥',
    type: 'INNATE',
    maxLevel: 5,
    description: '提升徒手或近戰武器的戰鬥效能。'
  },

  // === TECH (科技/駭客) ===
  'basic_hacking': {
    id: 'basic_hacking',
    name: '基礎駭入',
    type: 'TECH',
    maxLevel: 5,
    description: '能破解民用級電子鎖與基礎終端機。'
  },
  'cyber_warfare': {
    id: 'cyber_warfare',
    name: '網路戰協議',
    type: 'TECH',
    maxLevel: 5,
    description: '針對敵方義體進行干擾，或入侵軍用級系統。'
  },
  'engineering': {
    id: 'engineering',
    name: '工程維修',
    type: 'TECH',
    maxLevel: 4,
    description: '修復損壞的設備、無人機或太空船組件。'
  },
  'drone_control': {
    id: 'drone_control',
    name: '無人機操作',
    type: 'TECH',
    maxLevel: 3,
    description: '能同時控制多台偵查或攻擊型無人機。'
  },

  // === LEADERSHIP (社交/領導) ===
  'persuasion': {
    id: 'persuasion',
    name: '談判技巧',
    type: 'LEADERSHIP',
    maxLevel: 5,
    description: '在對話中開啟更多選項，獲取情報或殺價。'
  },
  'intimidation': {
    id: 'intimidation',
    name: '威嚇',
    type: 'LEADERSHIP',
    maxLevel: 3,
    description: '強迫弱小的敵人投降或交出物資。'
  },
  'command': {
    id: 'command',
    name: '戰術指揮',
    type: 'LEADERSHIP',
    maxLevel: 5,
    description: '提升隊友或追隨者(Followers)的行動效率。'
  },
  'underworld_contacts': {
    id: 'underworld_contacts',
    name: '地下人脈',
    type: 'LEADERSHIP',
    maxLevel: 3,
    description: '在黑市或自由民據點更容易獲得稀有物資。'
  },

  // === PSIONIC (靈能 - 3150年稀有能力) ===
  'telepathy': {
    id: 'telepathy',
    name: '心靈感應',
    type: 'PSIONIC',
    maxLevel: 3,
    description: '能感知附近生物的情緒波動，高等級可讀取淺層思維。'
  },
  'telekinesis': {
    id: 'telekinesis',
    name: '念力移物',
    type: 'PSIONIC',
    maxLevel: 5,
    description: '使用意念移動物體，高等級可作為攻擊手段。'
  },
  'precognition': {
    id: 'precognition',
    name: '預知',
    type: 'PSIONIC',
    maxLevel: 2,
    description: '偶爾能看見短暫的未來片段，提升閃避致命傷的機率。'
  },
  'mind_blast': {
    id: 'mind_blast',
    name: '心靈震爆',
    type: 'PSIONIC',
    maxLevel: 5,
    description: '釋放靈能衝擊波，暈眩或傷害範圍內的敵人。'
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
