import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getMedicationLogsForDate,
  toggleMedicationLog,
  type MedicationLog,
} from "@/lib/db";

// Medication definitions - your personal medications
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  color: string; // For UI theming
  icon?: string; // Optional emoji or icon
  schedule: "morning" | "evening" | "both" | "anytime";
  notes?: string;
}

// Your medications
export const MEDICATIONS: Medication[] = [
  {
    id: "rosuvastatin",
    name: "Rosuvastatin",
    dosage: "10mg",
    color: "#ef4444", // Red
    schedule: "anytime",
    notes: "Cholesterol",
  },
  {
    id: "vitamin-d3-k2",
    name: "Vitamin D3 + K2",
    dosage: "4000 IU",
    color: "#f59e0b", // Amber/Yellow - like sunshine
    schedule: "anytime",
    notes: "Daily",
  },
  {
    id: "magnesium-glycinate",
    name: "Magnesium Glycinate",
    dosage: "400mg",
    color: "#8b5cf6", // Purple
    schedule: "evening",
    notes: "Sleep & Recovery",
  },
  {
    id: "omega-3",
    name: "Omega 3",
    dosage: "1000mg",
    color: "#b8860b", // Dark golden/oily color
    schedule: "anytime",
    notes: "Fish Oil",
  },
];

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useMedicationData() {
  const [todayLogs, setTodayLogs] = useState<Map<string, MedicationLog>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const today = useMemo(() => formatDateKey(new Date()), []);

  // Load logs on mount
  useEffect(() => {
    async function loadLogs() {
      try {
        const todayData = await getMedicationLogsForDate(today);

        const todayMap = new Map<string, MedicationLog>();
        todayData.forEach((log) => {
          todayMap.set(log.medicationId, log);
        });

        setTodayLogs(todayMap);
      } catch (error) {
        console.error("Failed to load medication logs:", error);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, [today]);

  const toggleMedication = useCallback(
    async (medicationId: string) => {
      setToggling(medicationId);

      try {
        const isTaken = await toggleMedicationLog(medicationId, today);

        // Update local state
        setTodayLogs((prev) => {
          const newMap = new Map(prev);
          if (isTaken) {
            newMap.set(medicationId, {
              id: `${medicationId}-${today}`,
              medicationId,
              date: today,
              takenAt: new Date().toISOString(),
            });
          } else {
            newMap.delete(medicationId);
          }
          return newMap;
        });

        return isTaken;
      } catch (error) {
        console.error("Failed to toggle medication:", error);
        throw error;
      } finally {
        setToggling(null);
      }
    },
    [today]
  );

  const isTakenToday = useCallback(
    (medicationId: string): boolean => {
      return todayLogs.has(medicationId);
    },
    [todayLogs]
  );

  return {
    medications: MEDICATIONS,
    loading,
    toggling,
    toggleMedication,
    isTakenToday,
  };
}
