import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import type { Workout } from "@/hooks/useWorkouts";

const EYEBROW = "text-[10px] uppercase tracking-wider text-muted-foreground";

interface WorkoutDialogProps {
  open: boolean;
  initial?: Workout | null;
  onClose: () => void;
  onSubmit: (values: {
    name: string;
    max_weight: number;
    unit: "kg" | "lb";
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  isSubmitting: boolean;
}

export function WorkoutDialog({
  open,
  initial,
  onClose,
  onSubmit,
  onDelete,
  isSubmitting,
}: WorkoutDialogProps) {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "lb">("kg");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setWeight(initial.max_weight.toString());
      setUnit(initial.unit);
    } else {
      setName("");
      setWeight("");
      setUnit("kg");
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const parsed = parseFloat(weight);
    if (isNaN(parsed) || parsed < 0) return;
    await onSubmit({ name: name.trim(), max_weight: parsed, unit });
  };

  const title = initial ? "Edit workout" : "New workout";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isSubmitting && onClose()}>
      <DialogContent
        className="max-w-md w-[calc(100%-1.5rem)] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border border-outline-variant bg-background"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <p className={EYEBROW}>{title}</p>
          <DialogTitle className="sr-only">{title}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="px-6 pt-4 pb-4 overflow-y-auto flex-1 space-y-6">
            <div>
              <p className={`${EYEBROW} mb-2`}>Name</p>
              <input
                placeholder="Bench Press"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 text-[15px] text-foreground bg-transparent border-b border-outline-variant/60 focus:border-foreground transition-colors outline-none placeholder:text-muted-foreground/40"
                autoFocus={!initial}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <p className={`${EYEBROW} mb-2`}>Current max</p>
              <div className="flex items-baseline gap-2 border-b border-outline-variant/60 pb-2">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  disabled={isSubmitting}
                  className="flex-1 font-mono tabular-nums text-[40px] leading-none tracking-[-0.03em] text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                />
                <div className="grid grid-cols-2 border-y border-outline-variant divide-x divide-outline-variant">
                  {(["kg", "lb"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      disabled={isSubmitting}
                      className={`h-8 w-12 text-[10px] uppercase tracking-wider transition-colors ${
                        unit === u
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {onDelete && initial && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 h-10 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                Delete workout
              </button>
            )}
          </div>

          <div className="flex gap-2 px-6 pb-6 pt-3 shrink-0 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-lg border border-outline-variant text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !weight || isSubmitting}
              className="flex-1 h-11 rounded-lg bg-foreground text-background text-[11px] uppercase tracking-wider transition-opacity active:opacity-90 disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving
                </>
              ) : initial ? (
                "Save"
              ) : (
                "Add"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
