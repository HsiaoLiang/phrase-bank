import { Flame, Lock, Timer, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { TABS } from "@/lib/data";
import { ACHIEVEMENTS, STREAK_MIN, lastNDays } from "@/lib/game";
import { useBank } from "@/lib/store";
import { ACH_ICON, Bar, LevelBadge, Ring, fmtTime } from "./game/bits";

const GOALS = [30, 60, 100, 150];

function Panel({ title, right, children, className }: { title: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl bg-card p-4 shadow-card", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="m-0 text-[15px] font-extrabold">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

export function PlayerPanel() {
  const { game, lvl, streak, todayXP, setGoal } = useBank();
  const week = lastNDays(game.days, 7);
  const maxDay = Math.max(game.goal, ...week.map((d) => d.xp));
  const unlocked = ACHIEVEMENTS.filter((a) => game.ach[a.id]).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Player card */}
      <section className="relative overflow-hidden rounded-2xl bg-card p-4 shadow-card">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <LevelBadge level={lvl.level} />
          <div className="min-w-0">
            <p className="m-0 text-xs font-bold text-muted-foreground">目前稱號</p>
            <p className="m-0 truncate text-lg font-extrabold leading-tight">{lvl.title}</p>
          </div>
        </div>
        <div className="relative mt-4">
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-bold">Lv.{lvl.level} → {lvl.level + 1}</span>
            <span className="tabular font-bold text-muted-foreground">
              {lvl.into} / {lvl.need} XP
            </span>
          </div>
          <Bar value={lvl.into} max={lvl.need} fill="bg-xp" className="h-3" label="升級進度" />
          <p className="m-0 mt-2 text-xs text-muted-foreground">
            總經驗值 <b className="tabular text-foreground">{game.xp}</b> XP，再 {lvl.need - lvl.into} XP 升級
          </p>
        </div>
      </section>

      {/* Daily goal + streak */}
      <Panel title="今日目標">
        <div className="flex items-center gap-4">
          <Ring value={todayXP} max={game.goal} size={78} stroke={8} color={todayXP >= game.goal ? "hsl(var(--good))" : "hsl(var(--xp))"}>
            <div className="text-center leading-none">
              <b className="tabular block text-lg">{todayXP}</b>
              <span className="text-[11px] font-bold text-muted-foreground">/ {game.goal}</span>
            </div>
          </Ring>
          <div className="min-w-0">
            <p className="m-0 font-bold">{todayXP >= game.goal ? "達標了，做得好！" : `還差 ${game.goal - todayXP} XP`}</p>
            <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label="每日目標">
              {GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={game.goal === g}
                  onClick={() => setGoal(g)}
                  className="tabular rounded-full border-2 px-2 py-px text-xs font-bold text-muted-foreground transition-colors hover:text-foreground aria-pressed:border-primary aria-pressed:bg-accent aria-pressed:text-accent-foreground"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="連續學習"
        right={
          <span className="flex items-center gap-1 font-extrabold text-streak">
            <Flame className={cn("h-5 w-5", streak > 0 && "animate-flicker fill-streak/30")} />
            <span className="tabular">{streak} 天</span>
          </span>
        }
      >
        <div className="flex items-end justify-between gap-1.5" aria-label="最近 7 天經驗值">
          {week.map((d) => {
            const h = maxDay ? Math.max(4, Math.round((d.xp / maxDay) * 64)) : 4;
            const hit = d.xp >= STREAK_MIN;
            return (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5" title={`${d.key}：${d.xp} XP`}>
                <div className="flex h-16 w-full items-end justify-center">
                  <div
                    className={cn("w-full max-w-[22px] rounded-md transition-all duration-700", d.xp >= game.goal ? "bg-good" : hit ? "bg-xp" : "bg-secondary")}
                    style={{ height: h }}
                  />
                </div>
                <span className={cn("grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold", d.today ? "bg-foreground text-background" : "text-muted-foreground")}>
                  {hit ? <Flame className={cn("h-3.5 w-3.5", d.today ? "text-xp" : "text-streak")} /> : d.label}
                </span>
              </div>
            );
          })}
        </div>
        <p className="m-0 mt-2 text-xs text-muted-foreground">一天拿到 {STREAK_MIN} XP 以上就算有學習。</p>
      </Panel>

      {/* Achievements */}
      <Panel
        title="成就"
        right={
          <span className="tabular rounded-full bg-xp-soft px-2 text-xs font-extrabold text-[hsl(30_100%_30%)] dark:text-xp">
            {unlocked} / {ACHIEVEMENTS.length}
          </span>
        }
      >
        <ul className="m-0 grid list-none grid-cols-4 gap-2 p-0">
          {ACHIEVEMENTS.map((a) => {
            const on = !!game.ach[a.id];
            const I = ACH_ICON[a.icon];
            return (
              <li key={a.id} title={`${a.name}：${a.desc}${on ? "（已解鎖）" : ""}`} className="flex flex-col items-center gap-1 text-center">
                <span
                  className={cn(
                    "relative grid h-11 w-11 place-items-center rounded-full transition-transform hover:scale-110",
                    on ? "bg-gradient-to-br from-xp to-streak text-white shadow-btn" : "bg-secondary text-muted-foreground/60",
                  )}
                >
                  <I className="h-5 w-5" />
                  {!on && <Lock className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-card p-0.5 text-muted-foreground" />}
                </span>
                <span className={cn("text-[11px] font-bold leading-tight", on ? "text-foreground" : "text-muted-foreground")}>{a.name}</span>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="個人紀錄">
        <dl className="m-0 grid gap-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4 text-xp" /> 最高連擊
            </dt>
            <dd className="tabular m-0 font-extrabold">{game.bestCombo}</dd>
          </div>
          {TABS.map((t) => (
            <div key={t.k} className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Timer className="h-4 w-4 text-primary" /> 配對・{t.short}
              </dt>
              <dd className="tabular m-0 font-extrabold">{game.bestMatch[t.k] != null ? fmtTime(game.bestMatch[t.k]!) : "—"}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}
