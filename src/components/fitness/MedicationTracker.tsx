import { motion } from "framer-motion";
import { Pill, Check, Loader2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useMedicationData, type Medication } from "@/hooks/useMedicationData";
import { Card } from "@/components/ui/card";

interface MedicationCardProps {
  medication: Medication;
  isTaken: boolean;
  isToggling: boolean;
  onToggle: () => void;
}

function MedicationCard({
  medication,
  isTaken,
  isToggling,
  onToggle,
}: MedicationCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      disabled={isToggling}
      className="w-full text-left"
    >
      <Card
        className="p-4 relative overflow-hidden transition-all duration-300"
        style={{
          background: isTaken
            ? isDark
              ? `linear-gradient(135deg, ${medication.color}20 0%, ${medication.color}10 100%)`
              : `linear-gradient(135deg, ${medication.color}15 0%, ${medication.color}08 100%)`
            : isDark
            ? "rgba(255, 255, 255, 0.03)"
            : "rgba(0, 0, 0, 0.02)",
          border: isTaken
            ? `1px solid ${medication.color}40`
            : isDark
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: isTaken ? `0 4px 20px ${medication.color}20` : "none",
        }}
      >
        {/* Glow effect when taken */}
        {isTaken && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 80% 20%, ${medication.color}15 0%, transparent 50%)`,
            }}
          />
        )}

        <div className="relative z-10 flex items-center gap-3">
          {/* Icon/Check Circle */}
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
            style={{
              background: isTaken
                ? `linear-gradient(135deg, ${medication.color} 0%, ${medication.color}cc 100%)`
                : isDark
                ? `${medication.color}20`
                : `${medication.color}15`,
              boxShadow: isTaken ? `0 4px 12px ${medication.color}40` : "none",
            }}
          >
            {isToggling ? (
              <Loader2
                className="h-5 w-5 animate-spin"
                style={{ color: isTaken ? "white" : medication.color }}
              />
            ) : isTaken ? (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Check className="h-6 w-6 text-white" />
              </motion.div>
            ) : (
              <Pill className="h-5 w-5" style={{ color: medication.color }} />
            )}
          </div>

          {/* Medication Info */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-sm truncate"
              style={{ color: isTaken ? medication.color : undefined }}
            >
              {medication.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {medication.dosage}
              {medication.notes && (
                <span className="text-muted-foreground/60">
                  {" "}
                  · {medication.notes}
                </span>
              )}
            </p>
          </div>

          {/* Status Badge */}
          <div
            className="px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider shrink-0"
            style={{
              background: isTaken
                ? `${medication.color}20`
                : isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.03)",
              color: isTaken ? medication.color : "var(--muted-foreground)",
            }}
          >
            {isTaken ? "Taken" : medication.schedule}
          </div>
        </div>
      </Card>
    </motion.button>
  );
}

export function MedicationTracker() {
  const {
    medications,
    loading,
    toggling,
    toggleMedication,
    isTakenToday,
  } = useMedicationData();

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Medication List */}
      <div className="space-y-3">
        {medications.map((medication, index) => (
          <motion.div
            key={medication.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.1,
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <MedicationCard
              medication={medication}
              isTaken={isTakenToday(medication.id)}
              isToggling={toggling === medication.id}
              onToggle={() => toggleMedication(medication.id)}
            />
          </motion.div>
        ))}
      </div>

    </div>
  );
}
