import { useState, useMemo, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const HOURS_IN_WEEK = 168;
const DAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
type DayKey = (typeof DAY_KEYS)[number];

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

function formatPerDay(totalHours: number): string {
  return formatHours(totalHours / 7);
}

interface TimeBlock {
  id: string;
  label: string;
  emoji: string;
  color: string;
  weeklyOnly?: boolean;
  schedule: Record<DayKey, number>;
}

function totalHours(block: TimeBlock): number {
  return Object.values(block.schedule).reduce((s, v) => s + v, 0);
}

function makeSchedule(hours: number, weeklyOnly?: boolean): Record<DayKey, number> {
  if (weeklyOnly) {
    return { mon: hours, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 };
  }
  const perDay = Math.round((hours / 7) * 2) / 2;
  return Object.fromEntries(DAY_KEYS.map((d) => [d, perDay])) as Record<DayKey, number>;
}

const DEFAULT_BLOCKS: TimeBlock[] = [
  { id: "sleep", label: "Sleep", emoji: "😴", color: "bg-pastel-purple", schedule: makeSchedule(56) },
  { id: "work", label: "Work & Commute", emoji: "💻", color: "bg-pastel-blue", schedule: { mon: 9, tue: 9, wed: 9, thu: 9, fri: 9, sat: 0, sun: 0 } },
  { id: "study", label: "Study", emoji: "📚", color: "bg-pastel-blue", weeklyOnly: true, schedule: { mon: 0, tue: 2.5, wed: 0, thu: 2.5, fri: 0, sat: 3, sun: 2 } },
  { id: "cooking", label: "Cooking & Eating", emoji: "🍳", color: "bg-pastel-yellow", schedule: makeSchedule(10) },
  { id: "chores", label: "Hygiene & Chores", emoji: "🧹", color: "bg-pastel-pink", schedule: makeSchedule(9) },
  { id: "exercise", label: "Exercise", emoji: "🏋️", color: "bg-pastel-green", schedule: { mon: 1, tue: 0, wed: 1, thu: 0, fri: 1, sat: 1, sun: 1 } },
];

const STORAGE_KEY = "time-tracker";
const SCHEMA_VERSION = 5;

const LEGACY_KEYS = [
  "time-tracker-blocks",
  "time-tracker-blocks-v2",
  "time-tracker-blocks-v3",
  "time-tracker-blocks-v4",
];

function loadBlocks(): TimeBlock[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === SCHEMA_VERSION) return parsed.blocks;
    }
  } catch { /* use defaults */ }

  // Clean up any legacy keys
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));

  return DEFAULT_BLOCKS;
}

function saveBlocks(blocks: TimeBlock[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, blocks }));
}

const SLIDER_MAX = 10;
const SLIDER_STEP = 0.5;

interface TimeTrackerProps {
  onGoHome: () => void;
}

export function TimeTracker({ onGoHome }: TimeTrackerProps) {
  const [blocks, setBlocks] = useState<TimeBlock[]>(loadBlocks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<DayKey>(DAY_KEYS[new Date().getDay()]);

  useEffect(() => {
    saveBlocks(blocks);
  }, [blocks]);

  const editingBlock = editingId ? blocks.find((b) => b.id === editingId) : null;

  const todayKey = DAY_KEYS[new Date().getDay()];

  const allocated = useMemo(
    () => blocks.reduce((sum, b) => sum + totalHours(b), 0),
    [blocks]
  );
  const freeTime = HOURS_IN_WEEK - allocated;

  const updateDayHours = useCallback((id: string, day: DayKey, value: number) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, schedule: { ...b.schedule, [day]: value } } : b
      )
    );
  }, []);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 bg-background px-4 pt-2 pb-3">
        <div className="flex items-center gap-2 h-6">
          <button
            onClick={onGoHome}
            className="h-6 w-6 rounded-md flex items-center justify-center border-[1.5px] border-black dark:border-white bg-pastel-pink transition-all hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:shadow-[1.5px_1.5px_0_#1a1a1a] dark:hover:shadow-[1.5px_1.5px_0_#FFFBF0]"
          >
            <ChevronLeft className="h-3 w-3 text-black dark:text-white" />
          </button>
          <h1 className="text-sm font-bold text-foreground flex-1">
            Weekly Time
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-8 space-y-4">
        {/* Free time hero card */}
        <div className={cn(
          "p-4 rounded-lg border-[1.5px] border-black dark:border-white shadow-[3px_3px_0_#1a1a1a] dark:shadow-[3px_3px_0_#FFFBF0]",
          freeTime > 0 ? "bg-pastel-green" : "bg-pastel-pink"
        )}>
          <p className="text-[10px] font-bold text-black/60 dark:text-foreground/60 uppercase tracking-wide mb-1">
            Free Time This Week
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-black dark:text-foreground">
              {formatHours(freeTime)}
            </span>
            <span className="text-xs font-bold text-black/50 dark:text-foreground/50">
              ≈ {formatPerDay(freeTime)} / day
            </span>
          </div>
          <p className="text-[10px] text-black/50 dark:text-foreground/50 font-medium mt-1">
            {formatHours(allocated)} allocated of {HOURS_IN_WEEK}h
          </p>
        </div>

        {/* Visual bar */}
        <div className="rounded-lg border-[1.5px] border-black dark:border-white overflow-hidden h-5 flex bg-muted">
          {blocks.map((block) => {
            const hrs = totalHours(block);
            const pct = (hrs / HOURS_IN_WEEK) * 100;
            if (pct <= 0) return null;
            return (
              <div
                key={block.id}
                className={cn("h-full transition-all duration-300", block.color)}
                style={{ width: `${pct}%` }}
                title={`${block.label}: ${formatHours(hrs)}`}
              />
            );
          })}
          {freeTime > 0 && (
            <div
              className="h-full bg-white/60 dark:bg-white/20"
              style={{ width: `${(freeTime / HOURS_IN_WEEK) * 100}%` }}
            />
          )}
        </div>

        {/* Time blocks */}
        <div className="flex flex-col gap-3">
          {[...blocks].sort((a, b) => totalHours(b) - totalHours(a)).map((block) => {
            const weekly = totalHours(block);
            const today = block.schedule[todayKey] || 0;
            return (
              <button
                key={block.id}
                onClick={() => {
                  setActiveDay(DAY_KEYS[new Date().getDay()]);
                  setEditingId(block.id);
                }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border-[1.5px] border-black dark:border-white shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0] text-left transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[0.5px_0.5px_0_#1a1a1a] dark:active:shadow-[0.5px_0.5px_0_#FFFBF0]",
                  block.color
                )}
              >
                <span className="text-lg">{block.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-black dark:text-foreground truncate">
                    {block.label}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold font-mono text-black dark:text-foreground">
                    {formatHours(today)}
                  </span>
                  <span className="text-[10px] font-bold font-mono text-black/40 dark:text-foreground/40">
                    / {formatHours(weekly)}
                  </span>
                  <ChevronRight className="h-3 w-3 text-black/40 dark:text-foreground/40" />
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-[10px] text-center text-muted-foreground font-medium pt-2">
          Tap a row to set your weekly schedule. ✌️
        </p>
      </main>

      {/* Edit dialog */}
      <Dialog open={!!editingBlock} onOpenChange={(open) => !open && setEditingId(null)}>
        {editingBlock && (
          <DialogContent
            className="sm:max-w-xs rounded-xl border-[1.5px] border-black dark:border-white shadow-[4px_4px_0_#1a1a1a] dark:shadow-[4px_4px_0_#FFFBF0]"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader className={cn(
              "pb-2 border-b-[1.5px] border-black dark:border-white -mx-5 -mt-5 px-4 pt-4 mb-3 rounded-t-xl",
              editingBlock.color
            )}>
              <DialogTitle className="text-sm font-bold text-black dark:text-foreground flex items-center gap-2">
                <span>{editingBlock.emoji}</span>
                {editingBlock.label}
                <span className="ml-auto font-mono text-xs">
                  {formatHours(totalHours(editingBlock))}/wk
                </span>
              </DialogTitle>
            </DialogHeader>

            {/* Day bubbles */}
            <div className="flex justify-between gap-1.5 mb-4">
              {DAY_KEYS.map((day, i) => {
                const hasHours = editingBlock.schedule[day] > 0;
                const isActive = activeDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold border-[1.5px] transition-all",
                      isActive
                        ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black scale-110"
                        : hasHours
                          ? "border-black dark:border-white bg-pastel-green text-black dark:text-foreground"
                          : "border-black/30 dark:border-white/30 text-muted-foreground"
                    )}
                  >
                    {DAYS[i]}
                  </button>
                );
              })}
            </div>

            {/* Slider for active day */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][DAY_KEYS.indexOf(activeDay)]}
                </p>
                <span className="text-lg font-bold font-mono text-foreground">
                  {formatHours(editingBlock.schedule[activeDay])}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={SLIDER_MAX}
                step={SLIDER_STEP}
                value={editingBlock.schedule[activeDay]}
                onChange={(e) => updateDayHours(editingBlock.id, activeDay, parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-black dark:accent-white bg-muted"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
                <span>0</span>
                <span>2</span>
                <span>4</span>
                <span>6</span>
                <span>8</span>
                <span>10</span>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
