import { useState, type ComponentProps } from "react";
import { Plus, AlertTriangle, GripVertical } from "lucide-react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { useWorkouts, type Workout } from "@/hooks/useWorkouts";
import { WorkoutDialog } from "./WorkoutDialog";
import { today } from "@/lib/utils";

const DAYS = [
  { label: "Mon", session: "Push" as const },
  { label: "Tue", session: "Pull" as const },
  { label: "Wed", session: "Legs" as const },
  { label: "Thu", session: "Push" as const },
  { label: "Fri", session: "Pull" as const },
];

const { dayOfWeek } = today();
const isRestDay = dayOfWeek > 5;
const todayIndex = isRestDay ? 0 : dayOfWeek - 1;

function SortableRow({
  w,
  index,
  isLast,
  onEdit,
}: {
  w: Workout;
  index: number;
  isLast: boolean;
  onEdit: (w: Workout) => void;
}) {
  const { ref, handleRef, isDragging } = useSortable({ id: w.id, index });

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className={`flex items-center gap-2 ${isLast ? "" : "border-b border-foreground/15"}`}
    >
      <button
        type="button"
        ref={handleRef}
        className="shrink-0 text-muted-foreground/30 hover:text-muted-foreground/60 touch-none py-3"
      >
        <GripVertical className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={() => onEdit(w)}
        className="flex-1 flex items-center justify-between gap-4 py-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-foreground truncate">{w.name}</p>
          {w.muscle_group && (
            <p className="text-[11px] text-muted-foreground/60">{w.muscle_group}</p>
          )}
        </div>
        <span className="flex items-center gap-2 shrink-0">
          {Date.now() - new Date(w.updated_at).getTime() > 14 * 24 * 60 * 60 * 1000 && (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" strokeWidth={1.5} />
          )}
          <span className="font-mono tabular-nums text-[16px] text-foreground">
            {w.max_weight}
            <span className="text-muted-foreground/60 text-[11px] ml-1">kg</span>
          </span>
        </span>
      </button>
    </div>
  );
}

export function WorkoutsView() {
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useWorkouts();
  const [activeDay, setActiveDay] = useState(todayIndex);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Workout | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderOverrides, setOrderOverrides] = useState<Record<string, string[]>>(() => {
    try {
      const stored = localStorage.getItem("workout-order");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const openEdit = (w: Workout) => {
    setEditing(w);
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditing(null);
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
    muscle_group: string;
  }) => {
    setSubmitting(true);
    try {
      if (editing) await updateWorkout(editing.id, values);
      else await addWorkout({ ...values, session });
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
    const id = editing.id;
    setDialogOpen(false);
    setEditing(null);
    await deleteWorkout(id).catch((err) => console.error("Failed to delete workout:", err));
  };

  const session = DAYS[activeDay].session.toLowerCase() as "push" | "pull" | "legs";

  const filtered = workouts.filter((w) => w.session === session);
  const orderKey = `${DAYS[activeDay].label}-${session}`;
  const order = orderOverrides[orderKey];
  const sorted = order
    ? [...filtered].sort((a, b) => {
        const ai = order.indexOf(a.id);
        const bi = order.indexOf(b.id);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      })
    : [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  const handleDragEnd: ComponentProps<typeof DragDropProvider>["onDragEnd"] = (event) => {
    if (event.canceled) return;
    const ids = sorted.map((w) => w.id);
    const moved = move(ids, event);
    if (moved.every((id, i) => id === ids[i])) return;
    setOrderOverrides((prev) => {
      const next = { ...prev, [orderKey]: moved };
      localStorage.setItem("workout-order", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div>
      <div className="flex border-b border-foreground/15">
        {DAYS.map((d, i) => (
          <button
            key={d.label}
            type="button"
            onClick={() => setActiveDay(i)}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors ${
              activeDay === i
                ? "text-foreground border-b-2 border-foreground -mb-px"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            <span
              className={`text-[10px] uppercase tracking-wider ${
                !isRestDay && i === todayIndex ? "text-foreground" : ""
              }`}
            >
              {d.label}
            </span>
            <span
              className={`text-[9px] uppercase tracking-widest ${
                activeDay === i ? "text-foreground/60" : "text-muted-foreground/50"
              }`}
            >
              {d.session}
            </span>
          </button>
        ))}
      </div>

      <section className="px-6 pt-6 pb-2">
        {sorted.length === 0 ? (
          <p className="text-[13px] text-muted-foreground/70 py-2">
            No exercises yet. Add one below.
          </p>
        ) : (
          <DragDropProvider onDragEnd={handleDragEnd}>
            {sorted.map((w, i) => (
              <SortableRow
                key={w.id}
                w={w}
                index={i}
                isLast={i === sorted.length - 1}
                onEdit={openEdit}
              />
            ))}
          </DragDropProvider>
        )}
      </section>

      <div className="px-6 py-6 border-t border-foreground/30 mt-4">
        <button
          type="button"
          onClick={openAdd}
          className="w-full h-11 rounded-lg border border-outline-variant flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          Add exercise
        </button>
      </div>

      {isRestDay && (
        <div className="px-6 pb-6 border-t border-foreground/15 pt-5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Rest day
          </p>
          <p className="text-[13px] text-muted-foreground/60">It's the weekend — recover well.</p>
        </div>
      )}

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
