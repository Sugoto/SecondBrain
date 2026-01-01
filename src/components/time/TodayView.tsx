import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Briefcase,
  BookOpen,
  Dumbbell,
  Users,
  Car,
  Moon,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import {
  useTimeEvents,
  getEventsForDate,
  getTodayDate,
} from "@/hooks/useTimeEvents";
import { EVENT_CATEGORIES, DEFAULT_DAILY_EVENTS } from "@/lib/supabase";
import type { TimeEvent } from "@/lib/supabase";
import { EventDialog } from "./EventDialog";

const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  Briefcase,
  BookOpen,
  Dumbbell,
  Users,
  Car,
  Moon,
};

// Constants for timeline
const HOUR_HEIGHT = 60; // pixels per hour
const START_HOUR = 8; // Calendar starts at 8am
const END_HOUR = 24; // Calendar ends at midnight (24 = 12am next day)
const TIMELINE_HOURS = END_HOUR - START_HOUR; // 16 hours displayed
const TOTAL_HEIGHT = HOUR_HEIGHT * TIMELINE_HOURS;
// Hours from 8am to midnight: 8,9,10...23,0 (0 represents midnight at the end)
const HOURS = [
  ...Array.from({ length: TIMELINE_HOURS }, (_, i) => START_HOUR + i),
  0,
];

// Convert hour to visual position (hours since START_HOUR)
// Returns -1 if hour is outside the visible range
function hourToPosition(hour: number): number {
  if (hour < START_HOUR || hour >= END_HOUR) return -1;
  return hour - START_HOUR;
}

function getCategoryColor(categoryId: string): string {
  return EVENT_CATEGORIES.find((c) => c.id === categoryId)?.color || "#6b7280";
}

function getCategoryIconName(categoryId: string): string {
  const cat = EVENT_CATEGORIES.find((c) => c.id === categoryId);
  return cat?.icon || "Briefcase";
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? "am" : "pm";
  return m === 0
    ? `${hour12}${ampm}`
    : `${hour12}:${String(m).padStart(2, "0")}${ampm}`;
}

export function TodayView() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { events, isLoading } = useTimeEvents();
  const [showDialog, setShowDialog] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [editingEvent, setEditingEvent] = useState<TimeEvent | null>(null);
  const [initialStartTime, setInitialStartTime] = useState<string>("");
  const [initialEndTime, setInitialEndTime] = useState<string>("");
  const timelineRef = useRef<HTMLDivElement>(null);

  const today = getTodayDate();
  const userEvents = useMemo(
    () => getEventsForDate(events, today),
    [events, today]
  );

  // Merge user events with default daily events
  const allEvents = useMemo(() => {
    const defaultEvents: TimeEvent[] = DEFAULT_DAILY_EVENTS.map((e, i) => ({
      ...e,
      id: `default-${i}`,
      date: today,
      created_at: "",
    }));
    return [...defaultEvents, ...userEvents].sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );
  }, [userEvents, today]);

  // Calculate scheduled hours from all events
  const scheduledMinutes = useMemo(() => {
    return allEvents.reduce((total, event) => {
      if (!event.end_time) return total;
      const startMin = timeToMinutes(event.start_time);
      const endMin = timeToMinutes(event.end_time);
      const duration = Math.max(0, endMin - startMin);
      return total + duration;
    }, 0);
  }, [allEvents]);

  const freeMinutes = Math.max(0, 24 * 60 - scheduledMinutes);
  const freeHours = Math.floor(freeMinutes / 60);
  const freeMinutesRemainder = Math.round(freeMinutes % 60);

  // Create 24-hour map with category colors for segmented bar (midnight to midnight)
  const hourlyColors = useMemo(() => {
    const colors: (string | null)[] = new Array(24).fill(null);
    allEvents.forEach((event) => {
      if (!event.end_time) return;
      const [startH] = event.start_time.split(":").map(Number);
      const [endH, endM] = event.end_time.split(":").map(Number);
      const endHour = endM > 0 ? endH : endH - 1;
      const eventColor = getCategoryColor(event.category);
      for (let h = startH; h <= Math.min(23, endHour); h++) {
        if (!colors[h]) {
          colors[h] = eventColor;
        }
      }
    });
    return colors;
  }, [allEvents]);

  // Scroll to current time on mount
  useEffect(() => {
    if (timelineRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinuteOffset = now.getMinutes();
      const position = hourToPosition(currentHour);
      // Only scroll if current time is within visible range
      if (position >= 0) {
        const positionHours = position + currentMinuteOffset / 60;
        const scrollPosition = positionHours * HOUR_HEIGHT - 100;
        timelineRef.current.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: "smooth",
        });
      }
    }
  }, []);

  // Check if event is a default (non-editable) event
  const isDefaultEvent = (id: string) => id.startsWith("default-");

  const handleEditEvent = (event: TimeEvent) => {
    setEditingEvent(event);
    setDialogKey((k) => k + 1);
    setShowDialog(true);
  };

  // Handle tap on timeline to create event
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top + (timelineRef.current?.scrollTop || 0) - 16; // Account for top padding

    // Convert pixel position to hours since START_HOUR
    const hoursFromStart = y / HOUR_HEIGHT;
    // Convert back to actual hour of day
    const actualHour = (Math.floor(hoursFromStart) + START_HOUR) % 24;
    const minuteOffset = Math.round((hoursFromStart % 1) * 60);
    const totalMinutes = actualHour * 60 + minuteOffset;

    // Round to nearest 15 minutes
    const roundedMinutes = Math.round(totalMinutes / 15) * 15;
    const startTime = minutesToTime(roundedMinutes % (24 * 60));
    const endTime = minutesToTime((roundedMinutes + 60) % (24 * 60)); // Default 1 hour duration

    setInitialStartTime(startTime);
    setInitialEndTime(endTime);
    setDialogKey((k) => k + 1);
    setShowDialog(true);
  };

  // Current time indicator position
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinuteOffset = now.getMinutes();
  const currentPosition = hourToPosition(currentHour);
  const isCurrentTimeVisible = currentPosition >= 0;
  const currentPositionHours = isCurrentTimeVisible
    ? currentPosition + currentMinuteOffset / 60
    : 0;
  const currentTimePosition = 16 + currentPositionHours * HOUR_HEIGHT;

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Free Time Card with Progress Bar */}
      <div className="sticky top-0 z-20 bg-background px-4 pt-4 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl px-3 py-2.5"
          style={{
            background: isDark
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
            border: isDark
              ? "1px solid rgba(255, 255, 255, 0.08)"
              : "1px solid rgba(0, 0, 0, 0.06)",
          }}
        >
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Today's Schedule
          </p>
          <div className="flex items-baseline gap-0.5">
            <span
              className="text-xs font-bold font-mono"
              style={{ color: "#14b8a6" }}
            >
              {freeHours}h {freeMinutesRemainder}m
            </span>
            <span className="text-[9px] text-muted-foreground ml-1">free</span>
          </div>
        </div>

        {/* Segmented 24-hour timeline */}
        <div className="flex gap-[2px]">
          {hourlyColors.map((color, hour) => (
            <motion.div
              key={hour}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3, delay: hour * 0.02 }}
              className="flex-1 h-2.5 rounded-sm"
              style={{
                background: color
                  ? `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`
                  : isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.06)",
                boxShadow: color ? `0 2px 4px ${color}40` : "none",
              }}
              title={`${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour} ${
                hour < 12 ? "AM" : "PM"
              }`}
            />
          ))}
        </div>

        {/* Time labels */}
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-muted-foreground">12am</span>
          <span className="text-[9px] text-muted-foreground">6am</span>
          <span className="text-[9px] text-muted-foreground">12pm</span>
          <span className="text-[9px] text-muted-foreground">6pm</span>
          <span className="text-[9px] text-muted-foreground">12am</span>
        </div>
        </motion.div>
      </div>

      {/* Timeline Container */}
      <div
        ref={timelineRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative mt-2 pr-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div
            className="relative ml-14 pt-1 pb-8"
            style={{ height: TOTAL_HEIGHT + 48 }}
            onClick={handleTimelineClick}
          >
            {/* Continuous vertical timeline bar */}
            <div
              className="absolute left-0 w-[3px] rounded-full"
              style={{
                top: 16,
                bottom: 32,
                background: isDark
                  ? "linear-gradient(180deg, rgba(20, 184, 166, 0.4) 0%, rgba(20, 184, 166, 0.15) 50%, rgba(20, 184, 166, 0.4) 100%)"
                  : "linear-gradient(180deg, rgba(20, 184, 166, 0.5) 0%, rgba(20, 184, 166, 0.2) 50%, rgba(20, 184, 166, 0.5) 100%)",
              }}
            />

            {/* Hour markers */}
            {HOURS.map((hour, index) => (
              <div
                key={hour}
                className="absolute flex items-center"
                style={{ top: 16 + index * HOUR_HEIGHT }}
              >
                {/* Time label - positioned to the left of timeline */}
                <div
                  className="absolute right-full mr-3 text-[10px] font-mono shrink-0"
                  style={{
                    color: isDark
                      ? "rgba(255, 255, 255, 0.5)"
                      : "rgba(0, 0, 0, 0.45)",
                  }}
                >
                  {formatHour(hour)}
                </div>

                {/* Hour node on timeline */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 5,
                    height: 5,
                    left: -1,
                    background: isDark
                      ? "rgba(255, 255, 255, 0.25)"
                      : "rgba(0, 0, 0, 0.18)",
                  }}
                />

                {/* Horizontal grid line at every hour */}
                <div
                  className="absolute"
                  style={{
                    left: 12,
                    width: "calc(100vw - 80px)",
                    height: 1,
                    background: isDark
                      ? "rgba(255, 255, 255, 0.12)"
                      : "rgba(0, 0, 0, 0.08)",
                  }}
                />
              </div>
            ))}

            {/* Events */}
            {allEvents.map((event) => (
              <TimelineEvent
                key={event.id}
                event={event}
                isDark={isDark}
                onEdit={() => handleEditEvent(event)}
                isDefault={isDefaultEvent(event.id)}
              />
            ))}

            {/* Current time indicator - only show if within 8am-midnight */}
            {isCurrentTimeVisible && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute z-10 pointer-events-none"
                style={{ top: currentTimePosition }}
              >
                {/* Glowing dot on timeline */}
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 8px rgba(20, 184, 166, 0.6)",
                      "0 0 16px rgba(20, 184, 166, 0.8)",
                      "0 0 8px rgba(20, 184, 166, 0.6)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute rounded-full"
                  style={{
                    width: 11,
                    height: 11,
                    left: -4,
                    top: -5.5,
                    background:
                      "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                    border: `2px solid ${isDark ? "#18181b" : "#ffffff"}`,
                  }}
                />
                {/* Time line extending right */}
                <div
                  className="absolute left-3 h-[1.5px] w-[200px]"
                  style={{
                    top: 0,
                    background:
                      "linear-gradient(90deg, #14b8a6 0%, transparent 100%)",
                  }}
                />
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Event Dialog */}
      <EventDialog
        key={dialogKey}
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) setEditingEvent(null);
        }}
        initialDate={today}
        initialStartTime={initialStartTime}
        initialEndTime={initialEndTime}
        editEvent={editingEvent}
      />
    </div>
  );
}

interface TimelineEventProps {
  event: TimeEvent;
  isDark: boolean;
  onEdit: () => void;
  isDefault?: boolean;
}

function TimelineEvent({
  event,
  isDark,
  onEdit,
  isDefault = false,
}: TimelineEventProps) {
  const color = getCategoryColor(event.category);
  const iconName = getCategoryIconName(event.category);
  const IconComponent = CATEGORY_ICONS[iconName];

  const startMinutes = timeToMinutes(event.start_time);
  const endMinutes = event.end_time
    ? timeToMinutes(event.end_time)
    : startMinutes + 30;
  // Convert to position relative to START_HOUR
  const startHour = Math.floor(startMinutes / 60);
  const startMinuteOffset = startMinutes % 60;

  // Check if event is within visible range (8am to midnight)
  const isVisible = startHour >= START_HOUR && startHour < END_HOUR;
  if (!isVisible) return null;

  const positionHours = hourToPosition(startHour) + startMinuteOffset / 60;
  const top = 16 + positionHours * HOUR_HEIGHT;
  // Clamp end time to midnight for height calculation
  const clampedEndMinutes = Math.min(endMinutes, END_HOUR * 60);
  const durationMinutes = clampedEndMinutes - startMinutes;
  const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 28);

  const isShort = height < 50;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDefault) {
      onEdit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="absolute z-10"
      style={{ top, left: 0, right: 0 }}
      onClick={handleClick}
    >
      {/* Connector dot on timeline */}
      <div
        className="absolute rounded-full z-20"
        style={{
          width: 9,
          height: 9,
          left: -3,
          top: height / 2 - 4.5,
          background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
          boxShadow: `0 0 8px ${color}60`,
          border: `2px solid ${isDark ? "#18181b" : "#ffffff"}`,
        }}
      />

      {/* Connector line */}
      <div
        className="absolute h-[2px]"
        style={{
          left: 6,
          width: 10,
          top: height / 2 - 1,
          background: `linear-gradient(90deg, ${color} 0%, ${color}60 100%)`,
        }}
      />

      {/* Event card */}
      <div
        className={`absolute rounded-xl overflow-hidden ${!isDefault ? "cursor-pointer active:scale-[0.98] transition-transform" : ""}`}
        style={{
          left: 20,
          right: 0,
          top: 0,
          height,
          backgroundColor: isDark ? "#1a1a1d" : "#fafafa",
          border: `1px solid ${color}30`,
          boxShadow: `0 4px 12px ${color}15`,
        }}
      >
        {/* Colored overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? `linear-gradient(135deg, ${color}25 0%, ${color}12 100%)`
              : `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
          }}
        />
        <div
          className={`relative z-10 flex items-center h-full px-3 ${
            isShort ? "gap-2" : "gap-3"
          }`}
        >
          {/* Category Icon */}
          {IconComponent && (
            <div
              className={`rounded-lg flex items-center justify-center shrink-0 ${
                isShort ? "w-6 h-6" : "w-8 h-8"
              }`}
              style={{
                background: `linear-gradient(135deg, ${color}35 0%, ${color}20 100%)`,
              }}
            >
              <IconComponent
                className={isShort ? "h-3 w-3" : "h-4 w-4"}
                style={{ color }}
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <p
              className={`font-semibold truncate ${
                isShort ? "text-xs" : "text-sm"
              }`}
              style={{
                color: isDark
                  ? color
                  : `color-mix(in srgb, ${color} 85%, black)`,
              }}
            >
              {event.title}
            </p>
            {!isShort && (
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {formatTime12h(event.start_time)}
                {event.end_time && ` → ${formatTime12h(event.end_time)}`}
              </p>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
}
