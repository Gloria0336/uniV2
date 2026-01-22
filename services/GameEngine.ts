
import { GameState, GameEvents, Skill } from '../types';
import { CONSTANTS, LOCATIONS, ITEMS } from '../data/rules';

// 定義硬編碼的大事表
const TIMELINE: Record<number, string> = {
  3: "【世界事件】火星奧林帕斯山礦區爆發大規模罷工，自由民聲援抗議者。",
  6: "【世界事件】EUG 宣佈對小行星帶實施『第7號過濾法案』，限制未註冊船隻通行。",
  10: "【重大變故】一艘滿載紅色晶體的運輸船在木星軌道離奇爆炸，紅教宣稱這是『飛昇的前兆』。",
  15: "【戰爭陰影】地球艦隊向土星環集結，太陽系緊張局勢升級至二級戒備。",
  20: "【異象】各地傳出靈能者失控事件，有人在夢中聽見了來自虛空的低語。",
  30: "【全面衝突】EUG 正式對自由民宣戰，火星航道被全面封鎖。"
};

// 預設基礎技能表 (作為備援)
const INITIAL_SKILLS: Skill[] = [
    { id: 'basic_hacking', name: '基礎駭入', level: 1, maxLevel: 5, description: '解鎖基礎電子鎖與獲取低階情報的能力。', type: 'TECH', progress: 0 },
    { id: 'kinetic_weapons', name: '動能武器', level: 1, maxLevel: 5, description: '熟練使用傳統槍械進行戰鬥。', type: 'INNATE', progress: 0 },
    { id: 'persuasion', name: '談判技巧', level: 1, maxLevel: 5, description: '在對話中獲得更多選項與價格優惠。', type: 'LEADERSHIP', progress: 0 }
];

export class GameEngine {
  private state: GameState;

  constructor(initialState: GameState) {
    // 建立深拷貝以避免直接修改 React 狀態，確保狀態管理的純粹性
    this.state = JSON.parse(JSON.stringify(initialState));
    
    // 確保回合數與世界階段有初始值
    if (this.state.turn === undefined) this.state.turn = 1;
    if (this.state.worldStage === undefined) this.state.worldStage = 1;

    // 技能初始化：如果沒有技能，則載入預設技能 (之後會被 setSkills 覆蓋)
    if (!this.state.skills || this.state.skills.length === 0) {
        this.state.skills = JSON.parse(JSON.stringify(INITIAL_SKILLS));
    }
  }

  /**
   * 取得當前引擎內部的最新狀態
   */
  public getState(): GameState {
    return this.state;
  }

  /**
   * 覆寫整組技能 (用於遊戲開始時接收 AI 生成的隨機技能)
   */
  public setSkills(skills: Skill[]): void {
      this.state.skills = skills.map(s => ({
          ...s,
          progress: s.progress ?? 0,
          level: s.level ?? 1,
          maxLevel: s.maxLevel ?? 5
      }));
  }

  /**
   * 推進回合並檢查劇情事件
   * @returns 觸發的劇情描述 (若無則為 null)
   */
  private advanceTurn(): string | null {
    this.state.turn += 1;
    const currentTurn = this.state.turn;
    
    // 簡單的世界階段推進邏輯
    if (currentTurn >= 10 && this.state.worldStage < 2) this.state.worldStage = 2;
    if (currentTurn >= 20 && this.state.worldStage < 3) this.state.worldStage = 3;

    // 檢查大事表
    if (TIMELINE[currentTurn]) {
        return `[PLOT EVENT - TURN ${currentTurn}] ${TIMELINE[currentTurn]}`;
    }
    
    return null;
  }

  /**
   * 升級指定技能
   * @param skillName 技能名稱
   * @returns 升級結果訊息，若失敗則回傳 null 或錯誤原因
   */
  public upgradeSkill(skillName: string): string {
      const skill = this.state.skills.find(s => s.name === skillName);
      
      if (!skill) return "[ERROR] 技能不存在";
      if (this.state.freeSkillPoints <= 0) return "[ERROR] 技能點數不足";
      if (skill.level >= skill.maxLevel) return "[ERROR] 技能已達最高等級";

      // 執行升級
      skill.level += 1;
      this.state.freeSkillPoints -= 1;

      return `[SYSTEM] 技能升級成功: ${skill.name} (LV.${skill.level})`;
  }

  /**
   * 處理 AI 回傳的遊戲事件 (XP, HP, Items)
   * 包含升級判定邏輯
   * @returns 系統訊息列表
   */
  public applyGameEvents(events: GameEvents): string[] {
    const logs: string[] = [];
    
    // 1. XP 與 升級
    if (events.xp_gain) {
      this.state.experience += events.xp_gain;
      logs.push(`[SYSTEM] 獲得經驗值: ${events.xp_gain}`);

      // 檢查是否升級
      if (this.state.experience >= this.state.nextLevelXp) {
         this.state.level += 1;
         this.state.freeSkillPoints += 1;
         // 扣除經驗值並提升下一級門檻
         this.state.experience -= this.state.nextLevelXp;
         this.state.nextLevelXp = Math.floor(this.state.nextLevelXp * CONSTANTS.XP_SCALING_FACTOR);
         
         logs.push(`[SYSTEM] ⭐ 等級提升！目前等級: ${this.state.level} (獲得 1 點技能點)`);
         logs.push(`[SYSTEM] 下一級所需 XP: ${this.state.nextLevelXp}`);
      }
    }

    // 2. HP 變更 (戰鬥/治療)
    if (events.hp_change) {
      const oldHp = this.state.health;
      this.state.health = Math.max(0, Math.min(CONSTANTS.BASE_HP, this.state.health + events.hp_change));
      
      if (events.hp_change < 0) {
          logs.push(`[SYSTEM] 警告：受到傷害 ${Math.abs(events.hp_change)} 點 (HP: ${this.state.health})`);
      } else {
          logs.push(`[SYSTEM] 生命恢復 ${events.hp_change} 點 (HP: ${this.state.health})`);
      }
    }
    
    // 3. 勢力變更
    if (events.reputation_change) {
        for (const [key, val] of Object.entries(events.reputation_change)) {
             if (key in this.state.factions) {
                 // @ts-ignore
                 this.state.factions[key] += val;
                 // @ts-ignore
                 const trend = val > 0 ? '提升' : '下降';
                 logs.push(`[SYSTEM] 與 ${key.toUpperCase()} 的關係${trend} (${val > 0 ? '+' : ''}${val})`);
             }
        }
    }

    // 4. 獲得物品
    if (events.new_item) {
        if (!this.state.inventory) this.state.inventory = [];
        this.state.inventory.push(events.new_item);
        logs.push(`[SYSTEM] 獲得物品: ${events.new_item}`);
    }
    
    // 5. 獲得新技能 (本地註冊，防止重複)
    if (events.new_skill) {
        // 檢查是否重複
        const existingSkill = this.state.skills.find(s => s.name === events.new_skill!.name);
        
        if (!existingSkill) {
            const skill: Skill = {
                id: events.new_skill.name.toLowerCase().replace(/\s/g, '_'),
                name: events.new_skill.name,
                level: 1,
                maxLevel: 5,
                description: events.new_skill.description,
                type: events.new_skill.type || 'INNATE',
                progress: 0
            };
            this.state.skills.push(skill);
            logs.push(`[SYSTEM] 💡 領悟新技能: ${skill.name}`);
        }
    }

    return logs;
  }

  /**
   * 日期推進輔助函式
   */
  private advanceDate(days: number): void {
    try {
      const current = new Date(this.state.date);
      if (isNaN(current.getTime())) {
        // 如果日期無效，重置為預設
        this.state.date = "3150-01-01";
        return;
      }
      current.setDate(current.getDate() + days);
      this.state.date = current.toISOString().split('T')[0];
    } catch (e) {
      console.error("Date calculation error", e);
    }
  }

  /**
   * 計算兩地距離 (歐幾里得距離)
   */
  private getDistance(fromKey: string, toKey: string): number {
    const start = LOCATIONS[fromKey];
    const end = LOCATIONS[toKey];
    if (!start || !end) return 0;
    return Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
  }

  /**
   * 解析位置字串對應到 LOCATIONS 的 Key
   */
  private resolveLocationKey(locName: string): string | null {
    const normalized = locName.toLowerCase();
    const keys = Object.keys(LOCATIONS);
    
    // 1. 精確匹配 Key
    if (LOCATIONS[locName]) return locName;

    // 2. 模糊匹配 Name 或 Description
    for (const key of keys) {
      const loc = LOCATIONS[key];
      if (normalized.includes(loc.name.toLowerCase()) || 
          normalized.includes(key.toLowerCase()) ||
          locName.includes(loc.name)) {
        return key;
      }
    }
    
    // 3. 特殊處理中文地名映射
    if (normalized.includes('地球')) return 'Earth';
    if (normalized.includes('月球')) return 'Luna';
    if (normalized.includes('火星')) return 'Mars';
    if (normalized.includes('金星')) return 'Venus';
    if (normalized.includes('木星')) return 'Jupiter';
    if (normalized.includes('土星')) return 'Saturn';
    if (normalized.includes('小行星') || normalized.includes('帶')) return 'Belt';

    return null;
  }

  /**
   * 核心處理方法
   * @param type 動作類型 (TRAVEL, TRADE, REST)
   * @param payload 動作參數
   * @returns 系統日誌字串 (用於餵給 AI)
   */
  public processAction(type: string, payload: any): string {
    let log = "";
    
    // 1. 推進回合時鐘
    const plotEvent = this.advanceTurn();

    try {
      switch (type) {
        case 'TRAVEL':
          log = this.handleTravel(payload);
          break;
        case 'TRADE':
          log = this.handleTrade(payload);
          break;
        case 'REST':
          log = this.handleRest(payload);
          break;
        default:
          log = `[SYSTEM] 未知指令: ${type}`;
      }
    } catch (error: any) {
      console.error("GameEngine Error:", error);
      return `[SYSTEM] 引擎運算錯誤: ${error.message}`;
    }

    // 2. 如果有觸發劇情事件，追加到 Log 中
    if (plotEvent) {
        log += `\n\n${plotEvent}\n(請務必在回應中反映此世界事件的影響)`;
    }

    return log;
  }

  private handleTravel(destinationInput: string): string {
    const currentLocKey = this.resolveLocationKey(this.state.location);
    const targetLocKey = this.resolveLocationKey(destinationInput);

    if (!currentLocKey) {
      // 如果當前位置無法識別，強制設定為最接近的地點或地球
      this.state.location = LOCATIONS['Earth'].name;
      return `[SYSTEM] 定位系統校準中... 當前位置重置為地球。請重新輸入指令。`;
    }

    if (!targetLocKey) {
      return `[SYSTEM] 導航錯誤：無法識別目標地點 "${destinationInput}"。請輸入標準星圖座標 (如: Mars, Earth, Belt)。`;
    }

    if (currentLocKey === targetLocKey) {
      return `[SYSTEM] 導航取消：已位於目的地 (${LOCATIONS[targetLocKey].name})。`;
    }

    const distance = this.getDistance(currentLocKey, targetLocKey);
    const daysNeeded = Math.ceil(distance / CONSTANTS.TRAVEL_SPEED);
    const fuelCost = Math.ceil(distance * CONSTANTS.FUEL_COST_PER_UNIT);

    // 檢查資源
    if (this.state.credits < fuelCost) {
      return `[SYSTEM] 警告：信用點不足。本次航程 (${daysNeeded} 天) 需要 ${fuelCost} CR，當前餘額 ${this.state.credits} CR。`;
    }

    if (this.state.actionPoints < 1) {
      return `[SYSTEM] 警告：行動點數 (AP) 不足。長途航行需要至少 1 點 AP。建議先進行休整 (REST)。`;
    }

    // 執行移動
    this.state.credits -= fuelCost;
    this.state.actionPoints -= 1;
    this.advanceDate(daysNeeded);
    
    const newLocationData = LOCATIONS[targetLocKey];
    this.state.location = newLocationData.name;

    // 回傳給 AI 的 Context
    return `[SYSTEM] 航行日誌：
- 起點：${LOCATIONS[currentLocKey].name}
- 終點：${newLocationData.name}
- 耗時：${daysNeeded} 天
- 消耗：${fuelCost} CR
- 剩餘 AP：${this.state.actionPoints}
- 當前日期：${this.state.date}
- 抵達環境描述：${newLocationData.description}
請根據此結果描述航行過程中的一個隨機太空事件（遭遇海盜、流星雨、或發現殘骸）。`;
  }

  private handleTrade(payload: { itemId: string, action: 'BUY' | 'SELL' }): string {
    const { itemId, action } = payload;
    const item = ITEMS[itemId];

    if (!item) return `[SYSTEM] 交易錯誤：商品代碼無效 (${itemId})。`;

    if (action === 'BUY') {
        if (this.state.credits < item.price) {
            return `[SYSTEM] 交易失敗：餘額不足。商品價格 ${item.price} CR，持有 ${this.state.credits} CR。`;
        }

        this.state.credits -= item.price;
        // 確保 inventory 是字串陣列
        if (!Array.isArray(this.state.inventory)) this.state.inventory = [];
        this.state.inventory.push(item.name);

        // 處理特殊升級邏輯
        if (item.type === 'UPGRADE') {
            if (itemId === 'psionic_amp') {
                 if (!this.state.psionics) this.state.psionics = { level: 0, energy: 0, max_energy: 1, abilities: [] };
                 this.state.psionics.max_energy += 1;
                 this.state.psionics.energy = this.state.psionics.max_energy;
            }
        }

        return `[SYSTEM] 交易成功：
- 購買物品：${item.name}
- 支付：${item.price} CR
- 剩餘餘額：${this.state.credits} CR
- 物品描述：${item.description}
請描述玩家獲得此物品的過程或商人的反應。`;

    } else {
        // 出售邏輯 (半價回收)
        const sellPrice = Math.floor(item.price * 0.5);
        const idx = this.state.inventory.indexOf(item.name);
        
        if (idx === -1) return `[SYSTEM] 交易失敗：你的庫存中沒有 "${item.name}"。`;
        
        this.state.inventory.splice(idx, 1);
        this.state.credits += sellPrice;

        return `[SYSTEM] 交易成功：
- 出售物品：${item.name}
- 獲得：${sellPrice} CR
- 剩餘餘額：${this.state.credits} CR
請簡述交易過程。`;
    }
  }

  private handleRest(days: number = 1): string {
      const healAmount = 10 * days;
      const oldHp = this.state.health;
      
      this.state.health = Math.min(CONSTANTS.BASE_HP, this.state.health + healAmount);
      this.state.actionPoints = CONSTANTS.MAX_AP; // 休息恢復所有 AP
      
      this.advanceDate(days);

      return `[SYSTEM] 休整紀錄：
- 休息天數：${days} 天
- 生命恢復：${this.state.health - oldHp} 點 (當前 HP: ${this.state.health})
- AP 狀態：已完全恢復 (5/5)
- 當前日期：${this.state.date}
請描述休息期間發生的小插曲或夢境（如果玩家有靈能潛力）。`;
  }
}
