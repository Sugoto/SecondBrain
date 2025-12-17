import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Flame,
  ChevronRight,
  Ruler,
  Scale,
  Calendar,
  User,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { supabase, type UserStats } from "@/lib/supabase";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { toast } from "sonner";
import {
  calculateTDEE,
  calculateBMI,
  getBMICategory,
  formatNumber,
  getActivityLevelInfo,
} from "./utils";
import { useHealthData } from "@/hooks/useHealthData";

interface HealthStatsCardProps {
  userStats: UserStats | null;
  loading: boolean;
  onEdit: () => void;
}

export function HealthStatsCard({
  userStats,
  loading,
  onEdit,
}: HealthStatsCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { workoutDates } = useHealthData();

  // Calculate dynamic activity level based on workout frequency
  const activityInfo = useMemo(() => {
    return getActivityLevelInfo(workoutDates);
  }, [workoutDates]);

  const tdee = useMemo(() => {
    if (!userStats) return null;
    return calculateTDEE({
      height_cm: userStats.height_cm,
      weight_kg: userStats.weight_kg,
      age: userStats.age,
      gender: userStats.gender,
      activity_level: activityInfo.level, // Use dynamic activity level
    });
  }, [userStats, activityInfo.level]);

  const bmi = useMemo(() => {
    if (!userStats?.weight_kg || !userStats?.height_cm) return null;
    return calculateBMI(userStats.weight_kg, userStats.height_cm);
  }, [userStats]);

  const bmiCategory = bmi ? getBMICategory(bmi) : null;
  const hasHealthData =
    userStats?.height_cm &&
    userStats?.weight_kg &&
    userStats?.age &&
    userStats?.gender;

  return (
    <div className="sticky top-0 z-30 px-4 md:px-6 pt-3">
      <button
        onClick={onEdit}
        className="w-full max-w-6xl mx-auto px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{
          backgroundColor: isDark
            ? "rgba(24, 24, 27, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: isDark
            ? "0 4px 20px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)"
            : "0 4px 20px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.5)",
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: isDark
                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(20, 184, 166, 0.2) 100%)"
                : "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(20, 184, 166, 0.1) 100%)",
            }}
          >
            <Flame className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground font-medium">
              Daily Calories
            </p>
            {loading ? (
              <div className="h-5 w-24 bg-muted/50 rounded animate-pulse" />
            ) : tdee ? (
              <p
                className="text-sm font-bold font-mono text-emerald-500 truncate"
                style={{
                  textShadow: isDark
                    ? "0 0 12px rgba(16, 185, 129, 0.4)"
                    : "none",
                }}
              >
                <AnimatedNumber
                  value={tdee.targetCalories}
                  formatFn={formatNumber}
                />{" "}
                kcal
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Tap to set up</p>
            )}
          </div>
        </div>

        {/* Quick stats */}
        {hasHealthData && bmi && (
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <div className="text-center">
              <p className="text-muted-foreground text-[10px]">BMI</p>
              <p
                className="font-mono font-semibold"
                style={{ color: bmiCategory?.color }}
              >
                {bmi.toFixed(1)}
              </p>
            </div>
            {tdee && (
              <>
                <div className="text-center">
                  <p className="text-muted-foreground text-[10px]">Protein</p>
                  <p className="font-mono font-semibold text-amber-500">
                    {tdee.protein}g
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-[10px]">Carbs</p>
                  <p className="font-mono font-semibold text-blue-500">
                    {tdee.carbs}g
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>
    </div>
  );
}

interface HealthStatsEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userStats: UserStats | null;
  onUpdate: (updated: UserStats) => void;
}

export function HealthStatsEditDialog({
  open,
  onOpenChange,
  userStats,
  onUpdate,
}: HealthStatsEditDialogProps) {
  const [values, setValues] = useState({
    height_cm: null as number | null,
    weight_kg: null as number | null,
    age: null as number | null,
    gender: null as "male" | "female" | null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && userStats) {
      setValues({
        height_cm: userStats.height_cm,
        weight_kg: userStats.weight_kg,
        age: userStats.age,
        gender: userStats.gender,
      });
    }
  }, [open, userStats]);

  async function handleSave() {
    if (!userStats?.id) {
      toast.error("No user stats found");
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        height_cm: values.height_cm,
        weight_kg: values.weight_kg,
        age: values.age,
        gender: values.gender,
      };

      const { error } = await supabase
        .from("user_stats")
        .update(updateData)
        .eq("id", userStats.id);
      if (error) throw error;

      onUpdate({ ...userStats, ...updateData });
      onOpenChange(false);
      toast.success("Health stats updated");
    } catch (err) {
      console.error("Failed to update:", err);
      toast.error("Failed to update health stats");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-primary" />
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* All fields in one compact row */}
          <div className="grid grid-cols-4 gap-2">
            {/* Height */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 h-4">
                <Ruler className="h-3 w-3" /> cm
              </label>
              <Input
                type="number"
                value={values.height_cm ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    height_cm: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  }))
                }
                className="font-mono h-9 text-xs text-center"
                placeholder="175"
              />
            </div>

            {/* Weight */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 h-4">
                <Scale className="h-3 w-3" /> kg
              </label>
              <Input
                type="number"
                value={values.weight_kg ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    weight_kg: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  }))
                }
                className="font-mono h-9 text-xs text-center"
                placeholder="70"
              />
            </div>

            {/* Age */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 h-4">
                <Calendar className="h-3 w-3" /> yrs
              </label>
              <Input
                type="number"
                value={values.age ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    age: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                className="font-mono h-9 text-xs text-center"
                placeholder="25"
              />
            </div>

            {/* Gender Toggle */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 h-4">
                <User className="h-3 w-3" /> Sex
              </label>
              <button
                type="button"
                onClick={() =>
                  setValues((prev) => ({
                    ...prev,
                    gender: prev.gender === "male" ? "female" : "male",
                  }))
                }
                className="h-9 w-full rounded-md flex items-center justify-center transition-all active:scale-95"
                style={{
                  background:
                    values.gender === "female"
                      ? "linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(244, 114, 182, 0.15) 100%)"
                      : "linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(96, 165, 250, 0.15) 100%)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border:
                    values.gender === "female"
                      ? "1px solid rgba(236, 72, 153, 0.3)"
                      : "1px solid rgba(59, 130, 246, 0.3)",
                  boxShadow:
                    values.gender === "female"
                      ? "0 0 12px rgba(236, 72, 153, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      : "0 0 12px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                }}
              >
                <span
                  className="text-sm font-medium"
                  style={{
                    color:
                      values.gender === "female"
                        ? "rgb(236, 72, 153)"
                        : "rgb(59, 130, 246)",
                    textShadow:
                      values.gender === "female"
                        ? "0 0 8px rgba(236, 72, 153, 0.5)"
                        : "0 0 8px rgba(59, 130, 246, 0.5)",
                  }}
                >
                  {values.gender === "female" ? "♀" : "♂"}
                </span>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-9 text-xs"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
