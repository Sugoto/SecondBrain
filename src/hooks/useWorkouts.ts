import { useLiveQuery } from "@tanstack/react-db";
import { workoutsCollection } from "@/lib/collections";
import { deleteWithUndo } from "@/lib/undo";
import type { Workout } from "@/lib/supabase";

export type { Workout } from "@/lib/supabase";

export function useWorkouts() {
  const { data, isLoading, isError } = useLiveQuery((q) =>
    q.from({ w: workoutsCollection }).orderBy(({ w }) => w.max_weight, "desc"),
  );
  const workouts: Workout[] = data;

  const addWorkout = async (values: {
    name: string;
    max_weight: number;
    session: "push" | "pull" | "legs";
    muscle_group?: string;
  }) => {
    const now = new Date().toISOString();
    const workout: Workout = {
      muscle_group: null,
      ...values,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    await workoutsCollection.insert(workout).isPersisted.promise;
    return workout;
  };

  const updateWorkout = (
    id: string,
    values: { name?: string; max_weight?: number; muscle_group?: string },
  ) =>
    workoutsCollection.update(id, (draft) => {
      Object.assign(draft, values, { updated_at: new Date().toISOString() });
    }).isPersisted.promise;

  const deleteWorkout = (id: string) => deleteWithUndo(workoutsCollection, id, "Exercise deleted");

  return {
    workouts,
    loading: isLoading && workouts.length === 0,
    error: isError ? (workoutsCollection.utils.lastError as Error) : null,
    addWorkout,
    updateWorkout,
    deleteWorkout,
  };
}
