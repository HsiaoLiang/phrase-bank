import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BUILTIN, TABS } from "./data";
import { ACHIEVEMENTS, DEFAULT_GAME, XP, dayKey, levelInfo, streakOf } from "./game";
import { confetti, floatXP } from "./fx";
import type { GameState, Item, TabKey } from "./types";

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
  const streak = streakOf(game.days);

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
      if (amount <= 0) return;
      const k = dayKey();
      setGame((g) => ({ ...g, xp: g.xp + amount, days: { ...g.days, [k]: (g.days[k] ?? 0) + amount } }));
      floatXP(amount, at, label);
    },
    [],
  );

  /* level-up and daily goal detection */
  const prevLevel = useRef(lvl.level);
  useEffect(() => {
    if (lvl.level > prevLevel.current) {
      push({ type: "level", level: lvl.level, title: lvl.title });
      confetti({ count: 160 });
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
  useEffect(() => {
    const ctx = {
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
      return { ...g, ach };
    });
    fresh
      .filter((a) => a.id !== "goal")
      .slice(0, 3)
      .forEach((a) => push({ type: "ach", ach: a.id }));
  }, [learnedCount, items.length, mastered, streak, lvl.level, custom.length, todayXP, game.goal, game.ach, push]);

  const award = useCallback(
    (id: string) => {
      setGame((g) => (g.ach[id] ? g : { ...g, ach: { ...g.ach, [id]: dayKey() } }));
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
      if (on && !game.ever.includes(id)) {
        setGame((g) => (g.ever.includes(id) ? g : { ...g, ever: [...g.ever, id] }));
        if (payFirst) gain(XP.markLearned, at);
      }
    },
    [game.ever, gain],
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
      setGame((g) => (n > g.bestCombo ? { ...g, bestCombo: n } : g));
      if (n >= 10) award("combo");
    },
    [award],
  );

  const recordMatch = useCallback((tab: TabKey, secs: number) => {
    setGame((g) => {
      const best = g.bestMatch[tab];
      return best == null || secs < best ? { ...g, bestMatch: { ...g.bestMatch, [tab]: secs } } : g;
    });
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
