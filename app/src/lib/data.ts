import { RAW } from "./raw";
import type { Item, TabKey, Tone } from "./types";

export const TABS: { k: TabKey; n: string; short: string }[] = [
  { k: "chat", n: "日常聊天", short: "聊天" },
  { k: "coffee", n: "Coffee chat / 面試", short: "Coffee chat" },
  { k: "class", n: "課堂・簡報・會議", short: "課堂" },
  { k: "vocab", n: "單字", short: "單字" },
];

export const TONES: Tone[] = ["casual", "neutral", "formal"];

export const BUILTIN: Item[] = TABS.flatMap((t) =>
  RAW[t.k].map((r, i) => ({
    id: t.k + (i + 1),
    tab: t.k,
    sec: r[0],
    en: r[1],
    zh: r[2],
    ex: r[3],
    tone: r[4],
    custom: false,
  })),
);

export function tabName(k: TabKey) {
  return TABS.find((t) => t.k === k)?.n ?? k;
}

export function shuffle<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
