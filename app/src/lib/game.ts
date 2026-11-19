import type { GameState } from "./types";

export const XP = {
  flip: 2,
  learnKnew: 10,
  learnAgain: 3,
  testRight: 15,
  markLearned: 5,
  addPhrase: 10,
  matchPair: 4,
  writePerfect: 20,
  writeClose: 15,
  writeOverride: 10,
} as const;

/** Combo bonus: from the 3rd answer in a row, +2 per step, capped at +10. */
export function comboBonus(combo: number) {
  return combo >= 3 ? Math.min((combo - 2) * 2, 10) : 0;
}

/** XP needed to go from level n to n+1. */
export function needFor(level: number) {
  return 80 + level * 40;
}

const TITLES: [number, string][] = [
  [1, "新手"],
  [2, "破冰者"],
  [4, "聊天咖"],
  [6, "小組靈魂人物"],
  [9, "Coffee chat 常客"],
  [12, "Networking 高手"],
  [16, "Phrase 大師"],
  [20, "傳奇人物"],
];

export function levelInfo(xp: number) {
  let level = 1;
  let rest = xp;
  while (rest >= needFor(level)) {
    rest -= needFor(level);
    level++;
  }
  let title = TITLES[0][1];
  for (const [l, t] of TITLES) if (level >= l) title = t;
  return { level, into: rest, need: needFor(level), title };
}

export function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** A day counts towards the streak once it has at least this much XP. */
export const STREAK_MIN = 10;

export function streakOf(days: Record<string, number>) {
  let d = new Date();
  if ((days[dayKey(d)] ?? 0) < STREAK_MIN) d = addDays(d, -1);
  let n = 0;
  while ((days[dayKey(d)] ?? 0) >= STREAK_MIN) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function lastNDays(days: Record<string, number>, n: number) {
  const out: { key: string; label: string; xp: number; today: boolean }[] = [];
  const names = ["日", "一", "二", "三", "四", "五", "六"];
  for (let i = n - 1; i >= 0; i--) {
    const d = addDays(new Date(), -i);
    const key = dayKey(d);
    out.push({ key, label: names[d.getDay()], xp: days[key] ?? 0, today: i === 0 });
  }
  return out;
}

export interface AchCtx {
  learned: number;
  total: number;
  mastered: number;
  streak: number;
  level: number;
  custom: number;
  today: number;
  goal: number;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: "sprout" | "book" | "trophy" | "crown" | "flame" | "zap" | "target" | "timer" | "pen" | "medal" | "star" | "gem" | "mic" | "keyboard";
  check?: (c: AchCtx) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first", name: "第一步", desc: "學會第一個句子", icon: "sprout", check: (c) => c.learned >= 1 },
  { id: "l10", name: "漸入佳境", desc: "學會 10 個句子", icon: "book", check: (c) => c.learned >= 10 },
  { id: "l50", name: "半百", desc: "學會 50 個句子", icon: "medal", check: (c) => c.learned >= 50 },
  { id: "tab", name: "分類制霸", desc: "把一個分類全部學會", icon: "trophy", check: (c) => c.mastered >= 1 },
  { id: "all", name: "全收集", desc: "所有句子都學會", icon: "crown", check: (c) => c.total > 0 && c.learned >= c.total },
  { id: "goal", name: "今日達標", desc: "達成一次每日目標", icon: "target", check: (c) => c.today >= c.goal },
  { id: "s3", name: "三天不斷", desc: "連續 3 天學習", icon: "flame", check: (c) => c.streak >= 3 },
  { id: "s7", name: "一週全勤", desc: "連續 7 天學習", icon: "flame", check: (c) => c.streak >= 7 },
  { id: "lv5", name: "升到 5 級", desc: "累積經驗值到 Lv.5", icon: "star", check: (c) => c.level >= 5 },
  { id: "pen", name: "自己動手", desc: "新增一個自己的句子", icon: "pen", check: (c) => c.custom >= 1 },
  { id: "combo", name: "手感火燙", desc: "連續答對 10 題", icon: "zap" },
  { id: "perfect", name: "零失誤", desc: "測驗 5 題以上全對", icon: "gem" },
  { id: "fast", name: "閃電手", desc: "配對遊戲 30 秒內完成", icon: "timer" },
  { id: "speak", name: "開口說", desc: "用語音答對一題默寫", icon: "mic" },
  { id: "flawless", name: "一字不差", desc: "默寫 5 題以上全部完美", icon: "keyboard" },
];

export function achById(id: string) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export const DEFAULT_GAME: GameState = {
  xp: 0,
  days: {},
  ach: {},
  flips: { date: "", ids: [] },
  ever: [],
  bestMatch: {},
  bestCombo: 0,
  goal: 60,
};
