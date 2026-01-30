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
      className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent/50 active:bg-accent"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
            Net Worth
          </p>
          <p className="text-base font-semibold text-foreground font-mono">
            <AnimatedNumber value={netWorth} formatFn={formatCurrency} animateOnMount />
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
        className="sm:max-w-xs max-h-[85vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="text-sm font-medium">Edit Assets</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {/* Asset Fields */}
          {ASSET_CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
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
                className="font-mono h-7 text-xs"
              />
            </div>
          ))}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-7 text-xs font-medium rounded bg-foreground text-background transition-colors hover:bg-foreground/90 disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
