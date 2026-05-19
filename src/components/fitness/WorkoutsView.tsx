import { useState } from "react";
import { Plus } from "lucide-react";
import { useWorkouts, type Workout } from "@/hooks/useWorkouts";
import { WorkoutDialog } from "./WorkoutDialog";

export function WorkoutsView() {
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useWorkouts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Workout | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (w: Workout) => {
    setEditing(w);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (submitting) return;
    setDialogOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (values: {
    name: string;
    max_weight: number;
    unit: "kg" | "lb";
  }) => {
    setSubmitting(true);
    try {
      if (editing) await updateWorkout(editing.id, values);
      else await addWorkout(values);
      setDialogOpen(false);
      setEditing(null);
    } catch (err) {
      console.error("Failed to save workout:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    setSubmitting(true);
    try {
      await deleteWorkout(editing.id);
      setDialogOpen(false);
      setEditing(null);
    } catch (err) {
      console.error("Failed to delete workout:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const sorted = [...workouts].sort((a, b) => b.max_weight - a.max_weight);

  return (
    <div>
      <section className="px-6 pt-6 pb-8">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">
          Lifts
        </p>

        {workouts.length === 0 ? (
          <p className="text-[13px] text-muted-foreground/70 py-2">
            No workouts tracked yet. Tap the button below to add one.
          </p>
        ) : (
          <div>
            {sorted.map((w, i) => (
              <button
                key={w.id}
                type="button"
                onClick={() => openEdit(w)}
                className={`w-full flex items-baseline justify-between gap-4 py-3 text-left transition-colors active:bg-surface-container-low/40 ${
                  i === sorted.length - 1
                    ? ""
                    : "border-b border-foreground/15"
                }`}
              >
                <p className="text-[13px] text-foreground truncate flex-1">
                  {w.name}
                </p>
                <span className="font-mono tabular-nums text-[16px] text-foreground shrink-0">
                  {w.max_weight}
                  <span className="text-muted-foreground/60 text-[11px] ml-1">
                    {w.unit}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="px-6 py-6 border-t border-foreground/30">
        <button
          type="button"
          onClick={openAdd}
          className="w-full h-11 rounded-lg border border-outline-variant flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          Add workout
        </button>
      </div>

      <WorkoutDialog
        open={dialogOpen}
        initial={editing}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        onDelete={editing ? handleDelete : undefined}
        isSubmitting={submitting}
      />
    </div>
  );
}
