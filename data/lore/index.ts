
import { KEY_NPCS } from './npcs';
import { TIMELINE_DATA, WORLD_RULES, GAME_START_YEAR } from './timeline';
import { FACTION_LORE } from './factions';

export function getSystemLore(currentTurn: number = 1): string {
  const currentYear = GAME_START_YEAR + Math.floor((currentTurn - 1) / 10); // 假設每10回合為一年，可自行調整
  
  const npcText = KEY_NPCS.map(n => 
    `- ${n.name} [${n.faction}]: ${n.title}。${n.description} (GM Note: ${n.gm_notes})`
  ).join('\n');

  const timelineText = Object.entries(TIMELINE_DATA)
    .map(([year, event]) => `${year}年: ${event}`)
    .join('\n');

  return `
=== 太陽系資料庫 (Lore Database) ===
【世界規則】
${WORLD_RULES.join('\n')}

【時間軸與當前局勢】
當前年份推估: ${currentYear} (回合: ${currentTurn})
歷史大事記:
${timelineText}

【關鍵人物檔案 (Key NPCs)】
請在適當時機讓這些角色登場，或提及他們的動向：
${npcText}

【勢力概況】
${Object.values(FACTION_LORE).map(f => `- ${f.name}: ${f.description}`).join('\n')}
`;
}
