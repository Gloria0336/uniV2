
import { GameState, GameEvents, Skill, ActionCategory, ShopItem } from '../types';
import { CONSTANTS, LOCATIONS, ITEMS } from '../data/rules';

const TIMELINE: Record<number, string> = {
  3: "【世界事件】火星奧林帕斯山礦區爆發大規模罷工。",
  6: "【世界事件】EUG 宣佈對小行星帶實施『第7號過濾法案』。",
  10: "【重大變故】一艘滿載紅色晶體的運輸船在木星軌道離奇爆炸。",
  15: "【戰爭陰影】地球艦隊向土星環集結，局勢升級。",
  20: "【異象】各地傳出靈能者失控事件。",
  30: "【全面衝突】EUG 正式對自由民宣戰。"
};

const INITIAL_SKILLS: Skill[] = [
    { id: 'basic_hacking', name: '基礎駭入', level: 1, maxLevel: 5, description: '解鎖電子鎖。', type: 'TECH', progress: 0 },
    { id: 'kinetic_weapons', name: '動能武器', level: 1, maxLevel: 5, description: '使用槍械。', type: 'INNATE', progress: 0 },
    { id: 'persuasion', name: '談判技巧', level: 1, maxLevel: 5, description: '獲取優惠。', type: 'LEADERSHIP', progress: 0 }
];

export class GameEngine {
  private state: GameState;

  constructor(initialState: GameState) {
    this.state = JSON.parse(JSON.stringify(initialState));
    if (this.state.turn === undefined) this.state.turn = 1;
    if (this.state.worldStage === undefined) this.state.worldStage = 1;
    if (this.state.interaction === undefined) {
      this.state.interaction = { targetName: null, status: 'NONE' };
    }
    if (!this.state.skills || this.state.skills.length === 0) {
        this.state.skills = JSON.parse(JSON.stringify(INITIAL_SKILLS));
    }
  }

  public getState(): GameState {
    return this.state;
  }

  public setSkills(skills: Skill[]): void {
      this.state.skills = skills.map(s => ({
          ...s,
          progress: s.progress ?? 0,
          level: s.level ?? 1,
          maxLevel: s.maxLevel ?? 5
      }));
  }

  private advanceTurn(): string | null {
    this.state.turn += 1;
    const currentTurn = this.state.turn;
    if (currentTurn >= 10 && this.state.worldStage < 2) this.state.worldStage = 2;
    if (currentTurn >= 20 && this.state.worldStage < 3) this.state.worldStage = 3;
    if (TIMELINE[currentTurn]) {
        return `[PLOT EVENT - TURN ${currentTurn}] ${TIMELINE[currentTurn]}`;
    }
    return null;
  }

  public upgradeSkill(skillName: string): string {
      const skill = this.state.skills.find(s => s.name === skillName);
      if (!skill) return "[ERROR] 技能不存在";
      if (this.state.freeSkillPoints <= 0) return "[ERROR] 技能點數不足";
      if (skill.level >= skill.maxLevel) return "[ERROR] 技能已達最高等級";
      skill.level += 1;
      this.state.freeSkillPoints -= 1;
      return `[SYSTEM] 技能升級成功: ${skill.name} (LV.${skill.level})`;
  }

  public applyGameEvents(events: GameEvents): string[] {
    const logs: string[] = [];
    if (events.xp_gain) {
      this.state.experience += events.xp_gain;
      logs.push(`[SYSTEM] 獲得經驗值: ${events.xp_gain}`);
      if (this.state.experience >= this.state.nextLevelXp) {
         this.state.level += 1;
         this.state.freeSkillPoints += 1;
         this.state.experience -= this.state.nextLevelXp;
         this.state.nextLevelXp = Math.floor(this.state.nextLevelXp * CONSTANTS.XP_SCALING_FACTOR);
         logs.push(`[SYSTEM] ⭐ 等級提升！目前等級: ${this.state.level}`);
      }
    }
    if (events.hp_change) {
      this.state.health = Math.max(0, Math.min(CONSTANTS.BASE_HP, this.state.health + events.hp_change));
      logs.push(events.hp_change < 0 ? `[SYSTEM] 受到傷害 ${Math.abs(events.hp_change)}` : `[SYSTEM] 生命恢復 ${events.hp_change}`);
    }
    if (events.reputation_change) {
        for (const [key, val] of Object.entries(events.reputation_change)) {
             if (key in this.state.factions) {
                 // @ts-ignore
                 this.state.factions[key] += val;
                 logs.push(`[SYSTEM] 與 ${key.toUpperCase()} 關係${val > 0 ? '提升' : '下降'}`);
             }
        }
    }
    if (events.new_item) {
        if (!this.state.inventory) this.state.inventory = [];
        this.state.inventory.push(events.new_item);
        logs.push(`[SYSTEM] 獲得物品: ${events.new_item}`);
    }
    if (events.new_skill) {
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

  private advanceDate(days: number): void {
    try {
      const current = new Date(this.state.date);
      if (isNaN(current.getTime())) {
        this.state.date = "3150-01-01";
        return;
      }
      current.setDate(current.getDate() + days);
      this.state.date = current.toISOString().split('T')[0];
    } catch (e) {
      console.error("Date error", e);
    }
  }

  private getDistance(fromKey: string, toKey: string): number {
    const start = LOCATIONS[fromKey];
    const end = LOCATIONS[toKey];
    if (!start || !end) return 0;
    return Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
  }

  private resolveLocationKey(locName: string): string | null {
    const normalized = locName.toLowerCase();
    const keys = Object.keys(LOCATIONS);
    if (LOCATIONS[locName]) return locName;
    for (const key of keys) {
      const loc = LOCATIONS[key];
      if (normalized.includes(loc.name.toLowerCase()) || normalized.includes(key.toLowerCase())) return key;
    }
    if (normalized.includes('地球')) return 'Earth';
    if (normalized.includes('火星')) return 'Mars';
    if (normalized.includes('土星')) return 'Saturn';
    if (normalized.includes('木星')) return 'Jupiter';
    if (normalized.includes('小行星') || normalized.includes('帶')) return 'Belt';
    return null;
  }

  private handleTrade(payload: { item: ShopItem, action: 'BUY' | 'SELL' }): string {
    const { item, action } = payload;
    
    if (!item) return `[SYSTEM] 交易錯誤：無效的商品數據。`;

    if (action === 'BUY') {
        if (this.state.credits < item.price) {
            return `[SYSTEM] 交易失敗：餘額不足。商品價格 ${item.price} CR，持有 ${this.state.credits} CR。`;
        }

        this.state.credits -= item.price;
        if (!Array.isArray(this.state.inventory)) this.state.inventory = [];
        
        this.state.inventory.push(item.name);

        // 特殊物品邏輯
        if (item.id === 'psionic_amp' || item.name.includes('靈能增幅器')) {
             if (!this.state.psionics) this.state.psionics = { level: 0, energy: 0, max_energy: 1, abilities: [] };
             this.state.psionics.max_energy += 1;
             this.state.psionics.energy = this.state.psionics.max_energy;
        }

        return `[SYSTEM] 交易成功：\n- 購買物品：${item.name}\n- 支付：${item.price} CR\n- 剩餘餘額：${this.state.credits} CR\n- 物品描述：${item.description}\n請描述玩家獲得此物品的過程。`;
    } else {
        const sellPrice = Math.floor(item.price * 0.5);
        const idx = this.state.inventory.indexOf(item.name);
        
        if (idx === -1) return `[SYSTEM] 交易失敗：你的庫存中沒有 "${item.name}"。`;
        
        this.state.inventory.splice(idx, 1);
        this.state.credits += sellPrice;

        return `[SYSTEM] 交易成功：\n- 出售物品：${item.name}\n- 獲得：${sellPrice} CR\n- 剩餘餘額：${this.state.credits} CR`;
    }
  }

  /**
   * 核心處理方法
   */
  public processAction(type: ActionCategory, payload: any, ap_cost: number = 0): string {
    // 1. AP 檢查
    if (ap_cost > 0 && this.state.actionPoints < ap_cost) {
      throw new Error(`體力透支，無法執行此高強度行動 (需要 ${ap_cost} AP，當前僅剩 ${this.state.actionPoints})。建議進行休整 (REST)。`);
    }

    // 2. 扣除 AP
    this.state.actionPoints -= ap_cost;
    
    // 3. 互動鎖定邏輯處理
    const command = String(payload);
    if (['MOVE_SHORT', 'MOVE_LONG', 'REST'].includes(type)) {
      this.state.interaction = { targetName: null, status: 'NONE' };
    } else if (['TALK', 'COMBAT', 'ACTION'].includes(type)) {
      const targetMatch = command.match(/(?:詢問|對著|向|攻擊|招募)\s*([^\s，。！？]+)/);
      if (targetMatch && targetMatch[1]) {
        this.state.interaction = { targetName: targetMatch[1], status: 'ACTIVE' };
      }
    }

    let log = "";
    const plotEvent = this.advanceTurn();

    try {
      switch (type) {
        case 'MOVE_LONG':
          log = this.handleTravel(payload);
          break;
        case 'REST':
          log = this.handleRest(1);
          break;
        case 'TRADE':
          log = this.handleTrade(payload);
          break;
        case 'TALK':
        case 'MOVE_SHORT':
        case 'COMBAT':
        case 'ACTION':
          log = `[SYSTEM] 執行行動：${type}\n- 指令內容：${payload}\n- 消耗 AP：${ap_cost}`;
          break;
        default:
          log = `[SYSTEM] 執行未知分類行動: ${type}`;
      }
    } catch (error: any) {
      this.state.actionPoints += ap_cost;
      throw error;
    }

    if (plotEvent) {
        log += `\n\n${plotEvent}`;
    }

    if (this.state.interaction.status === 'ACTIVE' && this.state.interaction.targetName) {
      log += `\n\n[CONSTRAINT] 當前互動鎖定對象：${this.state.interaction.targetName}。請維持與此角色的敘事連續性，禁止切換到其他角色或讓無關人員突然插話，直到玩家明確離開或變更目標。`;
    }

    return log;
  }

  private handleTravel(destinationInput: string): string {
    const currentLocKey = this.resolveLocationKey(this.state.location);
    const targetLocKey = this.resolveLocationKey(destinationInput);

    if (!currentLocKey || !targetLocKey) return `[SYSTEM] 導航錯誤：無法識別目標地點。`;
    if (currentLocKey === targetLocKey) return `[SYSTEM] 已位於目的地。`;

    const distance = this.getDistance(currentLocKey, targetLocKey);
    const daysNeeded = Math.ceil(distance / CONSTANTS.TRAVEL_SPEED);
    const fuelCost = Math.ceil(distance * CONSTANTS.FUEL_COST_PER_UNIT);

    if (this.state.credits < fuelCost) throw new Error(`信用點不足，需要 ${fuelCost} CR。`);

    this.state.credits -= fuelCost;
    this.advanceDate(daysNeeded);
    this.state.location = LOCATIONS[targetLocKey].name;

    return `[SYSTEM] 遠航紀錄：抵達 ${LOCATIONS[targetLocKey].name}，耗時 ${daysNeeded} 天，消耗 ${fuelCost} CR。`;
  }

  private handleRest(days: number = 1): string {
      const healAmount = 20 * days;
      this.state.health = Math.min(CONSTANTS.BASE_HP, this.state.health + healAmount);
      this.state.actionPoints = CONSTANTS.MAX_AP; 
      this.advanceDate(days);

      return `[SYSTEM] 休整紀錄：休息 ${days} 天。HP 恢復，AP 已完全補滿。`;
  }
}
