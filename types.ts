
export interface PlayerProfile {
  gender: string;
  personality: string;
  appearance: string;
}

export interface FactionNews {
  faction: string;
  status: string;
  headline: string;
  turn?: number;        
  isMajorEvent?: boolean; 
}

export interface GossipItem {
  source: string;
  content: string;
  reliability: string;
}

export interface ChronicleEvent {
  year: string;
  title: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  description: string;
  type: 'INNATE' | 'PSIONIC' | 'TECH' | 'LEADERSHIP';
  progress: number;
}

export interface Follower {
  name: string;
  role: string;
  level: number;
  status: string;
  description: string;
}

export interface PsionicStatus {
  level: number;
  energy: number;
  max_energy: number;
  abilities: string[];
}

export interface MyFaction {
  name: string;
  level: number;
  members: number;
  influence: number;
  resources: number;
  description: string;
  perks: string[];
  followers: Follower[];
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'ITEM' | 'INFO' | 'SERVICE' | 'UPGRADE';
}

export interface ShopData {
  shopName: string;
  shopDescription: string;
  items: ShopItem[];
}

export type ModelProvider = 'GEMINI' | 'OPENROUTER';

export interface GameConfig {
  provider: ModelProvider;
  openRouterKey?: string;
  openRouterModel?: string;
}

export interface GameState {
  playerName: string;
  playerProfile?: PlayerProfile;
  avatarUrl?: string;
  date: string;
  location: string;
  credits: number;
  health: number;
  level: number;
  experience: number;
  nextLevelXp: number;
  actionPoints: number;
  freeSkillPoints: number;
  identity: string;
  factionId: string;
  history: ChatMessage[];
  isGameOver: boolean;
  gameStarted: boolean;
  inventory: string[];
  factions: {
    earth: number;
    mars: number;
    belt: number;
    jupiter: number;
    saturn: number;
  };
  reputation: string;
  myFaction?: MyFaction;
  currentOptions: GameOption[];
  latestImagePrompt?: string;
  news?: FactionNews[];
  gossip?: GossipItem[];
  chronicles?: ChronicleEvent[];
  psionics?: PsionicStatus;
  skills: Skill[];
  shop?: ShopData | null;
  lastNewsDate?: string;    
  actionStepCount?: number; 
  turn: number;             
  worldStage: number;
  interaction: {
    targetName: string | null;
    status: 'NONE' | 'ACTIVE';
  };
}

export interface GameEvents {
  xp_gain?: number;
  hp_change?: number; 
  reputation_change?: {
    earth?: number;
    mars?: number;
    belt?: number;
    jupiter?: number;
    saturn?: number;
  };
  new_item?: string;
  new_skill?: {
    name: string;
    type: 'INNATE' | 'PSIONIC' | 'TECH' | 'LEADERSHIP';
    description: string;
  };
  initial_skills?: Skill[]; 
}

export type ActionCategory = 'TALK' | 'MOVE_SHORT' | 'MOVE_LONG' | 'COMBAT' | 'ACTION' | 'REST' | 'TRADE';

export interface GameOption {
  id: number;
  text: string;
  action_type: ActionCategory;
  ap_cost: number;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  imagePrompt?: string;
  silent?: boolean;
}

export enum FactionType {
  EUG = 'EUG',
  RED_CULT = 'RED_CULT',
  FREE_PEOPLE = 'FREE_PEOPLE'
}

export interface FactionDetails {
  id: FactionType;
  name: string;
  description: string;
  colorTheme: string;
}

export const FACTIONS: FactionDetails[] = [
  {
    id: FactionType.EUG,
    name: "地球聯合政府 (EUG)",
    description: "絕對的秩序與高科技文明。掌握地球、月球與木星資源。適合偏好權力、科技與穩定開局的玩家。",
    colorTheme: "border-cyan-200 bg-cyan-900/20 text-cyan-100"
  },
  {
    id: FactionType.RED_CULT,
    name: "紅教 (Red Cult)",
    description: "神秘的機械宗教，總部位於土星泰坦。追求肉體飛昇與靈能崇拜。適合偏好魔法、宗教與異端玩法的玩家。",
    colorTheme: "border-red-500 bg-red-900/20 text-red-100"
  },
  {
    id: FactionType.FREE_PEOPLE,
    name: "自由民 (Free People)",
    description: "法外之徒的鬆散聯盟，分佈於小行星帶與火星。混亂、危險但也最為自由。適合偏好黑客、走私與生存挑戰的玩家。",
    colorTheme: "border-green-500 bg-green-900/20 text-green-100"
  }
];
