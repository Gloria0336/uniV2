
import { GameState, GameEvents, Skill, ActionCategory, ShopItem, GameOption, CheckDifficulty, ItemStats, EquipmentSlotType, InventorySlot, ActiveBuff } from '../types';
import { CONSTANTS, LOCATIONS, ITEMS } from '../data/rules';
import { createSkill } from '../data/skills';
import { getItemDef } from '../data/items';

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

    // Initialize Equipment
    if (!this.state.equipment) {
        this.state.equipment = {
            HEAD: null,
            BODY: null,
            MAIN_HAND: null,
            OFF_HAND: null,
            IMPLANT: null
        };
    }

    // Initialize Active Buffs
    if (!this.state.activeBuffs) {
        this.state.activeBuffs = [];
    }
    
    // Convert legacy inventory (string[]) to new InventorySlot[] if necessary
    if (this.state.inventory && this.state.inventory.length > 0 && typeof this.state.inventory[0] === 'string') {
        const legacyInv = this.state.inventory as unknown as string[];
        this.state.inventory = [];
        legacyInv.forEach((name) => {
             // Fallback cleanup
        });
    } else if (!this.state.inventory) {
        this.state.inventory = [];
    }

    this.recalculateStats();
  }

  public getState(): GameState {
    return this.state;
  }

  private recalculateStats(): void {
    const stats: ItemStats = {
      attack: 1,
      defense: 0,
      hpMax: CONSTANTS.BASE_HP,
      apMax: CONSTANTS.MAX_AP,
      critRate: 0,
      escapeRate: 0,
      psionicPower: this.state.psionics?.level ? this.state.psionics.level * 10 : 0
    };

    // 1. Sum Equipment Stats
    Object.values(this.state.equipment).forEach((slot) => {
      if (slot) {
        const itemDef = getItemDef(slot.itemId);
        if (itemDef && itemDef.stats) {
          this.mergeStats(stats, itemDef.stats);
        }
      }
    });

    // 2. Sum Active Buffs
    if (this.state.activeBuffs) {
        this.state.activeBuffs.forEach(buff => {
            if (buff.stat) {
                stats[buff.stat] = (stats[buff.stat] || 0) + buff.value;
            }
        });
    }

    this.state.computedStats = stats;
    // 確保生命值不超過上限
    const currentMax = stats.hpMax || 100;
    if (this.state.health > currentMax) this.state.health = currentMax;
  }

  private mergeStats(base: ItemStats, add: ItemStats) {
      base.attack = (base.attack || 0) + (add.attack || 0);
      base.defense = (base.defense || 0) + (add.defense || 0);
      base.hpMax = (base.hpMax || 0) + (add.hpMax || 0);
      base.apMax = (base.apMax || 0) + (add.apMax || 0);
      base.critRate = (base.critRate || 0) + (add.critRate || 0);
      base.escapeRate = (base.escapeRate || 0) + (add.escapeRate || 0);
      base.psionicPower = (base.psionicPower || 0) + (add.psionicPower || 0);
  }

  public addItem(itemId: string, quantity: number = 1): string {
    const itemDef = getItemDef(itemId);
    // If item not in DB, create a dummy item to prevent crash if AI generated it
    const name = itemDef ? itemDef.name : itemId;
    const maxStack = itemDef ? itemDef.maxStack : 1;

    // 堆疊處理
    if (maxStack > 1) {
      const existingSlot = this.state.inventory.find(slot => slot.itemId === itemId && slot.quantity < maxStack);
      if (existingSlot) {
        const space = maxStack - existingSlot.quantity;
        const add = Math.min(space, quantity);
        existingSlot.quantity += add;
        quantity -= add;
        if (quantity === 0) return `[SYSTEM] 獲得 ${name} x${add}`;
      }
    }

    // 新增格子
    while (quantity > 0) {
      if (this.state.inventory.length >= 20) return `[SYSTEM] 背包已滿，無法拾取 ${name}`;
      const add = Math.min(quantity, maxStack);
      this.state.inventory.push({ itemId, quantity: add });
      quantity -= add;
    }
    return `[SYSTEM] 獲得 ${name}`;
  }

  public removeItem(itemId: string, quantity: number = 1): boolean {
    for (let i = this.state.inventory.length - 1; i >= 0; i--) {
      if (this.state.inventory[i].itemId === itemId) {
        if (this.state.inventory[i].quantity > quantity) {
          this.state.inventory[i].quantity -= quantity;
          return true;
        } else {
          quantity -= this.state.inventory[i].quantity;
          this.state.inventory.splice(i, 1);
          if (quantity === 0) return true;
        }
      }
    }
    return false;
  }

  private removeItemFromSlot(index: number, quantity: number) {
      if (this.state.inventory[index] && this.state.inventory[index].quantity > quantity) {
          this.state.inventory[index].quantity -= quantity;
      } else {
          this.state.inventory.splice(index, 1);
      }
  }

  public equipItem(inventoryIndex: number): string {
    const slotData = this.state.inventory[inventoryIndex];
    if (!slotData) return "無效的物品位置";

    const itemDef = getItemDef(slotData.itemId);
    if (!itemDef || itemDef.category !== 'EQUIPMENT' || !itemDef.equipSlot) return "此物品無法裝備";
    if (itemDef.requiredLevel && this.state.level < itemDef.requiredLevel) {
        return `等級不足 (需要 LV.${itemDef.requiredLevel})`;
    }

    const targetSlot = itemDef.equipSlot;
    const currentEquip = this.state.equipment[targetSlot];

    // 移除背包中的物品
    this.removeItemFromSlot(inventoryIndex, 1);

    // 若有舊裝備則卸下
    if (currentEquip) {
        this.addItem(currentEquip.itemId, 1);
    }

    // 裝備新物品
    this.state.equipment[targetSlot] = { itemId: itemDef.id, quantity: 1 };
    this.recalculateStats();

    return `[SYSTEM] 已裝備 ${itemDef.name}`;
  }

  public unequipItem(slot: EquipmentSlotType): string {
    const currentEquip = this.state.equipment[slot];
    if (!currentEquip) return "該欄位沒有裝備";
    if (this.state.inventory.length >= 20) return "背包已滿";

    this.state.equipment[slot] = null;
    this.addItem(currentEquip.itemId, 1);
    this.recalculateStats();

    return `[SYSTEM] 已卸下裝備`;
  }

  public useItem(inventoryIndex: number): string {
    const slot = this.state.inventory[inventoryIndex];
    if (!slot) return "無效物品";
    
    const itemDef = getItemDef(slot.itemId);
    if (!itemDef) return "物品資料錯誤";

    // A. 裝備類：引導去裝備
    if (itemDef.category === 'EQUIPMENT') {
        return this.equipItem(inventoryIndex);
    }

    // B. 任務類：僅消耗並提示
    if (itemDef.category === 'QUEST') {
        this.removeItemFromSlot(inventoryIndex, 1);
        return `[SYSTEM] 使用了任務道具：${itemDef.name}。(已從背包移除)`;
    }

    // C. 消耗品類
    if (itemDef.category === 'CONSUMABLE' && itemDef.effect) {
        this.removeItemFromSlot(inventoryIndex, 1);
        const eff = itemDef.effect;
        let msg = `使用 ${itemDef.name}`;

        if (eff.type === 'HEAL') {
            const max = this.state.computedStats.hpMax || 100;
            const oldHp = this.state.health;
            this.state.health = Math.min(max, this.state.health + eff.value);
            msg += `，恢復了 ${this.state.health - oldHp} 點生命。`;
        } 
        else if (eff.type === 'RESTORE_AP') {
            const max = this.state.computedStats.apMax || 5;
            this.state.actionPoints = Math.min(max, this.state.actionPoints + eff.value);
            msg += `，回復了 ${eff.value} AP。`;
        }
        else if (eff.type === 'BUFF' && eff.targetStat && eff.duration) {
            if (!this.state.activeBuffs) this.state.activeBuffs = [];
            this.state.activeBuffs.push({
                id: itemDef.id,
                name: eff.description || itemDef.name,
                stat: eff.targetStat,
                value: eff.value,
                turnsRemaining: eff.duration,
                icon: itemDef.icon
            });
            this.recalculateStats();
            msg += `，獲得狀態 [${eff.description}] (${eff.duration}回合)。`;
        }
        
        return `[SYSTEM] ${msg}`;
    }

    return "此物品無法直接使用";
  }

  public setSkills(skills: Skill[]): void {
      this.state.skills = [];
      skills.forEach(rawSkill => {
          const dbSkill = createSkill(rawSkill.id) || createSkill(rawSkill.name);
          if (dbSkill) {
              this.state.skills.push({
                  ...dbSkill,
                  level: rawSkill.level ?? 1,
                  progress: rawSkill.progress ?? 0
              });
          } else {
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
    let log = "";
    
    // Buff 處理
    const expiredBuffs: string[] = [];
    if (this.state.activeBuffs && this.state.activeBuffs.length > 0) {
        this.state.activeBuffs.forEach(buff => buff.turnsRemaining -= 1);
        
        // 移除過期 Buff
        const active = this.state.activeBuffs.filter(b => b.turnsRemaining > 0);
        const expired = this.state.activeBuffs.filter(b => b.turnsRemaining <= 0);
        
        this.state.activeBuffs = active;
        expired.forEach(b => expiredBuffs.push(b.name));
        
        if (expired.length > 0) this.recalculateStats();
    }
    
    if (expiredBuffs.length > 0) {
        log += `[SYSTEM] 效果已結束: ${expiredBuffs.join(', ')}\n`;
    }

    const currentTurn = this.state.turn;
    if (currentTurn >= 10 && this.state.worldStage < 2) this.state.worldStage = 2;
    if (currentTurn >= 20 && this.state.worldStage < 3) this.state.worldStage = 3;
    
    if (TIMELINE[currentTurn]) {
        log += `[PLOT EVENT - TURN ${currentTurn}] ${TIMELINE[currentTurn]}`;
    }
    
    return log.trim() || null;
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
      this.state.health = Math.max(0, Math.min(this.state.computedStats?.hpMax || CONSTANTS.BASE_HP, this.state.health + events.hp_change));
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
        const logMsg = this.addItem(events.new_item, 1);
        logs.push(logMsg);
    }
    
    if (events.new_skill) {
        let skill = createSkill(events.new_skill.name);
        // @ts-ignore
        if (!skill && events.new_skill.id) {
             // @ts-ignore
             skill = createSkill(events.new_skill.id);
        }

        if (skill) {
            const existing = this.state.skills.find(s => s.id === skill!.id);
            if (!existing) {
                this.state.skills.push(skill);
                logs.push(`[SYSTEM] 💡 領悟新技能: ${skill.name} (ID: ${skill.id})`);
            } else {
                logs.push(`[SYSTEM] 技能熟練度提升: ${skill.name}`);
            }
        } else {
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

        const addMsg = this.addItem(item.id, 1);
        if (addMsg.includes("背包已滿")) {
            return `[SYSTEM] 交易失敗：背包已滿。`;
        }

        this.state.credits -= item.price;
        return `[SYSTEM] 交易成功：\n- 購買物品：${item.name}\n- 支付：${item.price} CR\n- 剩餘餘額：${this.state.credits} CR\n${addMsg}`;

    } else {
        const sellPrice = Math.floor(item.price * 0.5);
        const removed = this.removeItem(item.id, 1);
        
        if (!removed) return `[SYSTEM] 交易失敗：你的庫存中沒有 "${item.name}"。`;
        
        this.state.credits += sellPrice;
        return `[SYSTEM] 交易成功：\n- 出售物品：${item.name}\n- 獲得：${sellPrice} CR\n- 剩餘餘額：${this.state.credits} CR`;
    }
  }

  private calculateSuccessChance(skillId: string, difficulty: CheckDifficulty): number {
      const skill = this.state.skills.find(s => 
          s.id === skillId || 
          s.name === skillId || 
          s.id.includes(skillId) ||
          (createSkill(skillId) && s.id === createSkill(skillId)!.id)
      );
      
      const level = skill ? skill.level : 0;
      const modifier = DIFFICULTY_MODIFIER[difficulty] || 0;
      let chance = 40 + (level * 5) + modifier;
      return Math.max(0, Math.min(100, chance));
  }

  public processAction(input: string | { type: string, payload: any }, option?: Partial<GameOption>): string {
    let actionType: string = 'TALK';
    let apCost: number = 0;
    let payload: any = input;

    if (typeof input === 'object' && input.type) {
        actionType = input.type;
        payload = input.payload || input;
    } else {
        actionType = option?.action_type || 'TALK';
        apCost = option?.ap_cost || 0;
    }

    if (apCost > 0 && this.state.actionPoints < apCost) {
      throw new Error(`體力透支，無法執行此高強度行動 (需要 ${apCost} AP，當前僅剩 ${this.state.actionPoints})。建議進行休整 (REST)。`);
    }

    this.state.actionPoints -= apCost;

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

      if (option && option.requiredSkill && option.difficulty) {
          const skillId = option.requiredSkill;
          const chance = this.calculateSuccessChance(skillId, option.difficulty);
          const roll = Math.floor(Math.random() * 100) + 1;
          const isSuccess = roll <= chance;
          const resultText = isSuccess ? "成功" : "失敗";
          
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
      this.state.health = Math.min(this.state.computedStats?.hpMax || CONSTANTS.BASE_HP, this.state.health + healAmount);
      this.state.actionPoints = this.state.computedStats?.apMax || CONSTANTS.MAX_AP; 
      this.advanceDate(days);

      return `[SYSTEM] 休整紀錄：休息 ${days} 天。HP 恢復，AP 已完全補滿。`;
  }
}
