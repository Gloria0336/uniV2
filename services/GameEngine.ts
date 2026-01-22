
import { GameState } from '../types';
import { CONSTANTS, LOCATIONS, ITEMS } from '../data/rules';

export class GameEngine {
  private state: GameState;

  constructor(initialState: GameState) {
    // 建立深拷貝以避免直接修改 React 狀態，確保狀態管理的純粹性
    this.state = JSON.parse(JSON.stringify(initialState));
  }

  /**
   * 取得當前引擎內部的最新狀態
   */
  public getState(): GameState {
    return this.state;
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
            if (itemId === 'cyber_eye') {
                 // 這裡可以透過修改 hidden stats 或僅記錄在 log 讓 AI 知道
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
