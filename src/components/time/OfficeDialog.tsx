import { useState, useMemo } from "react";
import { Loader2, Building2, Car, Briefcase } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTimeEvents, getTodayDate } from "@/hooks/useTimeEvents";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OfficeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OfficeDialog({ open, onOpenChange }: OfficeDialogProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { addEvent, isAdding } = useTimeEvents();

  const [travelDuration] = useState(30);
  const [workEndTime, setWorkEndTime] = useState("13:00");

  const schedule = useMemo(() => {
    const travelStartMinutes = 8 * 60;
    const workStartMinutes = travelStartMinutes + travelDuration;
    const [endH, endM] = workEndTime.split(":").map(Number);
    const workEndMinutes = endH * 60 + endM;
    const returnTravelEndMinutes = workEndMinutes + travelDuration;

    const fmt = (m: number) => {
      const h = Math.floor(m / 60) % 24;
      const min = m % 60;
      return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    };

    return {
      travel1: { start: fmt(travelStartMinutes), end: fmt(workStartMinutes) },
      work: { start: fmt(workStartMinutes), end: workEndTime },
      travel2: { start: workEndTime, end: fmt(returnTravelEndMinutes) },
    };
  }, [workEndTime, travelDuration]);

  const today = getTodayDate();

  const handleSave = async () => {
    if (isAdding) return;
    await Promise.all([
      addEvent({
        title: "Commute",
        date: today,
        start_time: schedule.travel1.start,
        end_time: schedule.travel1.end,
        category: "travel",
        notes: null,
      }),
      addEvent({
        title: "Work",
        date: today,
        start_time: schedule.work.start,
        end_time: schedule.work.end,
        category: "work",
        notes: null,
      }),
      addEvent({
        title: "Commute",
        date: today,
        start_time: schedule.travel2.start,
        end_time: schedule.travel2.end,
        category: "travel",
        notes: null,
      }),
    ]);
    onOpenChange(false);
  };

  const fmt12 = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ap = h < 12 ? "am" : "pm";
    return m === 0 ? `${hr}${ap}` : `${hr}:${String(m).padStart(2, "0")}${ap}`;
  };

  const accent = "#14b8a6";

  return (
    <Dialog open={open} onOpenChange={(o) => !isAdding && onOpenChange(o)}>
      <DialogContent
        className="max-w-sm w-[calc(100%-2rem)] rounded-2xl overflow-hidden flex flex-col p-0 gap-0 border bg-background"
        onOpenAutoFocus={(e) => e.preventDefault()}
        style={{
          borderColor: `${accent}30`,
          boxShadow: `0 20px 40px -12px ${accent}25`,
        }}
      >
        {/* Header - icon left, title centered */}
        <DialogHeader
          className="shrink-0 px-4 pt-4 pb-3 relative"
          style={{
            background: isDark
              ? `linear-gradient(135deg, ${accent}20 0%, ${accent}08 100%)`
              : `linear-gradient(135deg, ${accent}12 0%, ${accent}05 100%)`,
          }}
        >
          <div className="flex items-center relative min-h-[40px]">
            {/* Icon - left side */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, #0d9488 100%)`,
                boxShadow: `0 4px 12px ${accent}40`,
              }}
            >
              <Building2 className="h-5 w-5 text-white" />
            </div>

            {/* Title - centered */}
            <div className="flex-1 text-center pr-10">
              <DialogTitle className="text-base font-bold">
                Go to Office
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground">
                {new Date(today).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-4 py-3 space-y-1.5">
          {/* Travel to Office */}
          <div
            className="flex items-center h-10 px-3 rounded-lg gap-3"
            style={{
              background: isDark
                ? "rgba(249, 115, 22, 0.1)"
                : "rgba(249, 115, 22, 0.06)",
            }}
          >
            <Car className="h-4 w-4 shrink-0" style={{ color: "#f97316" }} />
            <span
              className="text-xs font-medium flex-1"
              style={{ color: "#f97316" }}
            >
              Commute
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {fmt12(schedule.travel1.start)} → {fmt12(schedule.travel1.end)}
            </span>
          </div>

          {/* Work */}
          <div
            className="flex items-center h-10 px-3 rounded-lg gap-3"
            style={{
              background: isDark
                ? "rgba(59, 130, 246, 0.1)"
                : "rgba(59, 130, 246, 0.06)",
            }}
          >
            <Briefcase
              className="h-4 w-4 shrink-0"
              style={{ color: "#3b82f6" }}
            />
            <span
              className="text-xs font-medium flex-1"
              style={{ color: "#3b82f6" }}
            >
              Work
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {fmt12(schedule.work.start)} →
            </span>
            <Input
              type="time"
              value={workEndTime}
              onChange={(e) => setWorkEndTime(e.target.value)}
              className="h-7 w-[88px] text-[11px] px-2 font-mono"
              style={{
                borderColor: "rgba(59, 130, 246, 0.25)",
                background: isDark
                  ? "rgba(59, 130, 246, 0.15)"
                  : "rgba(59, 130, 246, 0.08)",
              }}
              disabled={isAdding}
            />
          </div>

          {/* Travel Home */}
          <div
            className="flex items-center h-10 px-3 rounded-lg gap-3"
            style={{
              background: isDark
                ? "rgba(249, 115, 22, 0.1)"
                : "rgba(249, 115, 22, 0.06)",
            }}
          >
            <Car className="h-4 w-4 shrink-0" style={{ color: "#f97316" }} />
            <span
              className="text-xs font-medium flex-1"
              style={{ color: "#f97316" }}
            >
              Commute
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {fmt12(schedule.travel2.start)} → {fmt12(schedule.travel2.end)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-2 px-4 py-3 border-t"
          style={{ borderColor: `${accent}15` }}
        >
          <Button
            variant="ghost"
            className="flex-1 h-9"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-9 font-medium text-white"
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, #0d9488 100%)`,
            }}
            onClick={handleSave}
            disabled={isAdding}
          >
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
