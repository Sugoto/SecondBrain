import { useState } from "react";
import {
  Loader2,
  Briefcase,
  BookOpen,
  Dumbbell,
  Users,
  Car,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { useTimeEvents } from "@/hooks/useTimeEvents";
import { EVENT_CATEGORIES } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate: string;
  initialStartTime?: string;
  initialEndTime?: string;
}

export function EventDialog({
  open,
  onOpenChange,
  initialDate,
  initialStartTime,
  initialEndTime,
}: EventDialogProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { addEvent, isAdding } = useTimeEvents();

  // Initialize with provided time or current time
  const getDefaultStartTime = () => {
    if (initialStartTime) return initialStartTime;
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
  };

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(getDefaultStartTime);
  const [endTime, setEndTime] = useState(initialEndTime || "");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");

  const selectedCat = EVENT_CATEGORIES.find((c) => c.id === category);
  const categoryColor = selectedCat?.color || "#14b8a6";
  const SelectedIcon = selectedCat ? CATEGORY_ICONS[selectedCat.icon] : null;
  const hasCategory = !!category;

  const handleSubmit = async () => {
    if (!title.trim() || isAdding) return;

    await addEvent({
      title: title.trim(),
      date: initialDate,
      start_time: startTime,
      end_time: endTime || null,
      category,
      notes: notes.trim() || null,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isAdding && onOpenChange(o)}>
      <DialogContent
        className="max-w-md w-[calc(100%-2rem)] rounded-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 border bg-background"
        onOpenAutoFocus={(e) => e.preventDefault()}
        style={{
          borderColor: `${categoryColor}30`,
          boxShadow: `0 25px 50px -12px ${categoryColor}30, 0 0 0 1px ${categoryColor}20`,
        }}
      >
        {/* Colored header - icon left, title centered */}
        <DialogHeader
          className="shrink-0 px-4 pt-4 pb-3 relative"
          style={{
            background: isDark
              ? `linear-gradient(135deg, ${categoryColor}25 0%, ${categoryColor}10 100%)`
              : `linear-gradient(135deg, ${categoryColor}18 0%, ${categoryColor}08 100%)`,
            boxShadow: `0 8px 24px -8px ${categoryColor}40`,
          }}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${categoryColor}12 0%, transparent 60%)`,
            }}
          />

          <div className="flex items-center relative z-10 min-h-[40px]">
            {/* Category icon - left side (only show when category selected) */}
            {hasCategory && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={category}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: isDark
                      ? `linear-gradient(135deg, ${categoryColor}40 0%, ${categoryColor}25 100%)`
                      : `linear-gradient(135deg, ${categoryColor}30 0%, ${categoryColor}18 100%)`,
                    boxShadow: `0 4px 12px ${categoryColor}30`,
                  }}
                >
                  {SelectedIcon && (
                    <SelectedIcon
                      className="h-5 w-5"
                      style={{
                        color: isDark
                          ? categoryColor
                          : `color-mix(in srgb, ${categoryColor} 80%, black)`,
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Title - centered */}
            <div className={`flex-1 text-center ${hasCategory ? "pr-10" : ""}`}>
              <DialogTitle
                className="text-base font-bold"
                style={{
                  color: hasCategory
                    ? isDark
                      ? categoryColor
                      : `color-mix(in srgb, ${categoryColor} 75%, black)`
                    : undefined,
                }}
              >
                {selectedCat?.label || "New Event"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {new Date(initialDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 px-4 py-3 overflow-y-auto flex-1">
          {/* Category Selection - Grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {EVENT_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.icon];
              const isSelected = category === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  disabled={isAdding}
                  className="h-9 rounded-md flex items-center justify-center border transition-all duration-100 active:scale-95"
                  style={{
                    background: isSelected
                      ? isDark
                        ? `linear-gradient(135deg, ${cat.color}45 0%, ${cat.color}25 100%)`
                        : `linear-gradient(135deg, ${cat.color}30 0%, ${cat.color}15 100%)`
                      : isDark
                      ? "hsl(var(--muted) / 0.3)"
                      : "hsl(var(--muted) / 0.5)",
                    borderColor: isSelected
                      ? cat.color
                      : isDark
                      ? `${cat.color}25`
                      : `${cat.color}20`,
                    boxShadow: isSelected ? `0 2px 8px ${cat.color}30` : "none",
                  }}
                >
                  <Icon
                    className="h-4 w-4"
                    style={{
                      color: isSelected
                        ? isDark
                          ? "#fff"
                          : `color-mix(in srgb, ${cat.color} 90%, black)`
                        : isDark
                        ? cat.color
                        : `color-mix(in srgb, ${cat.color} 65%, black)`,
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Title
            </Label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you doing?"
              className="h-10"
              style={{ borderColor: `${categoryColor}20` }}
              disabled={isAdding}
            />
          </div>

          {/* Time Row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Start
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-10"
                style={{ borderColor: `${categoryColor}20` }}
                disabled={isAdding}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                End
              </Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-10"
                style={{ borderColor: `${categoryColor}20` }}
                disabled={isAdding}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notes
            </Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional details..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
              style={{ borderColor: `${categoryColor}20` }}
              disabled={isAdding}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-4 py-3 shrink-0 border-t"
          style={{
            borderColor: `${categoryColor}20`,
            background: isDark
              ? `linear-gradient(180deg, transparent 0%, ${categoryColor}08 100%)`
              : `linear-gradient(180deg, transparent 0%, ${categoryColor}05 100%)`,
          }}
        >
          <Button
            variant="outline"
            className="flex-1 h-10"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-10 font-semibold"
            style={{
              background: `linear-gradient(135deg, ${categoryColor} 0%, color-mix(in srgb, ${categoryColor} 80%, black) 100%)`,
              boxShadow: `0 4px 12px ${categoryColor}40`,
            }}
            onClick={handleSubmit}
            disabled={!title.trim() || !category || isAdding}
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Event"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
