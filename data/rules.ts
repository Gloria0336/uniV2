
import { FactionType, ShopItem } from '../types';

export const CONSTANTS = {
  // 移動相關
  TRAVEL_SPEED: 15, // 每天移動的座標單位距離
  FUEL_COST_PER_UNIT: 2, // 每單位距離消耗的信用點 (模擬燃料費)
  
  // 資源相關
  MAX_AP: 5,
  BASE_HP: 100,
  HEAL_COST_PER_HP: 5, // 醫療艙每點 HP 治療費用
  
  // 升級相關
  XP_PER_LEVEL_BASE: 100,
  XP_SCALING_FACTOR: 1.5,
};

// 太陽系座標系統 (以地球為 0,0)
export const LOCATIONS: Record<string, { x: number; y: number; name: string; factionId: FactionType; description: string; imageUrl?: string }> = {
  'Earth': { 
    x: 0, 
    y: 0, 
    name: '地球 (Earth)', 
    factionId: FactionType.EUG, 
    description: '聯合政府首都，秩序與繁榮的象徵，但底層受到嚴密監控。',
    imageUrl: '/images/locations/earth_city.jpg'
  },
  'Luna': { 
    x: 10, 
    y: 10, 
    name: '月球 (Luna)', 
    factionId: FactionType.EUG, 
    description: '主要的太空港與富人居住區，擁有最先進的醫療設施。',
    imageUrl: '/images/locations/luna_base.jpg'
  },
  'Venus': { 
    x: -40, 
    y: 30, 
    name: '金星 (Venus)', 
    factionId: FactionType.FREE_PEOPLE, 
    description: '惡劣環境下的工業殖民地，自由民的主要據點之一。',
    imageUrl: '/images/locations/venus_colony.jpg'
  },
  'Mars': { 
    x: 60, 
    y: -20, 
    name: '火星 (Mars)', 
    factionId: FactionType.FREE_PEOPLE, 
    description: '紅色星球，充滿了遺跡挖掘場與混亂的黑市。',
    imageUrl: '/images/locations/mars_ruins.jpg'
  },
  'Belt': { 
    x: 100, 
    y: 80, 
    name: '小行星帶 (The Belt)', 
    factionId: FactionType.FREE_PEOPLE, 
    description: '無法無天的邊境，海盜與走私客的天堂。',
    imageUrl: '/images/locations/belt_outpost.jpg'
  },
  'Jupiter': { 
    x: 180, 
    y: -60, 
    name: '木星 (Jupiter)', 
    factionId: FactionType.EUG, 
    description: '巨大的氣體採集站，擁有強大的軌道防禦艦隊。',
    imageUrl: '/images/locations/jupiter_station.jpg'
  },
  'Saturn': { 
    x: 240, 
    y: 120, 
    name: '土星 (Saturn)', 
    factionId: FactionType.RED_CULT, 
    description: '紅教聖地，泰坦星上的神廟隱藏著古老的靈能秘密。',
    imageUrl: '/images/locations/saturn_temple.jpg'
  }
};

// 預定義物品庫
export const ITEMS: Record<string, ShopItem> = {
  'medkit_s': {
    id: 'medkit_s',
    name: '小型急救包',
    description: '恢復 20 點生命值。',
    price: 150,
    type: 'ITEM'
  },
  'medkit_l': {
    id: 'medkit_l',
    name: '納米修復劑',
    description: '恢復 80 點生命值並治療輕微創傷。',
    price: 500,
    type: 'ITEM'
  },
  'ration_pack': {
    id: 'ration_pack',
    name: '軍用口糧',
    description: '標準的一週份營養補給。',
    price: 50,
    type: 'ITEM'
  },
  'info_shard_eug': {
    id: 'info_shard_eug',
    name: '加密數據片: EUG 巡邏路徑',
    description: '包含地球軌道艦隊的換班時間表。',
    price: 800,
    type: 'INFO'
  },
  'info_shard_cult': {
    id: 'info_shard_cult',
    name: '古卷殘頁: 虛空低語',
    description: '紅教儀式的部份紀錄，閱讀可能增加靈能經驗。',
    price: 1200,
    type: 'INFO'
  },
  'cyber_eye': {
    id: 'cyber_eye',
    name: 'Kiroshi 光學義眼',
    description: '提升偵查能力與命中率。',
    price: 2500,
    type: 'UPGRADE'
  },
  'psionic_amp': {
    id: 'psionic_amp',
    name: '靈能增幅器 MK-I',
    description: '微幅提升靈能能量上限。',
    price: 3500,
    type: 'UPGRADE'
  }
};
