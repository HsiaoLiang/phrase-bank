export type Level = 1 | 2 | 3;

export interface Rules {
  name: string;
  /** per-question countdown */
  timer: boolean;
  grading: "lenient" | "hard" | "strict";
  /** mistakes allowed before the lesson fails (null = no limit, hearts apply instead) */
  mistakes: number | null;
  /** wrong answers come back at the end of the lesson */
  retry: boolean;
  xp: number;
  gems: number;
  hearts: boolean;
}

export const LEVEL_NAME: Record<Level, string> = { 1: "一般", 2: "困難", 3: "傳奇" };

export function rulesFor(level: Level, boss = false): Rules {
  if (boss) return { name: "單元考", timer: true, grading: "hard", mistakes: 3, retry: false, xp: 2, gems: 30, hearts: false };
  if (level === 3) return { name: "傳奇", timer: true, grading: "strict", mistakes: 3, retry: false, xp: 2, gems: 15, hearts: false };
  if (level === 2) return { name: "困難", timer: true, grading: "hard", mistakes: null, retry: true, xp: 1.5, gems: 0, hearts: true };
  return { name: "一般", timer: false, grading: "lenient", mistakes: null, retry: true, xp: 1, gems: 0, hearts: true };
}

export const LEVEL_DESC: Record<Level, string> = {
  1: "選擇題為主，評分寬鬆",
  2: "限時、相似干擾項、填空與找錯字，只容許一個小錯字",
  3: "全部自己打、限時更短、一字不差，錯 3 題以上就失敗",
};
