import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Ruler,
  Scale,
  Calendar,
  User,
} from "lucide-react";
import { supabase, type UserStats } from "@/lib/supabase";

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
    } catch (err) {
      console.error("Failed to update:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl border-0 bg-surface-container-high shadow-xl p-6"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="mb-3">
          <DialogTitle className="text-headline-s text-foreground">Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <label className="text-label-m text-muted-foreground flex items-center gap-0.5">
                <Ruler className="h-3 w-3" /> cm
              </label>
              <Input
                type="number"
                value={values.height_cm ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    height_cm: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                className="font-mono h-10 text-body-m text-center bg-surface-container-low border border-outline-variant rounded-lg"
                placeholder="175"
              />
            </div>

            <div className="space-y-1">
              <label className="text-label-m text-muted-foreground flex items-center gap-0.5">
                <Scale className="h-3 w-3" /> kg
              </label>
              <Input
                type="number"
                value={values.weight_kg ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    weight_kg: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                className="font-mono h-10 text-body-m text-center bg-surface-container-low border border-outline-variant rounded-lg"
                placeholder="70"
              />
            </div>

            <div className="space-y-1">
              <label className="text-label-m text-muted-foreground flex items-center gap-0.5">
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
                className="font-mono h-10 text-body-m text-center bg-surface-container-low border border-outline-variant rounded-lg"
                placeholder="25"
              />
            </div>

            <div className="space-y-1">
              <label className="text-label-m text-muted-foreground flex items-center gap-0.5">
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
                className="h-10 w-full rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-center"
              >
                <span className="text-title-m text-foreground">
                  {values.gender === "female" ? "♀" : "♂"}
                </span>
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 rounded-full text-label-l bg-primary text-primary-foreground disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
