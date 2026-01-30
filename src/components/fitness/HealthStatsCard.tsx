import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

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
                className="h-9 w-full rounded-md border border-border bg-muted flex items-center justify-center transition-colors hover:bg-accent"
              >
                <span className="text-sm font-medium text-foreground">
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
