import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Workout } from "@/lib/supabase";
import { getCachedWorkouts, cacheWorkouts } from "@/lib/db";

// Pre-warm cache before React kicks in so the first render is instant
let cachedWorkoutsPromise: Promise<Workout[] | null> | null = null;
if (typeof window !== "undefined") {
  cachedWorkoutsPromise = getCachedWorkouts(true);
}

export type { Workout } from "@/lib/supabase";

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkouts = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("workouts")
        .select("*")
        .order("max_weight", { ascending: false });

      if (fetchError) throw fetchError;
      setWorkouts(data || []);
      setError(null);
      if (data) cacheWorkouts(data);
    } catch (err) {
      console.error("Failed to fetch workouts:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Hydrate from cache instantly, then revalidate from network
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await (cachedWorkoutsPromise ?? getCachedWorkouts(true));
      if (!cancelled && cached && cached.length > 0) {
        setWorkouts(cached);
        setLoading(false);
      }
      if (!cancelled) fetchWorkouts();
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchWorkouts]);

  const applyWorkouts = useCallback(
    (updater: (prev: Workout[]) => Workout[]) => {
      setWorkouts((prev) => {
        const next = updater(prev);
        cacheWorkouts(next);
        return next;
      });
    },
    [],
  );

  const addWorkout = useCallback(
    async (values: { name: string; max_weight: number; unit: "kg" | "lb" }) => {
      const { data, error: insertError } = await supabase
        .from("workouts")
        .insert(values)
        .select()
        .single();

      if (insertError) throw insertError;
      if (data) {
        applyWorkouts((prev) =>
          [...prev, data].sort((a, b) => b.max_weight - a.max_weight),
        );
      }
      return data;
    },
    [applyWorkouts],
  );

  const updateWorkout = useCallback(
    async (
      id: string,
      values: { name?: string; max_weight?: number; unit?: "kg" | "lb" },
    ) => {
      const { error: updateError } = await supabase
        .from("workouts")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (updateError) throw updateError;
      applyWorkouts((prev) =>
        prev
          .map((w) => (w.id === id ? { ...w, ...values } : w))
          .sort((a, b) => b.max_weight - a.max_weight),
      );
    },
    [applyWorkouts],
  );

  const deleteWorkout = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase
        .from("workouts")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
      applyWorkouts((prev) => prev.filter((w) => w.id !== id));
    },
    [applyWorkouts],
  );

  return { workouts, loading, error, addWorkout, updateWorkout, deleteWorkout };
}
