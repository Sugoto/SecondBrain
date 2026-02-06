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
        className="sm:max-w-xs max-h-[90vh] overflow-y-auto rounded-xl border-[1.5px] border-black dark:border-white shadow-[4px_4px_0_#1a1a1a] dark:shadow-[4px_4px_0_#FFFBF0]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-2 border-b-[1.5px] border-black dark:border-white -mx-5 -mt-5 px-4 pt-4 mb-3 bg-pastel-purple rounded-t-xl">
          <DialogTitle className="flex items-center gap-1.5 text-sm font-bold text-black dark:text-white">
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* All fields in one compact row */}
          <div className="grid grid-cols-4 gap-2">
            {/* Height */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground flex items-center gap-0.5 uppercase">
                <Ruler className="h-2.5 w-2.5" /> cm
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
                className="font-mono h-7 text-xs text-center border-[1.5px] border-black dark:border-white rounded-md font-bold"
                placeholder="175"
              />
            </div>

            {/* Weight */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground flex items-center gap-0.5 uppercase">
                <Scale className="h-2.5 w-2.5" /> kg
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
                className="font-mono h-7 text-xs text-center border-[1.5px] border-black dark:border-white rounded-md font-bold"
                placeholder="70"
              />
            </div>

            {/* Age */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground flex items-center gap-0.5 uppercase">
                <Calendar className="h-2.5 w-2.5" /> yrs
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
                className="font-mono h-7 text-xs text-center border-[1.5px] border-black dark:border-white rounded-md font-bold"
                placeholder="25"
              />
            </div>

            {/* Gender Toggle */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground flex items-center gap-0.5 uppercase">
                <User className="h-2.5 w-2.5" /> Sex
              </label>
              <button
                type="button"
                onClick={() =>
                  setValues((prev) => ({
                    ...prev,
                    gender: prev.gender === "male" ? "female" : "male",
                  }))
                }
                className="h-7 w-full rounded-md border-[1.5px] border-black dark:border-white bg-pastel-pink flex items-center justify-center transition-all hover:shadow-[1.5px_1.5px_0_#1a1a1a] dark:hover:shadow-[1.5px_1.5px_0_#FFFBF0]"
              >
                <span className="text-sm font-bold text-black dark:text-white">
                  {values.gender === "female" ? "♀" : "♂"}
                </span>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-9 rounded-lg text-xs font-bold transition-all border-[1.5px] border-black dark:border-white bg-pastel-green text-black shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0] hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] hover:shadow-[2.5px_2.5px_0_#1a1a1a] dark:hover:shadow-[2.5px_2.5px_0_#FFFBF0] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
