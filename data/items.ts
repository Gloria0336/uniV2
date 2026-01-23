
import { Item } from '../types';

export const ITEM_DATABASE: Record<string, Item> = {
  // === 任務道具 (QUEST) ===
  'encrypted_drive': {
    id: 'encrypted_drive',
    name: '加密數據硬碟',
    category: 'QUEST',
    rarity: 'EPIC',
    description: '存有 E.U.G. 黑色行動紀錄的硬碟。無法裝備，交給特定 NPC 可能會有收穫。',
    price: 0,
    maxStack: 1,
    icon: '💾',
    imageUrl: '/images/items/encrypted_drive.jpg'
  },
  'vip_pass': {
    id: 'vip_pass',
    name: '月球上層通行證',
    category: 'QUEST',
    rarity: 'RARE',
    description: '通往月球貴族區的憑證。',
    price: 2000,
    maxStack: 1,
    icon: '💳',
    imageUrl: '/images/items/vip_card.jpg'
  },

  // === 消耗品 (CONSUMABLE) ===
  'medkit_s': {
    id: 'medkit_s',
    name: '小型急救包',
    category: 'CONSUMABLE',
    rarity: 'COMMON',
    description: '緊急止血，恢復 20 點生命值。',
    price: 50,
    maxStack: 10,
    icon: '🩹',
    imageUrl: '/images/items/medkit_s.jpg',
    effect: { type: 'HEAL', value: 20 }
  },
  'stimpack_combat': {
    id: 'stimpack_combat',
    name: '戰鬥興奮劑',
    category: 'CONSUMABLE',
    rarity: 'UNCOMMON',
    description: '短暫移除痛覺，恢復 5 AP。',
    price: 120,
    maxStack: 5,
    icon: '💉',
    imageUrl: '/images/items/stimpack.jpg',
    effect: { type: 'RESTORE_AP', value: 5 }
  },
  'engine_booster': {
    id: 'engine_booster',
    name: '引擎增幅模組 (拋棄式)',
    category: 'CONSUMABLE',
    rarity: 'UNCOMMON',
    description: '超頻神經反應。3回合內逃脫機率 +30%。',
    price: 150,
    maxStack: 5,
    icon: '🚀',
    imageUrl: '/images/items/booster.jpg',
    effect: { 
      type: 'BUFF', 
      targetStat: 'escapeRate', 
      value: 30, 
      duration: 3,
      description: '神經加速'
    }
  },

  // === 裝備 (EQUIPMENT) ===
  'pistol_kinetic_m1': {
    id: 'pistol_kinetic_m1',
    name: 'M1 動能手槍',
    category: 'EQUIPMENT',
    type: 'WEAPON',
    rarity: 'COMMON',
    description: '警用制式手槍，可靠且耐用。',
    price: 300,
    maxStack: 1,
    icon: '🔫',
    imageUrl: '/images/items/pistol_m1.jpg',
    equipSlot: 'MAIN_HAND',
    stats: { attack: 12, critRate: 5 }
  },
  'blade_vibro': {
    id: 'blade_vibro',
    name: '高頻震動刀',
    category: 'EQUIPMENT',
    type: 'WEAPON',
    rarity: 'RARE',
    description: '能輕易切開輕型護甲。',
    price: 850,
    maxStack: 1,
    icon: '🗡️',
    imageUrl: '/images/items/vibro_blade.jpg',
    equipSlot: 'MAIN_HAND',
    stats: { attack: 25, critRate: 15 }
  },
  'armor_vest_light': {
    id: 'armor_vest_light',
    name: '輕型凱夫拉背心',
    category: 'EQUIPMENT',
    type: 'ARMOR',
    rarity: 'COMMON',
    description: '提供基礎防護。',
    price: 400,
    maxStack: 1,
    icon: '👕',
    imageUrl: '/images/items/armor_vest.jpg',
    equipSlot: 'BODY',
    stats: { defense: 10, hpMax: 20 }
  },
  'helmet_tactical': {
    id: 'helmet_tactical',
    name: '戰術頭盔',
    category: 'EQUIPMENT',
    type: 'ARMOR',
    rarity: 'UNCOMMON',
    description: '內建抬頭顯示器連結介面。',
    price: 350,
    maxStack: 1,
    icon: '🪖',
    imageUrl: '/images/items/helmet_tactical.jpg',
    equipSlot: 'HEAD',
    stats: { defense: 5, apMax: 1 }
  },
  'implant_ocular_v1': {
    id: 'implant_ocular_v1',
    name: '基路伯光學義眼 V1',
    category: 'EQUIPMENT',
    type: 'IMPLANT',
    rarity: 'RARE',
    description: '提升視覺捕捉能力與暴擊率。',
    price: 1500,
    maxStack: 1,
    icon: '👁️',
    imageUrl: '/images/items/ocular_implant.jpg',
    equipSlot: 'IMPLANT',
    stats: { critRate: 10, attack: 5 }
  },
  'rifle_pulse_standard': {
    id: 'rifle_pulse_standard',
    name: 'EUG 制式脈衝步槍',
    category: 'EQUIPMENT',
    type: 'WEAPON',
    rarity: 'UNCOMMON',
    description: '聯合政府治安部隊的標準配備。精準、射速穩定，象徵著絕對的秩序。',
    price: 1200,
    maxStack: 1,
    icon: '🔫',
    imageUrl: '/images/items/pulse_rifle.jpg',
    equipSlot: 'MAIN_HAND',
    stats: { attack: 18, critRate: 5 }
  },
  'shield_riot': {
    id: 'shield_riot',
    name: '鎮暴能量盾',
    category: 'EQUIPMENT',
    type: 'ARMOR',
    rarity: 'UNCOMMON',
    description: '左手持用的輕型能量盾，常用於驅散小行星帶的罷工人群。',
    price: 900,
    maxStack: 1,
    icon: '🛡️',
    imageUrl: '/images/items/riot_shield.jpg',
    equipSlot: 'OFF_HAND',
    stats: { defense: 15, hpMax: 50 }
  },
  'permit_mining': {
    id: 'permit_mining',
    name: '木星軌道開採許可',
    category: 'QUEST',
    rarity: 'RARE',
    description: '印有 E.U.G. 鋼印的數位憑證。沒有它，你在木星周邊會被視為海盜直接擊落。',
    price: 5000, // 黑市價格
    maxStack: 1,
    icon: '📜',
    imageUrl: '/images/items/permit.jpg'
  },
  'ration_military': {
    id: 'ration_military',
    name: '軍用高能營養膏',
    category: 'CONSUMABLE',
    rarity: 'COMMON',
    description: '雖然味道像濕紙箱，但能提供極高的熱量與微量興奮劑。',
    price: 80,
    maxStack: 20,
    icon: '🥫',
    imageUrl: '/images/items/ration.jpg',
    effect: { type: 'RESTORE_AP', value: 2, description: '快速補充體力' }
  },

  // ==========================================
  // 紅教 (Red Cult) - 靈能、肉體改造、神秘
  // ==========================================
  'dagger_sacrificial': {
    id: 'dagger_sacrificial',
    name: '泰坦黑曜石匕首',
    category: 'EQUIPMENT',
    type: 'WEAPON',
    rarity: 'RARE',
    description: '來自土衛六深處的礦石打磨而成。據說能在造成物理傷害的同時切割精神。',
    price: 2500,
    maxStack: 1,
    icon: '🗡️',
    imageUrl: '/images/items/dagger.jpg',
    equipSlot: 'OFF_HAND',
    stats: { attack: 10, psionicPower: 15, critRate: 10 }
  },
  'robes_acolyte': {
    id: 'robes_acolyte',
    name: '侍祭血色長袍',
    category: 'EQUIPMENT',
    type: 'ARMOR',
    rarity: 'COMMON',
    description: '織入了微量神經導線的長袍，有助於穩定靈能波動。',
    price: 600,
    maxStack: 1,
    icon: '👘',
    imageUrl: '/images/items/robes.jpg',
    equipSlot: 'BODY',
    stats: { defense: 3, psionicPower: 10, hpMax: 10 }
  },
  'incense_void': {
    id: 'incense_void',
    name: '虛空薰香',
    category: 'CONSUMABLE',
    rarity: 'RARE',
    description: '吸入後會暫時模糊現實與虛幻的邊界，大幅提升靈能感應。',
    price: 300,
    maxStack: 5,
    icon: '🟣',
    imageUrl: '/images/items/incense.jpg',
    effect: { 
      type: 'BUFF', 
      targetStat: 'psionicPower', 
      value: 20, 
      duration: 3, 
      description: '靈能高漲' 
    }
  },
  'relic_finger_bone': {
    id: 'relic_finger_bone',
    name: '聖者指骨',
    category: 'QUEST',
    rarity: 'LEGENDARY',
    description: '紅教初代先知的遺骸碎片。雖然令人不安，但散發著強大的能量波動。',
    price: 0,
    maxStack: 1,
    icon: '🦴',
    imageUrl: '/images/items/bone.jpg'
  },

  // ==========================================
  // 自由民 (Free People) - 改裝、非法、生存
  // ==========================================
  'shotgun_scrap': {
    id: 'shotgun_scrap',
    name: '廢土改裝霰彈槍',
    category: 'EQUIPMENT',
    type: 'WEAPON',
    rarity: 'COMMON',
    description: '用工業管線拼湊而成的武器。近距離威力巨大，但看起來隨時會炸膛。',
    price: 450,
    maxStack: 1,
    icon: '💥',
    imageUrl: '/images/items/shotgun.jpg',
    equipSlot: 'MAIN_HAND',
    stats: { attack: 28, critRate: 20 } // 高傷高暴擊，但沒防禦加成
  },
  'exo_skeleton_mining': {
    id: 'exo_skeleton_mining',
    name: '外骨骼礦工裝架',
    category: 'EQUIPMENT',
    type: 'ARMOR',
    rarity: 'UNCOMMON',
    description: '原本用於搬運礦石，經過改裝後提供了驚人的物理防禦力。',
    price: 1800,
    maxStack: 1,
    icon: '🦾',
    imageUrl: '/images/items/exo.jpg',
    equipSlot: 'BODY',
    stats: { defense: 25, apMax: -1 } // 防禦極高但扣行動力
  },
  'stim_mars_shine': {
    id: 'stim_mars_shine',
    name: '火星私釀酒',
    category: 'CONSUMABLE',
    rarity: 'COMMON',
    description: '高濃度的工業酒精混和物。喝下去能忘記疼痛，讓人變得異常大膽。',
    price: 30,
    maxStack: 10,
    icon: '🍺',
    imageUrl: '/images/items/alcohol.jpg',
    effect: { 
      type: 'BUFF', 
      targetStat: 'critRate', 
      value: 15, 
      duration: 5, 
      description: '醉酒狂暴' 
    }
  },
  'chip_decrypted': {
    id: 'chip_decrypted',
    name: '已解密的數據晶片',
    category: 'QUEST',
    rarity: 'EPIC',
    description: '裡面記錄了某個企業高層的黑帳。天眼閣（情報販子）會對這個很感興趣。',
    price: 0,
    maxStack: 1,
    icon: '💾',
    imageUrl: '/images/items/chip.jpg'
  },

  // ==========================================
  // 植入物 (Implants) - 通用賽博科技
  // ==========================================
  'implant_subdermal_plating': {
    id: 'implant_subdermal_plating',
    name: '皮下護甲片',
    category: 'EQUIPMENT',
    type: 'IMPLANT',
    rarity: 'UNCOMMON',
    description: '在皮膚下植入合成纖維網，提供額外的物理抗性。',
    price: 2000,
    maxStack: 1,
    icon: '🧬',
    imageUrl: '/images/items/plating.jpg',
    equipSlot: 'IMPLANT',
    stats: { defense: 8, hpMax: 30 }
  },
  'implant_reflex_booster': {
    id: 'implant_reflex_booster',
    name: '克倫齊科夫神經加速器',
    category: 'EQUIPMENT',
    type: 'IMPLANT',
    rarity: 'EPIC',
    description: '軍用級神經植入物。讓世界在你眼中變慢，極大幅度提升閃避與反應。',
    price: 5000,
    maxStack: 1,
    icon: '⚡',
    imageUrl: '/images/items/reflex.jpg',
    equipSlot: 'IMPLANT',
    stats: { escapeRate: 20, apMax: 2, critRate: 5 }
  },
  'acc_hacker_deck_v2': {
    id: 'acc_hacker_deck_v2',
    name: '暗網接入倉 V2',
    category: 'EQUIPMENT',
    type: 'ACCESSORY',
    rarity: 'RARE',
    description: '預載了多種破解協議的攜帶型終端。駭客的吃飯傢伙。',
    price: 2200,
    maxStack: 1,
    icon: '💻',
    imageUrl: '/images/items/deck.jpg',
    equipSlot: 'OFF_HAND', // 設定為副手裝備
    stats: { attack: 5, critRate: 15 } // 提升駭入攻擊力與暴擊
  },
  'acc_lucky_coin': {
    id: 'acc_lucky_coin',
    name: '舊時代硬幣',
    category: 'EQUIPMENT',
    type: 'ACCESSORY',
    rarity: 'UNCOMMON',
    description: '一枚來自 21 世紀的實體貨幣。雖然無法流通，但握著它總覺得運氣變好了。',
    price: 500,
    maxStack: 1,
    icon: '🪙',
    imageUrl: '/images/items/coin.jpg',
    equipSlot: 'OFF_HAND',
    stats: { escapeRate: 10, critRate: 2 }
  },
  'acc_psionic_damper': {
    id: 'acc_psionic_damper',
    name: '靈能阻斷項圈',
    category: 'EQUIPMENT',
    type: 'ACCESSORY',
    rarity: 'EPIC',
    description: '原本是用來關押靈能犯人的刑具，改裝後可以保護配戴者免受精神干擾。',
    price: 3500,
    maxStack: 1,
    icon: '🔒',
    imageUrl: '/images/items/damper.jpg',
    equipSlot: 'HEAD', // 佔用頭部欄位或是新增 ACCESSORY 欄位 (目前用 HEAD 替代或視需求擴充)
    stats: { defense: 5, psionicPower: -5, hpMax: 50 } // 犧牲靈能換取生存
  },

  // ==========================================
  // 進階武器 (Advanced Weapons)
  // ==========================================
  'weapon_thermal_katana': {
    id: 'weapon_thermal_katana',
    name: '熱能單分子刀',
    category: 'EQUIPMENT',
    type: 'WEAPON',
    rarity: 'EPIC',
    description: '刀刃處於過熱狀態，切開金屬如同切開奶油。',
    price: 4500,
    maxStack: 1,
    icon: '🔥',
    imageUrl: '/images/items/katana.jpg',
    equipSlot: 'MAIN_HAND',
    stats: { attack: 40, critRate: 25 }
  },
  'weapon_sniper_railgun': {
    id: 'weapon_sniper_railgun',
    name: '「雷擊」磁軌狙擊槍',
    category: 'EQUIPMENT',
    type: 'WEAPON',
    rarity: 'LEGENDARY',
    description: '需要外接電源才能運作的重型武器。一發子彈足以貫穿輕型巡邏艇。',
    price: 8000,
    maxStack: 1,
    icon: '🔭',
    imageUrl: '/images/items/railgun.jpg',
    equipSlot: 'MAIN_HAND',
    stats: { attack: 65, apMax: -2 } // 極高傷害但扣除行動上限 (笨重)
  },

  // ==========================================
  // 特殊消耗品 (Special Consumables)
  // ==========================================
  'drug_neuro_blocker': {
    id: 'drug_neuro_blocker',
    name: '神經阻斷劑',
    category: 'CONSUMABLE',
    rarity: 'UNCOMMON',
    description: '暫時切斷恐懼與痛覺神經。雖然會變得遲鈍，但能承受極大傷害。',
    price: 200,
    maxStack: 5,
    icon: '💉',
    imageUrl: '/images/items/neuro_blocker.jpg',
    effect: { 
      type: 'BUFF', 
      targetStat: 'defense', 
      value: 30, 
      duration: 3, 
      description: '痛覺遮蔽' 
    }
  },
  'grenade_emp': {
    id: 'grenade_emp',
    name: 'EMP 手雷',
    category: 'CONSUMABLE', // 這裡暫時歸類為消耗品，透過 Buff 模擬"削弱敵人"或"提升自己對機械傷害"
    rarity: 'RARE',
    description: '釋放電磁脈衝。對機械敵人效果顯著 (使用後下回合攻擊大幅提升)。',
    price: 300,
    maxStack: 3,
    icon: '💣',
    imageUrl: '/images/items/emp.jpg',
    effect: { 
      type: 'BUFF', 
      targetStat: 'attack', // 模擬攻擊加成
      value: 50, 
      duration: 1, 
      description: 'EMP 充能' 
    }
  },

  // ==========================================
  // 劇情與高價值物品 (Lore & Trade)
  // ==========================================
  'item_ancient_tech': {
    id: 'item_ancient_tech',
    name: '戰前硬碟 (2077年)',
    category: 'QUEST', // 也可視為高價賣金道具
    rarity: 'LEGENDARY',
    description: '來自古地球時代的科技遺物。收藏家願意出天價收購。',
    price: 10000,
    maxStack: 1,
    icon: '💾',
    imageUrl: '/images/items/ancient_hdd.jpg'
  },
  'item_cult_scripture': {
    id: 'item_cult_scripture',
    name: '血肉福音書 (手抄本)',
    category: 'QUEST',
    rarity: 'RARE',
    description: '紅教內部的禁書，詳細記載了如何透過痛苦激發靈能。',
    price: 0,
    maxStack: 1,
    icon: '📖',
    imageUrl: '/images/items/cult_book.jpg'
  },
  'item_faked_id': {
    id: 'item_faked_id',
    name: '偽造身份晶片',
    category: 'QUEST',
    rarity: 'EPIC',
    description: '足以騙過 E.U.G. 邊境掃描的高級偽造 ID。逃亡者的保命符。',
    price: 3000,
    maxStack: 1,
    icon: '🆔',
    imageUrl: '/images/items/fake_id.jpg'
  }
};

export function getItemDef(id: string): Item | null {
  return ITEM_DATABASE[id] || null;
}
