
export interface NPCInfo {
  name: string;
  title: string;
  faction: string;
  location: string; // 概略位置或勢力範圍
  personality: string;
  description: string;
  imageUrl?: string; // New: 用於顯示 NPC 靜態立繪
  gm_notes?: string; // 給 GM/AI 的扮演或敘事提示
}

export const KEY_NPCS: NPCInfo[] = [
  // --- 地球聯合政府 EUG ---
  {
    name: "林．赫爾曼 (Lin Herrmann)",
    title: "警察部高階調度官",
    faction: "EUG",
    location: "地球/月球 - 核心行政區",
    personality: "不殘忍，但毫不猶豫；真心相信「秩序能保護更多人」。說話語速平穩、幾乎沒有情緒起伏。",
    description: "系統的臉、秩序的執行者。穿著純白警察部制服，線條極度簡潔。私下接受過「自愈能力」相關改造（未承認）。",
    imageUrl: "/images/npcs/lin_herrmann.jpg",
    gm_notes: "敘事用途：可作為玩家的官方接觸窗口。可能成為合作夥伴、追捕者，或在關鍵時刻放玩家一馬的人。"
  },
  {
    name: "艾娃．宋 (Ava Song)",
    title: "靈能採集計畫負責人",
    faction: "EUG (聯合礦業)",
    location: "聯合礦業實驗室",
    personality: "不相信宗教，也不完全信任政府，只信「數據能說話」。眼神疲憊但專注。",
    description: "政府內部的「灰色科學家」，永遠穿著實驗服或商務外套。無個人靈能，但熟知大量靈能試驗資料（含失敗案例）。",
    imageUrl: "/images/npcs/ava_song.jpg",
    gm_notes: "敘事用途：黑市資料外流的「可能源頭之一」。可被玩家勒索、保護，或逼迫揭露真相。"
  },
  {
    name: "馬庫斯．雷恩 (Marcus Rane)",
    title: "政府軍前線軍官",
    faction: "EUG (政府軍)",
    location: "前線戰區",
    personality: "尊重力量，但厭惡謊言；對靈能既警惕又敬畏。",
    description: "明顯戰傷，與高層格格不入。無靈能，但對靈能戰術極為熟悉。",
    imageUrl: "/images/npcs/marcus_rane.jpg",
    gm_notes: "敘事用途：第一批「親眼見證政府軍失利」的人。可能成為叛逃者、吹哨者，或殉職的象徵人物。"
  },
  {
    name: "赫克托．瓦倫 (Hector Valen)",
    title: "礦區最高負責人",
    faction: "EUG (聯合礦業)",
    location: "前線大型礦區",
    personality: "利益至上主義者。不相信任何理念，只相信「回報」。對政府忠誠是因為目前仍有利。",
    description: "穿著偏軍事化的企業制服，常配戴武器。擁有私人武裝礦區防衛隊。態度務實：「有用就用，失控就處理掉。」",
    imageUrl: "/images/npcs/hector_valen.jpg",
    gm_notes: "敘事用途：黑市靈能試驗資料的間接提供者。可作為玩家金主、黑心雇主。GM提示：他「不是反派」，但極可能在第一轉折點後失勢或轉向極端。"
  },
  // --- 紅教 Red Cult ---
  {
    name: "伊拉斯 (Iras)",
    title: "紅階祭司",
    faction: "RED_CULT",
    location: "土星泰坦星",
    personality: "溫和、幾乎不像狂信者。真心相信靈能是祝福；對「被犧牲者」抱持愧疚。",
    description: "教義的詮釋者。紅色兜帽，鑲邊略有磨損。擁有輕度靈能（感知/預兆類），從不主動使用於戰鬥。",
    imageUrl: "/images/npcs/iras.jpg",
    gm_notes: "敘事用途：可向玩家提供紅教內部觀點；可能質疑教內極端行為。"
  },
  {
    name: "塞拉 (Serah)",
    title: "荊棘修女",
    faction: "RED_CULT",
    location: "依任務變動",
    personality: "信仰即行動；對「假覺醒者」毫不留情。眼神冷靜、幾乎沒有遲疑。",
    description: "行動派、暗線威脅。擁有戰鬥型靈能技能（數量少但效果強），技能描述極為抽象、難以預測。",
    imageUrl: "/images/npcs/serah.jpg",
    gm_notes: "敘事用途：可成為盟友、暗殺者，或玩家的長期對手。"
  },
  {
    name: "無名朝聖者 (No-Name Pilgrim)",
    title: "底層信徒",
    faction: "RED_CULT",
    location: "隨機出現",
    personality: "極度虔誠，對靈能者毫不畏懼。",
    description: "民間視角的信仰載體。幾乎沒有固定外觀。無正式技能，但「異常幸運」。",
    imageUrl: "/images/npcs/pilgrim.jpg",
    gm_notes: "敘事用途：可作為預言／象徵出現；生死不定，重複出現會產生不安感。"
  },
  {
    name: "卡洛斯 (Karlos)",
    title: "血誓祭司 (激進派)",
    faction: "RED_CULT",
    location: "衝突熱區",
    personality: "狂熱凌駕一切；世界只有「奉獻者」與「褻瀆者」。認為靈能是「試煉本身」。",
    description: "紅色兜帽邊緣染成暗色（疑似血跡）；肢體語言激烈。靈能強度不高但使用頻率極高；常在精神與身體極限邊緣行動。",
    imageUrl: "/images/npcs/karlos.jpg",
    gm_notes: "敘事用途：激進行動煽動者。不適合長期談判。適合引爆衝突、製造不可逆事件、測試玩家立場。"
  },
  // --- 自由民與其他 Free People ---
  {
    name: "奇米拉 (Chimera)",
    title: "靈能領袖",
    faction: "FREE_PEOPLE",
    location: "自由民據點",
    personality: "崇尚實力；不相信任何大敘事。",
    description: "身體有明顯改造痕跡；風格混亂但實用。多技能者（接近上限）；技能彼此風格差異極大。",
    imageUrl: "/images/npcs/chimera.jpg",
    gm_notes: "敘事用途：證明「自由民也能建立秩序」的例子。可被玩家挑戰、取代或合作；非必然反派。"
  },
  {
    name: "「鴉眼」羅薩 (Rosa, the Crow Eye)",
    title: "情報販子",
    faction: "FREE_PEOPLE (天眼閣)",
    location: "黑市/暗網",
    personality: "相信資訊比力量更危險；對所有勢力保持距離。",
    description: "永遠戴著視覺輔助裝置；說話真假難辨。使用低度感知型技能，與科技高度混用。",
    imageUrl: "/images/npcs/rosa.jpg",
    gm_notes: "敘事用途：敘事破壞者。能同時賣給玩家三種互相矛盾的真相；GM 調整世界敘事的關鍵工具。"
  },
  {
    name: "赫茲 (Hertz)",
    title: "老工匠",
    faction: "FREE_PEOPLE",
    location: "工坊",
    personality: "對政府與宗教都失望；只想「把東西修好」。",
    description: "年老、身體半機械化；說話慢，但判斷極準。能製作「與靈能高度相容的裝置」。",
    imageUrl: "/images/npcs/hertz.jpg",
    gm_notes: "敘事用途：裝備升級來源；也可能掌握關鍵技術秘密。"
  },
  {
    name: "「觀測者」 (The Observer)",
    title: "天眼閣閣主",
    faction: "UNKNOWN",
    location: "暗網深處",
    personality: "對權力無感，對「資訊如何改變世界」著迷；不在乎輸贏，只在乎「誰知道真相」。",
    description: "幾乎不以實體出現（暗網節點、代理帳號）。世界觀解釋器。靈能狀態不明。",
    imageUrl: "/images/npcs/observer.jpg",
    gm_notes: "接觸規則：不主動接觸玩家。僅在玩家多次影響平衡或讓既有敘事無法成立時現身。提供絕密真相或更高層次疑問。"
  }
];
