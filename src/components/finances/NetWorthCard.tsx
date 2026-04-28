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
      className="w-full rounded-2xl bg-primary-container px-5 py-4 text-left transition-opacity active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-label-m mb-1">Net Worth</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-headline-s font-mono">
              <AnimatedNumber value={netWorth} formatFn={formatCurrency} animateOnMount />
            </p>
            {dailySalary && (
              <span className="text-label-s font-mono px-2 py-0.5 rounded-full bg-on-primary-container/10">
                +{formatCurrency(dailySalary)}/d
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 opacity-60" />
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
    } catch (err) {
      console.error("Failed to update:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm max-h-[85vh] overflow-y-auto rounded-3xl border-0 bg-surface-container-high shadow-xl p-6"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="mb-2">
          <DialogTitle className="text-headline-s text-foreground">Edit Assets</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {ASSET_CATEGORIES.map((cat) => (
            <div key={cat.key} className="space-y-1">
              <label className="text-label-m text-muted-foreground">{cat.label}</label>
              <Input
                type="number"
                value={values[cat.key]}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [cat.key]: e.target.value }))
                }
                className="font-mono h-10 text-body-m bg-surface-container-low border border-outline-variant rounded-lg"
              />
            </div>
          ))}

          <div className="space-y-1 pt-2 border-t border-outline-variant">
            <label className="text-label-m text-muted-foreground">Monthly Salary</label>
            <Input
              type="number"
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(e.target.value)}
              className="font-mono h-10 text-body-m bg-surface-container-low border border-outline-variant rounded-lg"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 rounded-full text-label-l bg-primary text-primary-foreground disabled:opacity-50 active:scale-[0.98] transition-transform mt-2"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
