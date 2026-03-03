import { useMemo } from "react";
import { LabeledPieChart } from "@/components/shared";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const HOURS_IN_DAY = 24;
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const STORAGE_KEY = "time-tracker";
const SCHEMA_VERSION = 5;

const BLOCK_COLORS: Record<string, string> = {
  sleep: "#E2D9F3",
  work: "#CCE5FF",
  study: "#CCE5FF",
  cooking: "#FFF3CD",
  chores: "#FFE5EC",
  exercise: "#D4EDDA",
};
const FREE_COLOR = "#FFFFFF";
const DEFAULT_COLOR = "#FFE5D0";

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

  const pieData = [
    ...data.blocks.map((b) => ({
      name: b.label,
      value: b.hours,
      color: BLOCK_COLORS[b.id] || DEFAULT_COLOR,
    })),
    ...(data.freeTime > 0
      ? [{ name: "Free", value: data.freeTime, color: FREE_COLOR }]
      : []),
  ];

  return (
    <div className={cn(
      "w-full rounded-lg p-3 neo-brutal-sm",
      data.freeTime > 0 ? "bg-pastel-purple" : "bg-pastel-pink"
    )}>
      <p className="text-[10px] text-black/60 dark:text-white/60 font-bold uppercase tracking-wide mb-0.5">
        Free Time Today
      </p>
      <p className="text-xl font-bold text-black dark:text-white font-mono">
        {formatHours(data.freeTime)}
      </p>
      <div className="flex items-center justify-center -mt-2">
        <LabeledPieChart
          data={pieData}
          theme={theme}
          formatValue={(v) => formatHours(v)}
          formatLabel={(_name, value) => formatHours(value)}
          size={180}
        />
      </div>
    </div>
  );
}
