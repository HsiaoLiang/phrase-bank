export type QuestKind = "xp" | "lessons" | "perfect" | "combo" | "write" | "match" | "learn" | "hard" | "legend" | "boss";

export interface QuestDef {
  id: string;
  kind: QuestKind;
  target: number;
  title: string;
  reward: number;
}

const XP_QUESTS: QuestDef[] = [
  { id: "xp40", kind: "xp", target: 40, title: "拿到 40 XP", reward: 10 },
  { id: "xp80", kind: "xp", target: 80, title: "拿到 80 XP", reward: 15 },
  { id: "xp120", kind: "xp", target: 120, title: "拿到 120 XP", reward: 20 },
];

const OTHER: QuestDef[] = [
  { id: "les2", kind: "lessons", target: 2, title: "完成 2 個關卡", reward: 15 },
  { id: "les3", kind: "lessons", target: 3, title: "完成 3 個關卡", reward: 20 },
  { id: "perf1", kind: "perfect", target: 1, title: "零失誤完成 1 個關卡", reward: 20 },
  { id: "combo8", kind: "combo", target: 8, title: "連續答對 8 題", reward: 15 },
  { id: "combo12", kind: "combo", target: 12, title: "連續答對 12 題", reward: 20 },
  { id: "write5", kind: "write", target: 5, title: "默寫或聽寫答對 5 題", reward: 15 },
  { id: "match1", kind: "match", target: 1, title: "完成 1 次配對遊戲", reward: 10 },
  { id: "learn5", kind: "learn", target: 5, title: "學會 5 個新句子", reward: 15 },
  { id: "hard1", kind: "hard", target: 1, title: "用困難以上的難度過 1 關", reward: 20 },
  { id: "hard2", kind: "hard", target: 2, title: "用困難以上的難度過 2 關", reward: 30 },
  { id: "legend1", kind: "legend", target: 1, title: "通過 1 個傳奇關卡", reward: 30 },
  { id: "boss1", kind: "boss", target: 1, title: "通過 1 次單元考", reward: 30 },
];

/** Max-type quests track the best value of the day rather than a running total. */
export const MAX_KINDS: QuestKind[] = ["combo"];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Three quests per day, the same all day: one XP quest plus two others of different kinds. */
export function questsFor(date: string): QuestDef[] {
  const h = hash(date);
  const xp = XP_QUESTS[h % XP_QUESTS.length];
  const pool = OTHER.slice();
  const picked: QuestDef[] = [];
  let k = h;
  while (picked.length < 2 && pool.length) {
    k = Math.imul(k ^ (k >>> 13), 1274126177) >>> 0;
    const q = pool.splice(k % pool.length, 1)[0];
    if (!picked.some((p) => p.kind === q.kind)) picked.push(q);
  }
  return [xp, ...picked];
}

export function msUntilMidnight(now = new Date()) {
  const m = new Date(now);
  m.setHours(24, 0, 0, 0);
  return m.getTime() - now.getTime();
}
