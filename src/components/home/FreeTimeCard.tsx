import { useMemo } from "react";
import { Clock } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const HOURS_IN_DAY = 24;
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const STORAGE_KEY = "time-tracker";
const SCHEMA_VERSION = 5;

const BLOCK_COLORS_DARK: Record<string, string> = {
  sleep: "#6366f1",
  work: "#8b5cf6",
  study: "#a78bfa",
  cooking: "#c084fc",
  chores: "#a855f7",
  exercise: "#7c3aed",
};

const BLOCK_COLORS_LIGHT: Record<string, string> = {
  sleep: "#818cf8",
  work: "#a78bfa",
  study: "#c4b5fd",
  cooking: "#d8b4fe",
  chores: "#c084fc",
  exercise: "#8b5cf6",
};

const DEFAULT_COLOR_DARK = "#4f46e5";
const DEFAULT_COLOR_LIGHT = "#a5b4fc";

interface BlockInfo {
  id: string;
  label: string;
  hours: number;
}

function formatHours(h: number): string {
  if (h === 0) return "0h";
  const whole = Math.floor(h);
  const frac = h - whole;
  if (frac === 0) return `${whole}h`;
  const mins = Math.round((frac * 60) / 10) * 10;
  if (mins === 60) return `${whole + 1}h`;
  if (whole === 0) return `${mins}m`;
  return `${whole}h ${mins}m`;
}

function getTodayData(): { freeTime: number; blocks: BlockInfo[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== SCHEMA_VERSION) return null;

    const todayKey = DAY_KEYS[new Date().getDay()];
    const blocks: BlockInfo[] = (parsed.blocks as { id: string; label: string; schedule: Record<string, number> }[])
      .map((b) => ({ id: b.id, label: b.label, hours: b.schedule[todayKey] || 0 }))
      .filter((b) => b.hours > 0)
      .sort((a, b) => b.hours - a.hours);

    const allocated = blocks.reduce((sum, b) => sum + b.hours, 0);
    return { freeTime: HOURS_IN_DAY - allocated, blocks };
  } catch {
    return null;
  }
}

export function FreeTimeCard() {
  const data = useMemo(() => getTodayData(), []);
  const { theme } = useTheme();

  if (!data) return null;

  const isDark = theme === "dark";
  const colors = isDark ? BLOCK_COLORS_DARK : BLOCK_COLORS_LIGHT;
  const defaultColor = isDark ? DEFAULT_COLOR_DARK : DEFAULT_COLOR_LIGHT;

  const segments = [
    ...data.blocks.map((b) => ({
      id: b.id,
      label: b.label,
      hours: b.hours,
      pct: (b.hours / HOURS_IN_DAY) * 100,
      color: colors[b.id] || defaultColor,
    })),
    ...(data.freeTime > 0
      ? [{
          id: "free",
          label: "Free",
          hours: data.freeTime,
          pct: (data.freeTime / HOURS_IN_DAY) * 100,
          color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
        }]
      : []),
  ];

  return (
    <div className="vercel-card vercel-glow px-5 py-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-violet-500/10 dark:bg-violet-400/10 flex items-center justify-center">
            <Clock className="h-3 w-3 text-violet-600 dark:text-violet-400" />
          </div>
          <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            Free Time
          </span>
        </div>
        <span className="text-xl font-bold text-neutral-900 dark:text-white font-mono tracking-tighter">
          {formatHours(data.freeTime)}
        </span>
      </div>

      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-neutral-100 dark:bg-white/5">
        {segments.map((seg) => (
          <div
            key={seg.id}
            className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
            style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
            title={`${seg.label}: ${formatHours(seg.hours)}`}
          />
        ))}
      </div>

      {/* Legend row */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5">
        {segments.filter((s) => s.pct >= 4).map((seg) => (
          <div key={seg.id} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
              {seg.label}
            </span>
            <span className="text-[10px] font-mono font-semibold text-neutral-700 dark:text-neutral-300">
              {formatHours(seg.hours)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
