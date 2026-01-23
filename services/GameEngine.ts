
import { GameState, GameEvents, Skill, ActionCategory, ShopItem, GameOption, CheckDifficulty } from '../types';
import { CONSTANTS, LOCATIONS, ITEMS } from '../data/rules';
import { createSkill } from '../data/skills';

const TIMELINE: Record<number, string> = {
  3: "【世界事件】火星奧林帕斯山礦區爆發大規模罷工。",
  6: "【世界事件】EUG 宣佈對小行星帶實施『第7號過濾法案』。",
  10: "【重大變故】一艘滿載紅色晶體的運輸船在木星軌道離奇爆炸。",
  15: "【戰爭陰影】地球艦隊向土星環集結，局勢升級。",
  20: "【異象】各地傳出靈能者失控事件。",
  30: "【全面衝突】EUG 正式對自由民宣戰。"
};

const DIFFICULTY_MODIFIER: Record<string, number> = {
  'VERY_EASY': 30,
  'EASY': 10,
  'NORMAL': 0,
  'HARD': -20,
  'EXTREME': -40
};

// 預設技能不再寫死，而是嘗試從 DB 獲取，若失敗則保留 Fallback
const DEFAULT_SKILL_IDS = ['basic_hacking', 'kinetic_weapons', 'persuasion'];

export class GameEngine {
  private state: GameState;

  constructor(initialState: GameState) {
    this.state = JSON.parse(JSON.stringify(initialState));
    if (this.state.turn === undefined) this.state.turn = 1;
    if (this.state.worldStage === undefined) this.state.worldStage = 1;
    if (this.state.interaction === undefined) {
      this.state.interaction = { targetName: null, status: 'NONE' };
    }
    
    // 初始化技能邏輯重構
    if (!this.state.skills || this.state.skills.length === 0) {
        this.state.skills = [];
        DEFAULT_SKILL_IDS.forEach(id => {
            const skill = createSkill(id);
            if (skill) this.state.skills.push(skill);
        });
    }
  }

  public getState(): GameState {
    return this.state;
  }

  public setSkills(skills: Skill[]): void {
      // 嘗試標準化傳入的技能
      this.state.skills = [];
      skills.forEach(rawSkill => {
          // 優先嘗試用 ID 或 Name 從資料庫重建標準技能物件
          const dbSkill = createSkill(rawSkill.id) || createSkill(rawSkill.name);
          if (dbSkill) {
              // 保留傳入的等級與進度，但使用資料庫的描述與元數據
              this.state.skills.push({
                  ...dbSkill,
                  level: rawSkill.level ?? 1,
                  progress: rawSkill.progress ?? 0
              });
          } else {
              // 若資料庫無此技能，則使用傳入的原始數據 (Fallback)
              this.state.skills.push({
                  ...rawSkill,
                  progress: rawSkill.progress ?? 0,
                  level: rawSkill.level ?? 1,
                  maxLevel: rawSkill.maxLevel ?? 5
              });
          }
      });
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
             }
        }
    }
    if (events.new_item) {
        if (!this.state.inventory) this.state.inventory = [];
        this.state.inventory.push(events.new_item);
        logs.push(`[SYSTEM] 獲得物品: ${events.new_item}`);
    }
    
    // 標準化新技能獲取邏輯
    if (events.new_skill) {
        // 1. 嘗試從 DB 建立標準技能 (優先用 id 查，沒有則用 name)
        let skill = createSkill(events.new_skill.name);
        
        // 若 AI 給的物件有 id 且 name 查不到，嘗試用 id 查
        // @ts-ignore (兼容 AI 可能傳回 id 的情況)
        if (!skill && events.new_skill.id) {
             // @ts-ignore
             skill = createSkill(events.new_skill.id);
        }

        if (skill) {
            // 檢查是否已擁有
            const existing = this.state.skills.find(s => s.id === skill!.id);
            if (!existing) {
                this.state.skills.push(skill);
                logs.push(`[SYSTEM] 💡 領悟新技能: ${skill.name} (ID: ${skill.id})`);
            } else {
                logs.push(`[SYSTEM] 技能熟練度提升: ${skill.name}`);
                // 這裡未來可以加熟練度邏輯
            }
        } else {
            // Fallback: 如果 DB 找不到，則使用 AI 提供的原始數據 (防止報錯，但標記為非標準)
            const fallbackSkill: Skill = {
                id: events.new_skill.name.toLowerCase().replace(/\s/g, '_'),
                name: events.new_skill.name,
                level: 1,
                maxLevel: 5,
                description: events.new_skill.description,
                type: events.new_skill.type || 'INNATE',
                progress: 0
            };
            const existing = this.state.skills.find(s => s.name === fallbackSkill.name);
            if (!existing) {
                this.state.skills.push(fallbackSkill);
                logs.push(`[SYSTEM] 💡 領悟特殊技能: ${fallbackSkill.name}`);
            }
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
        
        // 將商品名稱加入庫存
        this.state.inventory.push(item.name);

        // 特殊物品邏輯 (保留兼容性)
        if (item.id === 'psionic_amp' || item.name.includes('靈能增幅器')) {
             if (!this.state.psionics) this.state.psionics = { level: 0, energy: 0, max_energy: 1, abilities: [] };
             this.state.psionics.max_energy += 1;
             this.state.psionics.energy = this.state.psionics.max_energy;
        }

        return `[SYSTEM] 交易成功：\n- 購買物品：${item.name}\n- 支付：${item.price} CR\n- 剩餘餘額：${this.state.credits} CR\n- 物品描述：${item.description}`;

    } else {
        const sellPrice = Math.floor(item.price * 0.5);
        const idx = this.state.inventory.indexOf(item.name);
        
        if (idx === -1) return `[SYSTEM] 交易失敗：你的庫存中沒有 "${item.name}"。`;
        
        this.state.inventory.splice(idx, 1);
        this.state.credits += sellPrice;

        return `[SYSTEM] 交易成功：\n- 出售物品：${item.name}\n- 獲得：${sellPrice} CR\n- 剩餘餘額：${this.state.credits} CR`;
    }
  }

  private calculateSuccessChance(skillId: string, difficulty: CheckDifficulty): number {
      // 增強查找邏輯：支援 ID 或 Name
      const skill = this.state.skills.find(s => 
          s.id === skillId || 
          s.name === skillId || 
          s.id.includes(skillId) ||
          (createSkill(skillId) && s.id === createSkill(skillId)!.id) // 嘗試正規化 ID 後查找
      );
      
      const level = skill ? skill.level : 0;
      const modifier = DIFFICULTY_MODIFIER[difficulty] || 0;
      // Formula: Base 30% + (Level * 5) + Modifier
      let chance = 30 + (level * 5) + modifier;
      return Math.max(0, Math.min(100, chance));
  }

  public processAction(input: string | { type: string, payload: any }, option?: Partial<GameOption>): string {
    // 1. Determine Action Type and Cost
    let actionType: string = 'TALK';
    let apCost: number = 0;
    let payload: any = input;

    if (typeof input === 'object' && input.type) {
        // Handle complex payload (e.g., TRADE from ShopModal)
        actionType = input.type;
        payload = input.payload || input;
    } else {
        // Handle standard text input or option click
        actionType = option?.action_type || 'TALK';
        apCost = option?.ap_cost || 0;
    }

    // 2. Check AP (Cost 0 actions pass automatically)
    if (apCost > 0 && this.state.actionPoints < apCost) {
      throw new Error(`體力透支，無法執行此高強度行動 (需要 ${apCost} AP，當前僅剩 ${this.state.actionPoints})。建議進行休整 (REST)。`);
    }

    // 3. Deduct AP
    this.state.actionPoints -= apCost;

    // 4. Update Interaction State
    const command = typeof input === 'string' ? input : JSON.stringify(input);
    if (['MOVE_SHORT', 'MOVE_LONG', 'REST'].includes(actionType)) {
      this.state.interaction = { targetName: null, status: 'NONE' };
    } else if (['TALK', 'COMBAT', 'ACTION'].includes(actionType)) {
      const targetMatch = command.match(/(?:詢問|對著|向|攻擊|招募)\s*([^\s，。！？]+)/);
      if (targetMatch && targetMatch[1]) {
        this.state.interaction = { targetName: targetMatch[1], status: 'ACTIVE' };
      }
    }

    let log = "";
    const plotEvent = this.advanceTurn();

    // 5. Execute Action Logic
    try {
      switch (actionType) {
        case 'MOVE_LONG':
          log = this.handleTravel(command);
          break;
        case 'REST':
          log = this.handleRest(1);
          break;
        case 'TRADE':
          log = this.handleTrade(payload);
          break;
        default:
          log = `[SYSTEM] 執行行動：${actionType}\n- 指令內容：${command}\n- 消耗 AP：${apCost}`;
      }

      // 6. Skill Check Logic
      if (option && option.requiredSkill && option.difficulty) {
          const skillId = option.requiredSkill;
          const chance = this.calculateSuccessChance(skillId, option.difficulty);
          const roll = Math.floor(Math.random() * 100) + 1;
          const isSuccess = roll <= chance;
          const resultText = isSuccess ? "成功" : "失敗";
          
          // Try to find readable skill name
          const skill = this.state.skills.find(s => s.id === skillId || s.name === skillId || s.id.includes(skillId));
          const skillDisplayName = skill ? `${skill.name} (LV.${skill.level})` : `${skillId} (LV.0)`;

          const checkLog = `\n\n[SYSTEM] 技能檢定(${skillDisplayName}): ${resultText} (骰出 ${roll} vs 目標 ${chance}%)\n結果：${isSuccess ? '行動順利執行' : '觸發失敗懲罰或負面後果'}。`;
          log += checkLog;
      }

    } catch (error: any) {
      this.state.actionPoints += apCost; // Refund AP on error
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
