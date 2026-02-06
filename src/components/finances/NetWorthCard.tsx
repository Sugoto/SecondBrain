import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronRight } from "lucide-react";
import { formatCurrency } from "./constants";
import { supabase, type UserStats } from "@/lib/supabase";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { toast } from "sonner";

// Asset categories
const ASSET_CATEGORIES = [
  { key: "bank_savings" as const, label: "Bank Savings" },
  { key: "fixed_deposits" as const, label: "Fixed Deposits" },
  { key: "mutual_funds" as const, label: "Mutual Funds" },
  { key: "ppf" as const, label: "PPF" },
  { key: "epf" as const, label: "EPF" },
] as const;

type AssetKey = (typeof ASSET_CATEGORIES)[number]["key"];

interface NetWorthCardProps {
  netWorth: number;
  onEdit: () => void;
}

export function NetWorthCard({ netWorth, onEdit }: NetWorthCardProps) {
  return (
    <button
      onClick={onEdit}
      className="w-full rounded-xl bg-pastel-green p-4 text-left neo-brutal"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-black/60 dark:text-white/60 font-bold uppercase tracking-wide mb-1">
            Net Worth
          </p>
          <p className="text-2xl font-bold text-black dark:text-white font-mono">
            <AnimatedNumber value={netWorth} formatFn={formatCurrency} animateOnMount />
          </p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center border-2 border-black dark:border-white">
          <ChevronRight className="h-5 w-5 text-black dark:text-white" />
        </div>
      </div>
    </button>
  );
}

interface NetWorthEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userStats: UserStats | null;
  onUpdate: (updated: UserStats) => void;
}

export function NetWorthEditDialog({
  open,
  onOpenChange,
  userStats,
  onUpdate,
}: NetWorthEditDialogProps) {
  const [values, setValues] = useState<Record<AssetKey, string>>({
    bank_savings: "0",
    fixed_deposits: "0",
    mutual_funds: "0",
    ppf: "0",
    epf: "0",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && userStats) {
      setValues({
        bank_savings: (userStats.bank_savings || 0).toString(),
        fixed_deposits: (userStats.fixed_deposits || 0).toString(),
        mutual_funds: (userStats.mutual_funds || 0).toString(),
        ppf: (userStats.ppf || 0).toString(),
        epf: (userStats.epf || 0).toString(),
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
        bank_savings: parseFloat(values.bank_savings) || 0,
        fixed_deposits: parseFloat(values.fixed_deposits) || 0,
        mutual_funds: parseFloat(values.mutual_funds) || 0,
        ppf: parseFloat(values.ppf) || 0,
        epf: parseFloat(values.epf) || 0,
      };

      const { error } = await supabase
        .from("user_stats")
        .update(updateData)
        .eq("id", userStats.id);
      if (error) throw error;

      onUpdate({ ...userStats, ...updateData });
      onOpenChange(false);
      toast.success("Assets updated");
    } catch (err) {
      console.error("Failed to update:", err);
      toast.error("Failed to update assets");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-black dark:border-white shadow-[6px_6px_0_#1a1a1a] dark:shadow-[6px_6px_0_#FFFBF0]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-3 border-b-2 border-black dark:border-white -mx-6 -mt-6 px-6 pt-6 mb-4 bg-pastel-green rounded-t-2xl">
          <DialogTitle className="text-lg font-bold text-black dark:text-white">Edit Assets</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Asset Fields */}
          {ASSET_CATEGORIES.map((cat) => (
            <div key={cat.key} className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                {cat.label}
              </label>
              <Input
                type="number"
                value={values[cat.key]}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [cat.key]: e.target.value,
                  }))
                }
                className="font-mono h-10 text-sm font-bold border-2 border-black dark:border-white rounded-lg"
              />
            </div>
          ))}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-xl text-sm font-bold transition-all border-2 border-black dark:border-white bg-pastel-blue text-black shadow-[3px_3px_0_#1a1a1a] dark:shadow-[3px_3px_0_#FFFBF0] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#1a1a1a] dark:hover:shadow-[4px_4px_0_#FFFBF0] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
