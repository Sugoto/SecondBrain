import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Footprints, RefreshCw, Check, X, Dumbbell } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useHealthData } from "@/hooks/useHealthData";
import { useGoogleFit, stepsToActivityLevel } from "@/hooks/useGoogleFit";
import { Card } from "@/components/ui/card";
import { ACTIVITY_LEVELS } from "./types";
import type { ActivityLevel, StepLog } from "@/lib/supabase";

// Sync cooldown: 1 hour
const SYNC_COOLDOWN_MS = 60 * 60 * 1000;
const LAST_SYNC_KEY = "gfit_last_sync";

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateShort(dateKey: string): string {
  const date = new Date(dateKey + "T12:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDayLabel(date: Date, isToday: boolean): string {
  if (isToday) return "Today";
  return date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3);
}

function formatSteps(steps: number): string {
  if (steps >= 1000) {
    return `${(steps / 1000).toFixed(1)}k`;
  }
  return String(steps);
}

function formatAxisLabel(value: number): string {
  if (value >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }
  return String(value);
}

// Activity level priority for comparison
const ACTIVITY_PRIORITY: Record<string, number> = {
  sedentary: 0,
  light: 1,
  moderate: 2,
  heavy: 3,
};

function getLevelColor(steps: number, isWorkout: boolean): string {
  let level = stepsToActivityLevel(steps);
  // Workout days are at least moderate
  if (isWorkout && ACTIVITY_PRIORITY[level] < ACTIVITY_PRIORITY.moderate) {
    level = "moderate";
  }
  return ACTIVITY_LEVELS.find(l => l.value === level)?.color ?? "#6b7280";
}

export function StepGraph() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { stepLog, mergeActivityLog, workoutDates, toggleWorkout } = useHealthData();
  const { syncSteps, isLoading: isSyncing, isConfigured } = useGoogleFit();
  const [selectedBar, setSelectedBar] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [stepInput, setStepInput] = useState("");
  const hasAutoSynced = useRef(false);

  // Auto-sync on mount if configured and cooldown has passed
  useEffect(() => {
    if (!isConfigured || hasAutoSynced.current) return;
    
    const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) ?? "0");
    const timeSinceLastSync = Date.now() - lastSync;
    
    // Only auto-sync if we have consent and cooldown has passed
    const hasConsent = localStorage.getItem("gfit_consented") === "true";
    if (hasConsent && timeSinceLastSync > SYNC_COOLDOWN_MS) {
      hasAutoSynced.current = true;
      handleSync();
    }
  }, [isConfigured]);

  // Generate last 7 days data
  const weekData = useMemo(() => {
    const days: { date: string; label: string; steps: number; color: string; isToday: boolean; isWorkout: boolean }[] = [];
    const today = new Date();
    const todayKey = formatDateKey(today);
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = formatDateKey(date);
      const steps = stepLog[dateKey] ?? 0;
      const isToday = dateKey === todayKey;
      const isWorkout = workoutDates.has(dateKey);
      
      days.push({
        date: dateKey,
        label: getDayLabel(date, isToday),
        steps,
        color: getLevelColor(steps, isWorkout),
        isToday,
        isWorkout,
      });
    }
    
    return days;
  }, [stepLog, workoutDates]);

  // Calculate max for scaling
  const { maxSteps, yAxisTicks } = useMemo(() => {
    const dataMax = Math.max(...weekData.map(d => d.steps), 100);
    const magnitude = Math.pow(10, Math.floor(Math.log10(dataMax)));
    const normalized = dataMax / magnitude;
    let niceMax: number;
    if (normalized <= 1) niceMax = magnitude;
    else if (normalized <= 2) niceMax = 2 * magnitude;
    else if (normalized <= 5) niceMax = 5 * magnitude;
    else niceMax = 10 * magnitude;
    
    const ticks = [0, niceMax / 2, niceMax];
    return { maxSteps: niceMax, yAxisTicks: ticks };
  }, [weekData]);

  const totalSteps = useMemo(() => 
    weekData.reduce((sum, d) => sum + d.steps, 0), 
    [weekData]
  );

  const avgSteps = Math.round(totalSteps / 7);

  const handleSync = async () => {
    const result = await syncSteps(30);
    if (result) {
      mergeActivityLog(result.activityLog, result.stepLog);
      // Save last sync timestamp
      localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
    }
  };

  const handleBarTap = (date: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from clearing selection
    if (selectedBar === date) {
      // Second tap - open inline editor
      setEditingDate(date);
      setStepInput(String(stepLog[date] ?? ""));
    } else {
      setSelectedBar(date);
      setEditingDate(null);
    }
  };

  const handleCardClick = () => {
    if (!editingDate) {
      setSelectedBar(null);
    }
  };

  const handleSaveSteps = () => {
    if (!editingDate) return;
    
    const steps = parseInt(stepInput) || 0;
    const level: ActivityLevel = stepsToActivityLevel(steps);
    
    const newStepLog: StepLog = { [editingDate]: steps };
    const newActivityLog = { [editingDate]: level };
    
    mergeActivityLog(newActivityLog, newStepLog);
    
    setEditingDate(null);
    setSelectedBar(null);
    setStepInput("");
  };

  const handleCancelEdit = () => {
    setEditingDate(null);
    setStepInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveSteps();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const editingDayData = editingDate ? weekData.find(d => d.date === editingDate) : null;
  const isEditingWorkout = editingDate ? workoutDates.has(editingDate) : false;
  const previewColor = stepInput ? getLevelColor(parseInt(stepInput) || 0, isEditingWorkout) : editingDayData?.color;

  return (
    <Card
      className="p-4 overflow-hidden"
      onClick={handleCardClick}
      style={{
        background: isDark
          ? "linear-gradient(135deg, rgba(20, 20, 24, 0.9) 0%, rgba(30, 30, 35, 0.8) 100%)"
          : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 252, 0.9) 100%)",
        backdropFilter: "blur(20px)",
        border: isDark
          ? "1px solid rgba(255, 255, 255, 0.08)"
          : "1px solid rgba(0, 0, 0, 0.05)",
        boxShadow: isDark
          ? "0 8px 32px rgba(0, 0, 0, 0.4)"
          : "0 8px 32px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)" }}
          >
            <Footprints className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Weekly Steps</h3>
            <p className="text-[10px] text-muted-foreground">
              Avg: {formatSteps(avgSteps)}/day
            </p>
          </div>
        </div>
        
        {isConfigured && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="h-8 w-8 rounded-full flex items-center justify-center transition-colors hover:bg-muted disabled:opacity-50"
            style={{
              border: isDark 
                ? "1px solid rgba(255,255,255,0.15)" 
                : "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {/* Bar Graph with Y-Axis */}
      <div className="flex">
        {/* Y-Axis */}
        <div className="flex flex-col justify-between items-end pr-2 h-28 text-[9px] font-mono text-muted-foreground">
          {[...yAxisTicks].reverse().map((tick) => (
            <span key={tick}>{formatAxisLabel(tick)}</span>
          ))}
        </div>

        {/* Bars */}
        <div className="flex-1 flex flex-col">
          <div 
            className="flex items-end gap-1.5 h-28 border-l border-b"
            style={{
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
            }}
          >
            {weekData.map((day, index) => {
              const heightPercent = maxSteps > 0 ? (day.steps / maxSteps) * 100 : 0;
              const isSelected = selectedBar === day.date;
              
              return (
                <button
                  key={day.date}
                  onClick={(e) => handleBarTap(day.date, e)}
                  className="flex-1 h-full flex items-end justify-center focus:outline-none relative"
                >
                  {/* Workout indicator - positioned above the bar */}
                  {day.isWorkout && (
                    <motion.div
                      initial={{ bottom: 0 }}
                      animate={{ bottom: `${heightPercent}%` }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.05,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      className="absolute left-1/2 -translate-x-1/2 z-10"
                      style={{ marginBottom: 4 }}
                    >
                      <Dumbbell className="h-3 w-3 text-foreground" />
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.05,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className={`w-full max-w-[28px] rounded-t-md relative overflow-hidden transition-opacity ${
                      selectedBar && !isSelected ? "opacity-40" : "opacity-100"
                    }`}
                    style={{
                      background: `linear-gradient(180deg, ${day.color} 0%, ${day.color}90 100%)`,
                      boxShadow: day.steps > 0 && isSelected
                        ? `0 4px 16px ${day.color}50`
                        : "none",
                      minHeight: day.steps > 0 ? "4px" : "0",
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                      }}
                    />
                  </motion.div>
                  
                  {/* Step count tooltip */}
                  <AnimatePresence>
                    {isSelected && !editingDate && day.steps > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className="absolute -top-7 px-2 py-1 rounded-md text-[11px] font-mono font-semibold text-white z-10"
                        style={{
                          background: day.color,
                          boxShadow: `0 2px 8px ${day.color}60`,
                        }}
                      >
                        {day.steps.toLocaleString()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>

          {/* X-Axis Labels */}
          <div className="flex gap-1.5 mt-1.5 pl-px">
            {weekData.map((day) => (
              <span
                key={day.date}
                className={`flex-1 text-center text-[9px] font-medium ${
                  day.isToday ? "text-blue-500" : "text-muted-foreground"
                }`}
              >
                {day.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Inline Step Editor */}
      <AnimatePresence>
        {editingDate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              className="mt-3 pt-3 border-t"
              style={{
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDateShort(editingDate)}
                </span>
                <button
                  onClick={() => editingDate && toggleWorkout(editingDate)}
                  className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    isEditingWorkout 
                      ? "bg-orange-500 text-white" 
                      : "border text-muted-foreground hover:bg-muted/50"
                  }`}
                  style={{
                    borderColor: !isEditingWorkout 
                      ? (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)") 
                      : undefined,
                  }}
                  title={isEditingWorkout ? "Remove workout" : "Mark as workout"}
                >
                  <Dumbbell className="h-4 w-4" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Steps"
                    value={stepInput}
                    onChange={(e) => setStepInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-9 px-3 text-sm font-mono rounded-lg bg-transparent border focus:outline-none focus:ring-2 focus:ring-offset-1"
                    style={{
                      borderColor: previewColor,
                      outlineColor: previewColor,
                    }}
                  />
                </div>
                <button
                  onClick={handleCancelEdit}
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSaveSteps}
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-white transition-colors"
                  style={{ background: previewColor }}
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
