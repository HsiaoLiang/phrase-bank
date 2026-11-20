import { useEffect, useRef, useState } from "react";
import { Gift, Target, X } from "lucide-react";
import { floats, toasts, type FloatEv } from "@/lib/fx";
import { cn } from "@/lib/utils";
import { GEMS, LEVEL_PERKS, achById } from "@/lib/game";
import { useBank, type Celebration } from "@/lib/store";
import { ACH_ICON, LevelBadge } from "./bits";

function Floats() {
  const [list, setList] = useState<FloatEv[]>([]);
  useEffect(
    () =>
      floats.on((f) => {
        setList((l) => [...l, f]);
        window.setTimeout(() => setList((l) => l.filter((x) => x.id !== f.id)), 1150);
      }),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[90]" aria-hidden="true">
      {list.map((f) => (
        <span
          key={f.id}
          className={cn(
            "absolute animate-floatup whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-extrabold shadow-lift",
            f.kind === "gem" ? "bg-[hsl(199_89%_48%)] text-white" : f.kind === "heart" ? "bg-bad text-white" : "bg-xp text-[#3a2600]",
          )}
          style={{ left: f.x, top: f.y }}
        >
          {f.text}
        </span>
      ))}
    </div>
  );
}

function Toasts() {
  const [t, setT] = useState<{ id: number; text: string } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(
    () =>
      toasts.on((v) => {
        setT(v);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setT(null), Math.max(1600, v.text.length * 90));
      }),
    [],
  );
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4">
      {t && (
        <div key={t.id} className="max-w-md animate-rise rounded-2xl bg-foreground px-4 py-2 text-center text-sm font-semibold text-background shadow-lift">
          {t.text}
        </div>
      )}
    </div>
  );
}

function AchToast({ c, onDone }: { c: Celebration; onDone: () => void }) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const t = window.setTimeout(() => done.current(), 4200);
    return () => window.clearTimeout(t);
  }, []);
  let icon, title, sub;
  if (c.type === "ach") {
    const a = achById(c.ach);
    const I = a ? ACH_ICON[a.icon] : Target;
    icon = (
      <div className="grid h-12 w-12 shrink-0 animate-pop place-items-center rounded-full bg-xp text-[#3a2600]">
        <I className="h-6 w-6" />
      </div>
    );
    title = "解鎖成就：" + (a?.name ?? c.ach);
    sub = a?.desc;
  } else if (c.type === "goal") {
    icon = (
      <div className="grid h-12 w-12 shrink-0 animate-pop place-items-center rounded-full bg-good text-white">
        <Target className="h-6 w-6" />
      </div>
    );
    title = "今天的目標達成了！";
    sub = `已經拿到 ${c.goal} XP，明天繼續保持連續紀錄。`;
  } else return null;
  return (
    <div className="pointer-events-auto flex w-[min(360px,calc(100vw-32px))] animate-rise items-center gap-3 rounded-2xl border-2 border-xp/60 bg-card p-3 pr-2 shadow-lift">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="m-0 font-extrabold leading-snug">{title}</p>
        {sub && <p className="m-0 text-sm text-muted-foreground">{sub}</p>}
      </div>
      <button type="button" aria-label="關閉" onClick={onDone} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function LevelUp({ c, onDone }: { c: Extract<Celebration, { type: "level" }>; onDone: () => void }) {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    btn.current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onDone();
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-[rgb(15_16_48/.55)] p-4" role="dialog" aria-modal="true" aria-labelledby="lvl-title" onClick={onDone}>
      <div className="w-full max-w-sm animate-pop rounded-3xl bg-card p-8 text-center shadow-lift" onClick={(e) => e.stopPropagation()}>
        <p className="m-0 text-sm font-extrabold uppercase tracking-[.18em] text-xp">Level up</p>
        <div className="my-5 flex justify-center">
          <LevelBadge level={c.level} size="lg" className="animate-wiggle" />
        </div>
        <h2 id="lvl-title" className="m-0 text-3xl font-extrabold">升到 Lv.{c.level}！</h2>
        <p className="mb-4 mt-2 text-muted-foreground">
          新稱號：<b className="text-foreground">{c.title}</b>
        </p>
        <ul className="mb-6 flex list-none flex-col gap-2 p-0 text-left">
          {LEVEL_PERKS.filter((p) => p.level === c.level).map((p) => (
            <li key={p.text} className="flex animate-rise items-center gap-2 rounded-xl bg-accent px-3 py-2 font-bold text-accent-foreground">
              <Gift className="h-4 w-4 shrink-0" /> {p.text}
            </li>
          ))}
          <li className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 font-bold text-muted-foreground">
            <Gift className="h-4 w-4 shrink-0" /> +{GEMS.levelUp} 寶石
          </li>
        </ul>
        <button
          ref={btn}
          type="button"
          onClick={onDone}
          className="w-full rounded-xl bg-primary px-5 py-3 text-lg font-bold text-primary-foreground shadow-btn transition-colors hover:bg-primary-hover active:translate-y-px active:shadow-none"
        >
          繼續加油
        </button>
      </div>
    </div>
  );
}

export function FxLayer() {
  const { celebs, dismiss } = useBank();
  const level = celebs.find((c) => c.type === "level") as Extract<Celebration, { type: "level" }> | undefined;
  const others = celebs.filter((c) => c.type !== "level").slice(0, 3);
  return (
    <>
      <Floats />
      <Toasts />
      {level && <LevelUp c={level} onDone={() => dismiss(level.id)} />}
      <div className="pointer-events-none fixed right-4 top-20 z-[85] flex flex-col items-end gap-2" aria-live="polite">
        {others.map((c) => (
          <AchToast key={c.id} c={c} onDone={() => dismiss(c.id)} />
        ))}
      </div>
    </>
  );
}
