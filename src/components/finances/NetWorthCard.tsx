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
  monthlyIncome: number | null;
  onEdit: () => void;
}

export function NetWorthCard({ netWorth, monthlyIncome, onEdit }: NetWorthCardProps) {
  const dailySalary = monthlyIncome ? Math.round(monthlyIncome / 22) : null;

  return (
    <button
      onClick={onEdit}
      className="w-full rounded-xl bg-card border border-border p-3 text-left transition-colors hover:bg-accent/50"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-0.5">
            Net Worth
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-foreground font-mono">
              <AnimatedNumber value={netWorth} formatFn={formatCurrency} animateOnMount />
            </p>
            {dailySalary && (
              <span className="text-xs font-bold font-mono text-green-700 dark:text-green-400">
                +{formatCurrency(dailySalary)}/d
              </span>
            )}
          </div>
        </div>
        <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center border border-border">
          <ChevronRight className="h-3.5 w-3.5 text-foreground" />
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
  const [monthlySalary, setMonthlySalary] = useState("0");
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
      setMonthlySalary((userStats.monthly_income || 0).toString());
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
        monthly_income: parseFloat(monthlySalary) || 0,
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
        className="sm:max-w-xs max-h-[85vh] overflow-y-auto rounded-xl border border-border shadow-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-2 border-b border-border -mx-5 -mt-5 px-4 pt-4 mb-3 bg-muted rounded-t-xl">
          <DialogTitle className="text-sm font-bold text-foreground">Edit Assets</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {/* Asset Fields */}
          {ASSET_CATEGORIES.map((cat) => (
            <div key={cat.key} className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
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
                className="font-mono h-7 text-xs font-bold border border-border rounded-md"
              />
            </div>
          ))}

          {/* Monthly Salary */}
          <div className="space-y-1 pt-1 border-t border-border">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Monthly Salary
            </label>
            <Input
              type="number"
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(e.target.value)}
              className="font-mono h-7 text-xs font-bold border border-border rounded-md"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-9 rounded-lg text-xs font-bold transition-all bg-foreground text-background hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-1.5"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
