import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { TimeEvent } from "@/lib/supabase";

const EVENTS_KEY = ["time-events"];

async function fetchEvents(): Promise<TimeEvent[]> {
  const { data, error } = await supabase
    .from("time_events")
    .select("*")
    .order("date", { ascending: false })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data || [];
}

async function addEvent(
  event: Omit<TimeEvent, "id" | "created_at">
): Promise<TimeEvent> {
  const { data, error } = await supabase
    .from("time_events")
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("time_events").delete().eq("id", id);
  if (error) throw error;
}

async function updateEvent(
  event: Partial<TimeEvent> & { id: string }
): Promise<TimeEvent> {
  const { id, ...updates } = event;
  const { data, error } = await supabase
    .from("time_events")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function useTimeEvents() {
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: EVENTS_KEY,
    queryFn: fetchEvents,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const addMutation = useMutation({
    mutationFn: addEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
    },
  });

  return {
    events,
    isLoading,
    addEvent: addMutation.mutateAsync,
    updateEvent: updateMutation.mutateAsync,
    deleteEvent: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Helper to get events for a specific date
export function getEventsForDate(events: TimeEvent[], date: string) {
  return events
    .filter((e) => e.date === date)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
}

// Format time for display (24h -> 12h)
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

