import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Clock, Flame, Gem, Heart, HeartCrack, Infinity as InfinityIcon, Snowflake, Target, Turtle, Volume2, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { shuffle } from "@/lib/data";
import { GEMS, MAX_HEARTS, SHOP, STREAK_MIN, lastNDays } from "@/lib/game";
import { confetti, speak } from "@/lib/fx";
import { grade, norm } from "@/lib/grade";
import { sfx } from "@/lib/sound";
import { useBank } from "@/lib/store";
import type { Item } from "@/lib/types";
import { fmtTime } from "./game/bits";

/* ---------- exercises ---------- */
type Kind = "pick-en" | "pick-zh" | "build" | "type" | "listen";
type Ex =
  | { key: string; kind: Kind; item: Item; options: Item[]; tiles: { id: number; w: string }[]; second: boolean }
  | { key: string; kind: "pairs"; items: Item[] };

const canTTS = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function tokens(en: string) {
  return en
    .split(/\s+/)
    .map((w) => w.replace(/^[^\w']+|[^\w']+$/g, ""))
    .filter((w) => w && /\w/.test(w));
}

let exSeq = 0;
function makeEx(kind: Kind, item: Item, pool: Item[], second: boolean): Ex {
  const same = pool.filter((x) => x.id !== item.id && x.tab === item.tab);
  const src = same.length >= 3 ? same : pool.filter((x) => x.id !== item.id);
  const field = kind === "pick-zh" ? "zh" : "en";
  const seen = new Set([item[field]]);
  const options: Item[] = [];
  for (const x of shuffle(src)) {
    if (options.length >= 3) break;
    if (!seen.has(x[field])) {
      seen.add(x[field]);
      options.push(x);
    }
  }
  let tiles: { id: number; w: string }[] = [];
  if (kind === "build") {
    const words = tokens(item.en);
    const lower = new Set(words.map((w) => w.toLowerCase()));
    const extra: string[] = [];
    for (const x of shuffle(src))
      for (const w of shuffle(tokens(x.en)))
        if (extra.length < 3 && !lower.has(w.toLowerCase()) && w.length > 1) {
          extra.push(w.toLowerCase());
          lower.add(w.toLowerCase());
        }
    tiles = shuffle([...words, ...extra]).map((w, i) => ({ id: i, w }));
  }
  return { key: `${kind}-${item.id}-${++exSeq}`, kind, item, options: shuffle([...options, item]), tiles, second };
}

function buildLesson(items: Item[], pool: Item[]): Ex[] {
  const tts = canTTS();
  const pass1 = shuffle(items).map((it) => {
    const word = tokens(it.en).length <= 3;
    const k: Kind = word ? (Math.random() < 0.6 ? "pick-zh" : "pick-en") : Math.random() < 0.65 ? "pick-en" : "pick-zh";
    return makeEx(k, it, pool, false);
  });
  const pass2 = shuffle(items).map((it) => {
    const n = tokens(it.en).length;
    let k: Kind;
    if (n >= 3 && n <= 12) k = tts && Math.random() < 0.25 ? "listen" : "build";
    else k = tts && n <= 6 && Math.random() < 0.3 ? "listen" : "type";
    return makeEx(k, it, pool, true);
  });
  const pairs: Ex[] = items.length >= 3 ? [{ key: `pairs-${++exSeq}`, kind: "pairs", items: shuffle(items).slice(0, 5) }] : [];
  return [...pass1, ...pairs, ...pass2];
}

const TITLE: Record<Ex["kind"], string> = {
  "pick-en": "選出正確的英文",
  "pick-zh": "這句是什麼意思？",
  build: "用字塊拼出英文",
  type: "用英文寫出來",
  listen: "聽聽看，寫下你聽到的英文",
  pairs: "把英文和中文配成對",
};

/* ---------- small pieces ---------- */
const bigBtn =
  "inline-flex min-w-[150px] items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[17px] font-extrabold uppercase tracking-wide transition-[transform,box-shadow,filter] active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:opacity-40";
const shadow = (v: string) => ({ boxShadow: `0 4px 0 0 color-mix(in srgb, hsl(var(${v})) 70%, black)` });

function Tile({ children, onClick, used, className }: { children: ReactNode; onClick?: () => void; used?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={used}
      className={cn(
        "rounded-xl border-2 border-b-4 bg-card px-3 py-2 text-[16px] font-semibold transition-transform active:translate-y-0.5 active:border-b-2",
        used && "border-transparent bg-secondary text-transparent shadow-none",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Choice({ k, text, sel, onClick, disabled, state }: { k: number; text: string; sel: boolean; onClick: () => void; disabled: boolean; state?: "right" | "wrong" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 rounded-2xl border-2 border-b-4 bg-card px-4 py-3.5 text-left text-[16px] font-semibold leading-snug transition-colors enabled:hover:bg-secondary",
        sel && !state && "border-primary bg-accent text-accent-foreground",
        state === "right" && "border-good bg-good-soft text-good",
        state === "wrong" && "animate-shake border-bad bg-bad-soft text-bad",
      )}
    >
      <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 text-[13px] font-extrabold text-muted-foreground", sel && "border-primary text-primary")}>{k}</span>
      <span>{text}</span>
    </button>
  );
}

function Pairs({ items, onDone }: { items: Item[]; onDone: () => void }) {
  const left = useMemo(() => shuffle(items), [items]);
  const right = useMemo(() => shuffle(items), [items]);
  const [sel, setSel] = useState<{ side: "l" | "r"; id: string } | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [bad, setBad] = useState<string[]>([]);
  const click = (side: "l" | "r", id: string) => {
    if (done.has(id)) return;
    if (!sel || sel.side === side) {
      sfx.tap();
      if (side === "l") speak(items.find((x) => x.id === id)!.en);
      return setSel({ side, id });
    }
    if (sel.id === id) {
      sfx.tap();
      const d = new Set(done);
      d.add(id);
      setDone(d);
      setSel(null);
      if (d.size === items.length) window.setTimeout(onDone, 350);
    } else {
      sfx.wrong();
      setBad([`${sel.side}${sel.id}`, `${side}${id}`]);
      setSel(null);
      window.setTimeout(() => setBad([]), 450);
    }
  };
  const btn = (side: "l" | "r", it: Item) => {
    const isDone = done.has(it.id);
    const isSel = sel?.side === side && sel.id === it.id;
    return (
      <button
        key={side + it.id}
        type="button"
        onClick={() => click(side, it.id)}
        disabled={isDone}
        className={cn(
          "min-h-[58px] rounded-2xl border-2 border-b-4 bg-card px-3 py-2 text-[15px] font-semibold leading-snug transition-all",
          isSel && "border-primary bg-accent text-accent-foreground",
          bad.includes(side + it.id) && "animate-shake border-bad bg-bad-soft text-bad",
          isDone && "scale-95 border-good/40 bg-good-soft text-good opacity-50",
        )}
      >
        {side === "l" ? it.en : it.zh}
      </button>
    );
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-3">{left.map((it) => btn("l", it))}</div>
      <div className="flex flex-col gap-3">{right.map((it) => btn("r", it))}</div>
    </div>
  );
}

/* ---------- lesson ---------- */
type Phase = "play" | "out" | "done" | "streak";
interface Feedback {
  ok: boolean;
  note?: string;
}

export function Lesson({ title, items, nodeId, review, onExit }: { title: string; items: Item[]; nodeId?: string; review?: boolean; onExit: () => void }) {
  const bank = useBank();
  const { items: all, hearts, game, gain, addGems, loseHeart, setLearned, completeNode, bumpQuest, recordCombo, mistake, buy, award, streak } = bank;
  const [queue, setQueue] = useState<Ex[]>(() => buildLesson(items, all));
  const [solved, setSolved] = useState(0);
  const [phase, setPhase] = useState<Phase>(() => (bank.game.settings.hearts && bank.hearts.n <= 0 ? "out" : "play"));
  const [fb, setFb] = useState<Feedback | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [built, setBuilt] = useState<number[]>([]);
  const [text, setText] = useState("");
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [stats, setStats] = useState({ right: 0, wrong: 0 });
  const [confirmExit, setConfirmExit] = useState(false);
  const [comboFlash, setComboFlash] = useState<number | null>(null);
  const [result, setResult] = useState<{ xp: number; gems: number; secs: number; acc: number; perfect: boolean } | null>(null);
  const retries = useRef(new Map<string, number>());
  const missed = useRef(new Set<string>());
  const t0 = useRef(Date.now());
  const todayAtStart = useRef(bank.todayXP);
  const inputRef = useRef<HTMLInputElement>(null);
  const contRef = useRef<HTMLButtonElement>(null);
  const ex = queue[0];
  const total = solved + queue.length;
  const heartsOn = game.settings.hearts;

  useEffect(() => {
    const o = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = o;
    };
  }, []);

  // reset answer state as soon as a new exercise comes up (during render, so stale tile ids never reach it)
  const [ansKey, setAnsKey] = useState(ex?.key);
  if (ex && ansKey !== ex.key) {
    setAnsKey(ex.key);
    setPick(null);
    setBuilt([]);
    setText("");
  }

  // auto-play audio and focus the input for each new exercise
  useEffect(() => {
    if (!ex || ex.kind === "pairs") return;
    if (ex.kind === "listen" || ex.kind === "pick-zh") window.setTimeout(() => speak(ex.item.en), 250);
    if (ex.kind === "type" || ex.kind === "listen") window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [ex?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (fb) contRef.current?.focus({ preventScroll: true });
  }, [fb]);

  const ready =
    !!ex &&
    !fb &&
    ex.kind !== "pairs" &&
    ((ex.kind === "pick-en" || ex.kind === "pick-zh") ? pick !== null : ex.kind === "build" ? built.length > 0 : text.trim().length > 0);

  function answer(ok: boolean, note?: string) {
    if (!ex || ex.kind === "pairs") return;
    const it = ex.item;
    if (ok) {
      sfx.correct();
      const c = combo + 1;
      setCombo(c);
      setBestCombo((b) => Math.max(b, c));
      recordCombo(c);
      if (c === 5 || c === 10 || c === 15 || c === 20) {
        setComboFlash(c);
        window.setTimeout(() => sfx.combo(), 200);
        window.setTimeout(() => setComboFlash(null), 1600);
      }
      setStats((s) => ({ ...s, right: s.right + 1 }));
      if (ex.second && !missed.current.has(it.id)) setLearned(it.id, true, null, false);
      if (review) mistake(it.id, -1);
      if (ex.kind === "type" || ex.kind === "listen") bumpQuest("write");
    } else {
      sfx.wrong();
      setCombo(0);
      setStats((s) => ({ ...s, wrong: s.wrong + 1 }));
      missed.current.add(it.id);
      mistake(it.id, 1);
      setLearned(it.id, false);
      loseHeart();
      const r = retries.current.get(it.id) ?? 0;
      if (r < 2) {
        retries.current.set(it.id, r + 1);
        setQueue((q) => [...q, makeEx(ex.kind, it, all, ex.second)]);
      }
    }
    setFb({ ok, note });
  }

  function check() {
    if (!ex || ex.kind === "pairs" || fb) return;
    const it = ex.item;
    if (ex.kind === "pick-en" || ex.kind === "pick-zh") {
      if (pick === null) return;
      answer(ex.options[pick].id === it.id);
    } else if (ex.kind === "build") {
      const said = built.filter((i) => ex.tiles[i]).map((i) => ex.tiles[i].w).join(" ");
      answer(norm(said) === norm(tokens(it.en).join(" ")));
    } else {
      const g = grade(text, it.en);
      const ok = g.level === "perfect" || g.level === "close";
      answer(ok, ok && g.level === "close" ? "差一點點，注意一下拼法" : undefined);
    }
  }

  function skip() {
    if (!ex || fb) return;
    answer(false);
  }

  function finish() {
    const secs = Math.round((Date.now() - t0.current) / 1000);
    const perfect = stats.wrong === 0;
    const acc = Math.round((stats.right / Math.max(1, stats.right + stats.wrong)) * 100);
    const base = stats.right * 2 + 10 + (perfect ? 5 : 0);
    const xp = gain(base, null, `+${base} XP 關卡完成`);
    const gems = review ? 0 : GEMS.lesson + (perfect ? GEMS.perfect : 0);
    if (gems) window.setTimeout(() => addGems(gems), 400);
    if (nodeId) completeNode(nodeId, perfect);
    bumpQuest("lessons");
    if (perfect) {
      bumpQuest("perfect");
      if (stats.right >= 5) award("perfect");
    }
    setResult({ xp, gems, secs, acc, perfect });
    setPhase("done");
    sfx.complete();
    confetti({ count: perfect ? 200 : 120 });
  }

  function cont() {
    if (!fb) return;
    const wasWrong = !fb.ok;
    setFb(null);
    const rest = queue.slice(1);
    setQueue(rest);
    setSolved((s) => s + 1);
    if (wasWrong && heartsOn && hearts.n <= 0) {
      setPhase("out");
      return;
    }
    if (!rest.length) finish();
  }

  function pairsDone() {
    sfx.correct();
    setStats((s) => ({ ...s, right: s.right + 1 }));
    const rest = queue.slice(1);
    setQueue(rest);
    setSolved((s) => s + 1);
    if (!rest.length) finish();
  }

  // keyboard: Enter checks / continues, 1–4 picks, Esc asks to leave
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyRef.current = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Escape") {
      if (phase === "play") setConfirmExit((v) => !v);
      return;
    }
    if (phase !== "play" || confirmExit || !ex) return;
    const typing = (e.target as HTMLElement).tagName === "INPUT";
    if (e.key === "Enter") {
      if (e.target === contRef.current) return; // the focused 繼續 button handles it natively
      e.preventDefault();
      if (fb) cont();
      else if (ready) check();
      return;
    }
    if (!typing && !fb && (ex.kind === "pick-en" || ex.kind === "pick-zh") && /^[1-4]$/.test(e.key)) {
      const k = Number(e.key) - 1;
      if (ex.options[k]) {
        sfx.tap();
        setPick(k);
      }
    }
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => keyRef.current(e);
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, []);

  /* ---------- screens ---------- */
  if (phase === "done" && result) {
    const extended = todayAtStart.current < STREAK_MIN && todayAtStart.current + result.xp >= STREAK_MIN;
    return (
      <Screen>
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative grid h-36 w-36 animate-pop place-items-center rounded-full bg-xp-soft">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-xp text-white" style={shadow("--xp")}>
              <Check className="h-14 w-14" strokeWidth={3} />
            </div>
          </div>
          <div>
            <h2 className="m-0 text-3xl font-extrabold text-xp">{result.perfect ? "零失誤，完美過關！" : "關卡完成！"}</h2>
            <p className="m-0 mt-1 text-muted-foreground">{title}</p>
          </div>
          <div className="grid w-full max-w-md grid-cols-3 gap-3">
            <Stat color="--xp" label="總 XP" icon={<Zap className="h-5 w-5" />} value={String(result.xp)} />
            <Stat color="--good" label="正確率" icon={<Target className="h-5 w-5" />} value={result.acc + "%"} />
            <Stat color="--primary" label="用時" icon={<Clock className="h-5 w-5" />} value={fmtTime(result.secs)} />
          </div>
          {bestCombo >= 3 && (
            <p className="m-0 flex items-center gap-1.5 font-extrabold text-streak">
              <Flame className="h-5 w-5" /> 最高連續答對 {bestCombo} 題
            </p>
          )}
          {result.gems > 0 && (
            <p className="m-0 flex items-center gap-1.5 rounded-full bg-[hsl(199_89%_48%/.12)] px-4 py-1.5 font-extrabold text-[hsl(199_89%_40%)] dark:text-[hsl(199_89%_65%)]">
              <Gem className="h-5 w-5" /> +{result.gems} 寶石
            </p>
          )}
        </div>
        <Bottom>
          <span />
          <button autoFocus type="button" className={cn(bigBtn, "bg-good text-white")} style={shadow("--good")} onClick={() => (extended ? setPhase("streak") : onExit())}>
            繼續
          </button>
        </Bottom>
      </Screen>
    );
  }

  if (phase === "streak") {
    const week = lastNDays(game.days, 7);
    return (
      <Screen>
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative grid h-40 w-40 place-items-center">
            <Flame className="h-40 w-40 animate-pop fill-streak/90 text-streak" strokeWidth={1.2} />
            <span className="tabular absolute bottom-6 text-5xl font-extrabold text-white drop-shadow">{streak}</span>
          </div>
          <h2 className="m-0 text-3xl font-extrabold text-streak">連續學習 {streak} 天！</h2>
          <div className="flex gap-2 rounded-2xl bg-card p-3 shadow-card">
            {week.map((d) => {
              const hit = d.xp >= STREAK_MIN;
              const froze = game.frozen.includes(d.key);
              return (
                <div key={d.key} className="flex w-9 flex-col items-center gap-1">
                  <span className={cn("text-xs font-bold", d.today ? "text-streak" : "text-muted-foreground")}>{d.label}</span>
                  <span className={cn("grid h-8 w-8 place-items-center rounded-full", hit ? "bg-streak text-white" : froze ? "bg-[hsl(199_89%_48%)] text-white" : "bg-secondary")}>
                    {hit ? <Check className="h-4 w-4" strokeWidth={3} /> : froze ? <Snowflake className="h-4 w-4" /> : null}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="m-0 max-w-xs text-muted-foreground">明天再來練一關，火焰就不會熄滅。{game.freezes > 0 && `你還有 ${game.freezes} 個連勝凍結。`}</p>
        </div>
        <Bottom>
          <span />
          <button autoFocus type="button" className={cn(bigBtn, "bg-streak text-white")} style={shadow("--streak")} onClick={onExit}>
            繼續
          </button>
        </Bottom>
      </Screen>
    );
  }

  if (phase === "out") {
    return (
      <Screen>
        <div className="flex flex-col items-center gap-5 text-center">
          <HeartCrack className="h-28 w-28 animate-pop fill-bad/20 text-bad" strokeWidth={1.5} />
          <h2 className="m-0 text-3xl font-extrabold">生命用完了</h2>
          <p className="m-0 max-w-sm text-muted-foreground">
            每 20 分鐘恢復 1 顆{hearts.next ? `，下一顆約 ${Math.ceil(hearts.next / 60000)} 分鐘後恢復` : ""}。也可以用寶石馬上補滿，或到設定關掉生命制度。
          </p>
          <p className="m-0 flex items-center gap-1.5 font-extrabold text-[hsl(199_89%_40%)] dark:text-[hsl(199_89%_65%)]">
            <Gem className="h-5 w-5" /> 你有 {game.gems} 顆寶石
          </p>
        </div>
        <Bottom>
          <button type="button" className={cn(bigBtn, "border-2 border-b-4 bg-card text-muted-foreground")} onClick={onExit}>
            離開
          </button>
          <button
            type="button"
            disabled={game.gems < SHOP.refill.price}
            className={cn(bigBtn, "bg-bad text-white")}
            style={shadow("--bad")}
            onClick={() => {
              if (buy("refill")) {
                setPhase("play");
                if (!queue.length) finish();
              }
            }}
          >
            <Heart className="h-5 w-5 fill-current" /> {SHOP.refill.price} 寶石補滿
          </button>
        </Bottom>
      </Screen>
    );
  }

  /* ---------- play ---------- */
  const pct = total ? (solved / total) * 100 : 0;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" role="dialog" aria-modal="true" aria-label={`關卡：${title}`}>
      <header className="mx-auto flex w-full max-w-[1000px] items-center gap-4 px-4 pb-2 pt-5">
        <button type="button" aria-label="離開關卡" onClick={() => setConfirmExit(true)} className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-secondary">
          <X className="h-6 w-6" />
        </button>
        <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={cn("relative h-full rounded-full transition-[width] duration-500", combo >= 5 ? "bg-streak" : "bg-good")}
            style={{ width: `${Math.max(pct, 3)}%` }}
          >
            <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/35" />
          </div>
        </div>
        <span key={hearts.n} className={cn("flex items-center gap-1 text-lg font-extrabold", heartsOn ? "text-bad" : "text-muted-foreground", heartsOn && hearts.n < MAX_HEARTS && "animate-pop")} aria-label={heartsOn ? `剩 ${hearts.n} 顆生命` : "生命制度關閉"}>
          <Heart className={cn("h-6 w-6", heartsOn && "fill-bad")} />
          {heartsOn ? <span className="tabular">{hearts.n}</span> : <InfinityIcon className="h-5 w-5" />}
        </span>
      </header>
      <div className="relative mx-auto h-7 w-full max-w-[1000px] px-4">
        {comboFlash && (
          <p className="absolute inset-x-0 top-0 m-0 flex animate-pop justify-center">
            <span className="flex items-center gap-1 rounded-full bg-streak-soft px-3 py-0.5 text-sm font-extrabold text-streak">
              <Flame className="h-4 w-4" /> 連續答對 {comboFlash} 題！
            </span>
          </p>
        )}
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-40">
        {ex && (
          <div key={ex.key} className="mx-auto flex max-w-[620px] animate-rise flex-col gap-6 pt-4">
            <h2 className="m-0 text-[24px] font-extrabold sm:text-[28px]">{TITLE[ex.kind]}</h2>
            {ex.kind === "pairs" ? (
              <Pairs items={ex.items} onDone={pairsDone} />
            ) : (
              <ExerciseBody ex={ex} fb={fb} pick={pick} setPick={setPick} built={built} setBuilt={setBuilt} text={text} setText={setText} inputRef={inputRef} />
            )}
          </div>
        )}
      </main>

      {ex?.kind !== "pairs" && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 border-t-2 transition-colors",
            fb ? (fb.ok ? "border-transparent bg-good-soft" : "border-transparent bg-bad-soft") : "bg-background",
          )}
        >
          <div className="mx-auto flex max-w-[1000px] flex-wrap items-center justify-between gap-3 px-4 py-5">
            {fb ? (
              <div className={cn("flex min-w-0 flex-1 animate-rise items-center gap-3", fb.ok ? "text-good" : "text-bad")}>
                <span className={cn("hidden h-14 w-14 shrink-0 place-items-center rounded-full bg-card sm:grid")}>
                  {fb.ok ? <Check className="h-8 w-8" strokeWidth={3} /> : <X className="h-8 w-8" strokeWidth={3} />}
                </span>
                <div className="min-w-0">
                  <p className="m-0 text-xl font-extrabold">{fb.ok ? (fb.note ? "算你對！" : ["答得好！", "太棒了！", "正確！", "很好！"][stats.right % 4]) : "正確答案："}</p>
                  {(!fb.ok || fb.note) && ex && (
                    <p className="m-0 font-semibold">
                      {ex.kind === "pick-zh" ? ex.item.zh : ex.item.en}
                      {fb.note && <span className="ml-2 text-sm font-bold opacity-80">（{fb.note}）</span>}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <button type="button" onClick={skip} className={cn(bigBtn, "border-2 border-b-4 bg-card text-muted-foreground hover:bg-secondary")}>
                跳過
              </button>
            )}
            {fb ? (
              <button ref={contRef} type="button" onClick={cont} className={cn(bigBtn, fb.ok ? "bg-good text-white" : "bg-bad text-white")} style={shadow(fb.ok ? "--good" : "--bad")}>
                繼續
              </button>
            ) : (
              <button type="button" onClick={check} disabled={!ready} className={cn(bigBtn, "bg-good text-white")} style={shadow("--good")}>
                檢查
              </button>
            )}
          </div>
        </div>
      )}

      {confirmExit && (
        <div className="fixed inset-0 z-[60] grid place-items-end bg-[rgb(15_16_48/.5)] sm:place-items-center" onClick={() => setConfirmExit(false)}>
          <div className="w-full animate-rise rounded-t-3xl bg-card p-6 text-center sm:max-w-sm sm:rounded-3xl" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-labelledby="leave-t">
            <h3 id="leave-t" className="m-0 text-xl font-extrabold">等等，先別走！</h3>
            <p className="mb-5 mt-2 text-muted-foreground">現在離開，這一關的進度不會保存。</p>
            <button autoFocus type="button" className={cn(bigBtn, "w-full bg-primary text-primary-foreground")} style={shadow("--primary")} onClick={() => setConfirmExit(false)}>
              繼續學習
            </button>
            <button type="button" className="mt-3 w-full rounded-xl py-3 font-extrabold text-bad hover:bg-bad-soft" onClick={onExit}>
              結束關卡
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseBody({
  ex,
  fb,
  pick,
  setPick,
  built,
  setBuilt,
  text,
  setText,
  inputRef,
}: {
  ex: Extract<Ex, { kind: Kind }>;
  fb: Feedback | null;
  pick: number | null;
  setPick: (n: number) => void;
  built: number[];
  setBuilt: (b: number[]) => void;
  text: string;
  setText: (s: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const it = ex.item;
  const prompt = (
    <div className="flex items-start gap-3">
      {ex.kind === "pick-zh" && (
        <button type="button" onClick={() => speak(it.en)} aria-label="再聽一次" className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground" style={shadow("--primary")}>
          <Volume2 className="h-5 w-5" />
        </button>
      )}
      <p className="relative m-0 rounded-2xl border-2 bg-card px-4 py-3 text-[19px] font-semibold leading-snug">{ex.kind === "pick-zh" ? it.en : it.zh}</p>
    </div>
  );

  if (ex.kind === "pick-en" || ex.kind === "pick-zh") {
    return (
      <>
        {prompt}
        <div className="grid gap-3">
          {ex.options.map((o, k) => (
            <Choice
              key={o.id}
              k={k + 1}
              text={ex.kind === "pick-zh" ? o.zh : o.en}
              sel={pick === k}
              disabled={!!fb}
              state={fb ? (o.id === it.id ? (pick === k || !fb.ok ? "right" : undefined) : pick === k ? "wrong" : undefined) : undefined}
              onClick={() => {
                sfx.tap();
                setPick(k);
              }}
            />
          ))}
        </div>
      </>
    );
  }

  if (ex.kind === "build") {
    const used = new Set(built);
    return (
      <>
        {prompt}
        <div className="flex min-h-[124px] flex-wrap content-start gap-2 border-y-2 py-3" aria-label="你的句子">
          {built.filter((i) => ex.tiles[i]).map((i) => (
            <Tile
              key={i}
              onClick={() => {
                if (fb) return;
                sfx.tap();
                setBuilt(built.filter((x) => x !== i));
              }}
            >
              {ex.tiles[i].w}
            </Tile>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2" aria-label="字塊">
          {ex.tiles.map((t) => (
            <Tile
              key={t.id}
              used={used.has(t.id)}
              onClick={() => {
                if (fb) return;
                sfx.tap();
                setBuilt([...built, t.id]);
              }}
            >
              {t.w}
            </Tile>
          ))}
        </div>
      </>
    );
  }

  // type / listen
  return (
    <>
      {ex.kind === "listen" ? (
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => speak(it.en)} aria-label="播放" className="grid h-24 w-24 place-items-center rounded-3xl bg-primary text-primary-foreground" style={shadow("--primary")}>
            <Volume2 className="h-11 w-11" />
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(it.en);
                u.lang = "en-GB";
                u.rate = 0.6;
                speechSynthesis.speak(u);
              } catch {
                /* ignore */
              }
            }}
            aria-label="慢速播放"
            className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/80 text-primary-foreground"
            style={shadow("--primary")}
          >
            <Turtle className="h-7 w-7" />
          </button>
        </div>
      ) : (
        prompt
      )}
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={!!fb}
        placeholder={ex.kind === "listen" ? "輸入你聽到的英文" : "用英文輸入"}
        aria-label="你的答案"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="h-32 w-full rounded-2xl border-2 bg-secondary px-4 text-[18px] font-semibold outline-none focus:border-primary focus:bg-card sm:h-28"
      />
    </>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background" role="dialog" aria-modal="true">
      <div className="flex flex-1 items-center justify-center px-4 pb-36 pt-10">{children}</div>
    </div>
  );
}

function Bottom({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t-2 bg-background">
      <div className="mx-auto flex max-w-[1000px] items-center justify-between gap-3 px-4 py-5">{children}</div>
    </div>
  );
}

function Stat({ color, label, icon, value }: { color: string; label: string; icon: ReactNode; value: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 animate-pop" style={{ borderColor: `hsl(var(${color}))` }}>
      <p className="m-0 py-1 text-xs font-extrabold uppercase text-white" style={{ background: `hsl(var(${color}))` }}>
        {label}
      </p>
      <p className="m-0 flex items-center justify-center gap-1.5 bg-card py-3 text-xl font-extrabold" style={{ color: `hsl(var(${color}))` }}>
        {icon}
        <span className="tabular">{value}</span>
      </p>
    </div>
  );
}
