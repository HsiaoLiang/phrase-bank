import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BUILTIN, TABS } from "./data";
import {
  ACHIEVEMENTS,
  DEFAULT_GAME,
  GEMS,
  HEART_REGEN_MS,
  MAX_HEARTS,
  SHOP,
  STREAK_MIN,
  XP,
  addDays,
  dayKey,
  heartsNow,
  levelInfo,
  streakOf,
  type ShopItem,
} from "./game";
import { confetti, floatFx, floatXP, toast } from "./fx";
import { buildPath } from "./path";
import { MAX_KINDS, questsFor, type QuestKind } from "./quests";
import { setSoundEnabled, sfx } from "./sound";
import type { GameState, Item, TabKey } from "./types";

function withQuest(g: GameState, kind: QuestKind, n: number): GameState {
  const k = dayKey();
  const q = g.quests.date === k ? g.quests : { date: k, progress: {}, claimed: [] };
  const cur = q.progress[kind] ?? 0;
  const v = MAX_KINDS.includes(kind) ? Math.max(cur, n) : cur + n;
  if (v === cur && g.quests.date === k) return g;
  return { ...g, quests: { ...q, progress: { ...q.progress, [kind]: v } } };
}

const LS_BANK = "phraseBank.v1";
const LS_GAME = "phraseBank.game";

type Point = { x: number; y: number } | null | undefined;

export type Celebration =
  | { id: number; type: "level"; level: number; title: string }
  | { id: number; type: "ach"; ach: string }
  | { id: number; type: "goal"; goal: number };

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeJSON(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable */
  }
}

interface BankSnap {
  fav?: string[];
  learned?: string[];
  custom?: Item[];
  game?: Partial<GameState>;
}

function normaliseGame(g: Partial<GameState> | null | undefined, learned: string[]): GameState {
  const out: GameState = { ...DEFAULT_GAME, ...(g ?? {}) };
  out.days = { ...(g?.days ?? {}) };
  out.ach = { ...(g?.ach ?? {}) };
  out.bestMatch = { ...(g?.bestMatch ?? {}) };
  out.flips = g?.flips && Array.isArray(g.flips.ids) ? g.flips : { date: "", ids: [] };
  // Phrases already learned before the game existed never pay out "first time learned" XP again.
  out.ever = Array.from(new Set([...(g?.ever ?? []), ...learned]));
  out.frozen = Array.isArray(g?.frozen) ? [...g.frozen] : [];
  out.path = { ...(g?.path ?? {}) };
  out.mistakes = { ...(g?.mistakes ?? {}) };
  out.settings = { ...DEFAULT_GAME.settings, ...(g?.settings ?? {}) };
  out.quests = g?.quests && g.quests.progress ? { ...g.quests, claimed: [...(g.quests.claimed ?? [])] } : { date: "", progress: {}, claimed: [] };
  return out;
}

function useBankState() {
  const initial = useMemo(() => {
    const b = readJSON<BankSnap>(LS_BANK) ?? {};
    const learned = b.learned ?? [];
    return {
      fav: new Set(b.fav ?? []),
      learned: new Set(learned),
      custom: (b.custom ?? []).filter((c) => c && c.en && c.zh),
      game: normaliseGame(readJSON<GameState>(LS_GAME), learned),
    };
  }, []);

  const [fav, setFav] = useState<Set<string>>(initial.fav);
  const [learned, setLearnedSet] = useState<Set<string>>(initial.learned);
  const [custom, setCustom] = useState<Item[]>(initial.custom);
  const [game, setGame] = useState<GameState>(initial.game);
  const [celebs, setCelebs] = useState<Celebration[]>([]);
  const [synced, setSynced] = useState<"local" | "cloud">("local");
  const cid = useRef(0);

  const items = useMemo(() => BUILTIN.concat(custom), [custom]);
  const today = dayKey();
  const todayXP = game.days[today] ?? 0;
  const lvl = levelInfo(game.xp);
  const streak = streakOf(game.days, game.frozen);
  const gameRef = useRef(game);
  gameRef.current = game;

  /* hearts regenerate over time; re-render now and then so counters stay fresh */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 10000);
    return () => window.clearInterval(t);
  }, []);
  const hearts = game.settings.hearts ? heartsNow(game, now) : { n: MAX_HEARTS, next: 0 };
  const boostLeft = Math.max(0, game.boostUntil - now);

  useEffect(() => setSoundEnabled(game.settings.sound), [game.settings.sound]);

  const quests = useMemo(() => {
    const q = game.quests.date === today ? game.quests : { date: today, progress: {} as Record<string, number>, claimed: [] as string[] };
    return questsFor(today).map((d) => ({ ...d, progress: Math.min(d.target, q.progress[d.kind] ?? 0), claimed: q.claimed.includes(d.id) }));
  }, [game.quests, today]);

  const push = useCallback((c: Omit<Celebration, "id"> & Record<string, unknown>) => {
    setCelebs((q) => [...q, { ...(c as Celebration), id: ++cid.current }]);
  }, []);
  const dismiss = useCallback((id: number) => setCelebs((q) => q.filter((c) => c.id !== id)), []);

  /* ---- persistence ---- */
  const dbRef = useRef<{ set: (v: unknown) => unknown } | null>(null);
  const saveTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const snap = { fav: [...fav], learned: [...learned], custom };
    writeJSON(LS_BANK, snap);
    writeJSON(LS_GAME, game);
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const db = dbRef.current;
      if (!db) return;
      Promise.resolve(db.set({ ...snap, game })).then(
        () => setSynced("cloud"),
        () => setSynced("local"),
      );
    }, 600);
  }, [fav, learned, custom, game]);

  /* ---- XP ---- */
  const gain = useCallback(
    (amount: number, at?: Point, label?: string) => {
      if (amount <= 0) return 0;
      const boosted = Date.now() < gameRef.current.boostUntil;
      const amt = boosted ? amount * 2 : amount;
      const k = dayKey();
      setGame((g) => withQuest({ ...g, xp: g.xp + amt, days: { ...g.days, [k]: (g.days[k] ?? 0) + amt } }, "xp", amt));
      floatXP(amt, at, boosted ? `${label ?? `+${amt} XP`} ×2` : label);
      return amt;
    },
    [],
  );

  const addGems = useCallback((n: number, at?: Point, label?: string) => {
    if (n <= 0) return;
    setGame((g) => ({ ...g, gems: g.gems + n }));
    floatFx(label ?? `+${n} 寶石`, "gem", at);
  }, []);

  const bumpQuest = useCallback((kind: QuestKind, n = 1) => setGame((g) => withQuest(g, kind, n)), []);

  /* tell the player when a quest is ready to claim (once per quest per session) */
  const notified = useRef<Set<string> | null>(null);
  useEffect(() => {
    const ready = quests.filter((q) => q.progress >= q.target && !q.claimed).map((q) => q.id);
    if (!notified.current) {
      notified.current = new Set(ready);
      return;
    }
    for (const id of ready)
      if (!notified.current.has(id)) {
        notified.current.add(id);
        const q = quests.find((x) => x.id === id)!;
        toast(`任務完成：${q.title}，去領寶箱吧`);
        sfx.chest();
      }
  }, [quests]);

  /* level-up and daily goal detection */
  const prevLevel = useRef(lvl.level);
  useEffect(() => {
    if (lvl.level > prevLevel.current) {
      push({ type: "level", level: lvl.level, title: lvl.title });
      confetti({ count: 160 });
      sfx.level();
      setGame((g) => ({ ...g, gems: g.gems + GEMS.levelUp }));
    }
    prevLevel.current = lvl.level;
  }, [lvl.level, lvl.title, push]);

  const prevToday = useRef(todayXP);
  useEffect(() => {
    if (prevToday.current < game.goal && todayXP >= game.goal) {
      push({ type: "goal", goal: game.goal });
      confetti({ count: 90, y: 90, x: innerWidth - 120, spread: 0.8 });
    }
    prevToday.current = todayXP;
  }, [todayXP, game.goal, push]);

  /* condition-based achievements */
  const mastered = TABS.filter((t) => {
    const ti = items.filter((i) => i.tab === t.k);
    return ti.length > 0 && ti.every((i) => learned.has(i.id));
  }).length;
  const learnedCount = items.filter((i) => learned.has(i.id)).length;
  const pathStats = useMemo(() => {
    let lessons = 0;
    let units = 0;
    let hard = 0;
    let legend = 0;
    let boss = 0;
    for (const [id, p] of Object.entries(game.path)) {
      if (!p.done) continue;
      if (id.startsWith("B:")) boss++;
      else if (id.startsWith("L:")) {
        if ((p.level ?? 1) >= 2) hard++;
        if ((p.level ?? 1) >= 3) legend++;
      }
    }
    for (const t of TABS)
      for (const u of buildPath(items, t.k)) {
        const ls = u.nodes.filter((n) => n.type === "lesson");
        const done = ls.filter((n) => game.path[n.id]?.done).length;
        lessons += done;
        if (ls.length && done === ls.length) units++;
      }
    return { lessons, units, hard, legend, boss };
  }, [items, game.path]);
  useEffect(() => {
    const ctx = {
      hard: pathStats.hard,
      legend: pathStats.legend,
      boss: pathStats.boss,
      lessons: pathStats.lessons,
      units: pathStats.units,
      gems: game.gems,
      learned: learnedCount,
      total: items.length,
      mastered,
      streak,
      level: lvl.level,
      custom: custom.length,
      today: todayXP,
      goal: game.goal,
    };
    const fresh = ACHIEVEMENTS.filter((a) => a.check && !game.ach[a.id] && a.check(ctx));
    if (!fresh.length) return;
    setGame((g) => {
      const ach = { ...g.ach };
      fresh.forEach((a) => (ach[a.id] = dayKey()));
      return { ...g, ach, gems: g.gems + GEMS.ach * fresh.length };
    });
    fresh
      .filter((a) => a.id !== "goal")
      .slice(0, 3)
      .forEach((a) => push({ type: "ach", ach: a.id }));
  }, [learnedCount, items.length, mastered, streak, lvl.level, custom.length, todayXP, game.goal, game.ach, game.gems, pathStats, push]);

  const award = useCallback(
    (id: string) => {
      setGame((g) => (g.ach[id] ? g : { ...g, ach: { ...g.ach, [id]: dayKey() }, gems: g.gems + GEMS.ach }));
      if (!game.ach[id]) push({ type: "ach", ach: id });
    },
    [game.ach, push],
  );

  /* ---- actions ---- */
  const toggleFav = useCallback((id: string) => {
    setFav((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const setLearned = useCallback(
    (id: string, on: boolean, at?: Point, payFirst = true) => {
      setLearnedSet((s) => {
        if (s.has(id) === on) return s;
        const n = new Set(s);
        if (on) n.add(id);
        else n.delete(id);
        return n;
      });
      if (on && !learned.has(id)) bumpQuest("learn");
      if (on && !game.ever.includes(id)) {
        setGame((g) => (g.ever.includes(id) ? g : { ...g, ever: [...g.ever, id] }));
        if (payFirst) gain(XP.markLearned, at);
      }
    },
    [game.ever, gain, learned, bumpQuest],
  );

  const flipped = useCallback(
    (id: string, at?: Point) => {
      const k = dayKey();
      const ids = game.flips.date === k ? game.flips.ids : [];
      if (ids.includes(id)) return;
      setGame((g) => {
        const cur = g.flips.date === k ? g.flips.ids : [];
        return cur.includes(id) ? g : { ...g, flips: { date: k, ids: [...cur, id] } };
      });
      gain(XP.flip, at);
    },
    [game.flips, gain],
  );

  const addCustom = useCallback(
    (it: Omit<Item, "id" | "custom">) => {
      const item: Item = { ...it, id: "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), custom: true };
      setCustom((c) => [...c, item]);
      gain(XP.addPhrase);
      return item;
    },
    [gain],
  );

  const deleteCustom = useCallback((id: string) => {
    setCustom((c) => c.filter((x) => x.id !== id));
    setFav((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
    setLearnedSet((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  }, []);

  const recordCombo = useCallback(
    (n: number) => {
      setGame((g) => withQuest(n > g.bestCombo ? { ...g, bestCombo: n } : g, "combo", n));
      if (n >= 10) award("combo");
    },
    [award],
  );

  const recordMatch = useCallback((tab: TabKey, secs: number) => {
    setGame((g) => {
      const best = g.bestMatch[tab];
      const next = best == null || secs < best ? { ...g, bestMatch: { ...g.bestMatch, [tab]: secs } } : g;
      return withQuest(next, "match", 1);
    });
  }, []);

  /* ---- hearts, shop, path, quests ---- */
  const loseHeart = useCallback(() => {
    if (!gameRef.current.settings.hearts) return;
    sfx.heart();
    setGame((g) => {
      const t = Date.now();
      const { n } = heartsNow(g, t);
      if (n <= 0) return g;
      const heartsAt = n >= MAX_HEARTS ? t : t - ((t - g.heartsAt) % HEART_REGEN_MS);
      return { ...g, hearts: n - 1, heartsAt };
    });
  }, []);

  const buy = useCallback((item: ShopItem): boolean => {
    const g0 = gameRef.current;
    const price = SHOP[item].price;
    if (g0.gems < price) {
      toast("寶石不夠");
      return false;
    }
    if (item === "freeze" && g0.freezes >= SHOP.freeze.max) {
      toast(`連勝凍結最多只能有 ${SHOP.freeze.max} 個`);
      return false;
    }
    if (item === "refill" && heartsNow(g0).n >= MAX_HEARTS) {
      toast("生命已經是滿的");
      return false;
    }
    setGame((g) => {
      const t = Date.now();
      const base = { ...g, gems: g.gems - price };
      if (item === "freeze") return { ...base, freezes: g.freezes + 1 };
      if (item === "refill") return { ...base, hearts: MAX_HEARTS, heartsAt: t };
      return { ...base, boostUntil: Math.max(t, g.boostUntil) + SHOP.boost.minutes * 60000 };
    });
    sfx.chest();
    toast(item === "freeze" ? "已裝備連勝凍結" : item === "refill" ? "生命補滿了" : `雙倍經驗開始，持續 ${SHOP.boost.minutes} 分鐘`);
    return true;
  }, []);

  const claimQuest = useCallback((id: string, at?: Point) => {
    const k = dayKey();
    const def = questsFor(k).find((q) => q.id === id);
    const g0 = gameRef.current;
    if (!def || g0.quests.date !== k || g0.quests.claimed.includes(id) || (g0.quests.progress[def.kind] ?? 0) < def.target) return;
    setGame((g) => ({ ...g, gems: g.gems + def.reward, quests: { ...g.quests, claimed: [...g.quests.claimed, id] } }));
    floatFx(`+${def.reward} 寶石`, "gem", at);
    sfx.chest();
    if (at) confetti({ x: at.x, y: at.y, count: 50, spread: 0.6 });
  }, []);

  const completeNode = useCallback((id: string, perfect: boolean, level = 1) => {
    setGame((g) => {
      const cur = g.path[id];
      const prevLevel = cur?.level ?? (cur?.done ? 1 : 0);
      return {
        ...g,
        path: { ...g.path, [id]: { done: true, perfect: perfect || !!cur?.perfect, plays: (cur?.plays ?? 0) + 1, level: Math.max(prevLevel, level) } },
      };
    });
  }, []);

  const openChest = useCallback((id: string, at?: Point) => {
    if (gameRef.current.path[id]?.done) return 0;
    const n = GEMS.chestMin + Math.floor(Math.random() * (GEMS.chestMax - GEMS.chestMin + 1));
    setGame((g) => ({ ...g, gems: g.gems + n, path: { ...g.path, [id]: { done: true, perfect: false, plays: 1 } } }));
    floatFx(`+${n} 寶石`, "gem", at);
    sfx.chest();
    confetti({ x: at?.x, y: at?.y, count: 70, spread: 0.7 });
    return n;
  }, []);

  const mistake = useCallback((id: string, delta: number) => {
    setGame((g) => {
      const v = Math.max(0, (g.mistakes[id] ?? 0) + delta);
      const m = { ...g.mistakes };
      if (v) m[id] = v;
      else delete m[id];
      return { ...g, mistakes: m };
    });
  }, []);

  const setSetting = useCallback(<K extends keyof GameState["settings"]>(key: K, value: GameState["settings"][K]) => {
    setGame((g) => ({ ...g, settings: { ...g.settings, [key]: value } }));
  }, []);

  /* use streak freezes for days missed since the last visit */
  useEffect(() => {
    const g = gameRef.current;
    if (!g.freezes) return;
    const fz = new Set(g.frozen);
    const gap: string[] = [];
    let d = addDays(new Date(), -1);
    while (gap.length < 30) {
      const k = dayKey(d);
      if ((g.days[k] ?? 0) >= STREAK_MIN || fz.has(k)) break;
      gap.push(k);
      d = addDays(d, -1);
    }
    const before = dayKey(d);
    const hadStreak = (g.days[before] ?? 0) >= STREAK_MIN || fz.has(before);
    if (!gap.length || !hadStreak || gap.length > g.freezes) return;
    setGame((x) => ({ ...x, freezes: x.freezes - gap.length, frozen: [...x.frozen, ...gap] }));
    window.setTimeout(() => toast(`連勝凍結生效，幫你保住了 ${gap.length} 天的空缺`), 800);
  }, []);

  const setGoal = useCallback((goal: number) => setGame((g) => ({ ...g, goal })), []);

  /* ---- optional account sync when hosted as a Claude artifact ---- */
  useEffect(() => {
    const w = window as unknown as { claude?: { use?: (n: string) => Promise<unknown> } };
    const c = w.claude;
    if (!c || typeof c.use !== "function") return;
    let alive = true;
    (async () => {
      type Doc = { get: () => Promise<unknown>; set: (v: unknown) => Promise<unknown> };
      const db = (await c.use!("db")) as { collection: (p: string) => { doc: (id: string) => Doc } } | null;
      const user = (await c.use!("user")) as { id: () => Promise<string> } | null;
      if (!db || !user || !alive) return;
      const ref = db.collection("data/users/" + (await user.id())).doc("bank");
      const s = (await ref.get()) as { exists?: boolean | (() => boolean); data?: unknown } | null;
      const exists = typeof s?.exists === "function" ? s.exists() : s?.exists;
      const raw = exists === false ? null : typeof s?.data === "function" ? (s.data as () => unknown)() : s?.data;
      const d = raw && typeof raw === "object" ? (raw as BankSnap) : null;
      if (!alive) return;
      dbRef.current = ref;
      if (d && (d.fav || d.learned || d.custom)) {
        setFav(new Set(d.fav ?? []));
        setLearnedSet(new Set(d.learned ?? []));
        setCustom((d.custom ?? []).filter((x) => x && x.en && x.zh));
        if (d.game) {
          const g = normaliseGame(d.game, d.learned ?? []);
          prevLevel.current = levelInfo(g.xp).level;
          prevToday.current = g.days[dayKey()] ?? 0;
          setGame(g);
        }
      }
      setSynced("cloud");
    })().catch(() => setSynced("local"));
    return () => {
      alive = false;
    };
  }, []);

  return {
    items,
    fav,
    learned,
    custom,
    game,
    lvl,
    streak,
    todayXP,
    learnedCount,
    hearts,
    boostLeft,
    quests,
    pathStats,
    celebs,
    synced,
    dismiss,
    gain,
    award,
    toggleFav,
    setLearned,
    flipped,
    addCustom,
    deleteCustom,
    recordCombo,
    recordMatch,
    setGoal,
    addGems,
    bumpQuest,
    loseHeart,
    buy,
    claimQuest,
    completeNode,
    openChest,
    mistake,
    setSetting,
  };
}

export type Bank = ReturnType<typeof useBankState>;
const Ctx = createContext<Bank | null>(null);

export function BankProvider({ children }: { children: ReactNode }) {
  const bank = useBankState();
  return <Ctx.Provider value={bank}>{children}</Ctx.Provider>;
}

export function useBank() {
  const b = useContext(Ctx);
  if (!b) throw new Error("useBank outside BankProvider");
  return b;
}
